/**
 * VNH Pharmaceuticals — Supabase Image Upload Script
 * ─────────────────────────────────────────────────────
 * Uploads local product images to Supabase Storage and
 * registers them in the product_images table.
 *
 * IMAGE RULE (enforced):
 *   sort_order = 1  → FRONT image (image_type = 'front',  is_primary = true)
 *   sort_order = 2  → BACK  image (image_type = 'back')
 *   sort_order = 3+ → Gallery     (image_type = 'gallery')
 *
 * Usage:
 *   node supabase/upload-product-images.mjs
 *
 * Local folder expected:
 *   assets/product-images/
 *     tangi-iron-drops-15ml/
 *       01-front.png    ← always first → sort_order = 1
 *       02-back.png     ← sort_order = 2
 *       03-gallery.png  ← sort_order = 3
 *     floravate-gg-15ml/
 *       01-front.png
 *       ...
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://dfnssoeoezzltuomcpkq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';
const BUCKET               = 'product-assets';
const LOCAL_IMAGES_DIR     = join(__dirname, '../assets/product-images');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getImageType(sortOrder) {
  if (sortOrder === 1) return 'front';
  if (sortOrder === 2) return 'back';
  return 'gallery';
}

function getMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  const map = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
  };
  return map[ext] ?? 'image/jpeg';
}

async function uploadProductImages() {
  console.log('\n📸  VNH Pharmaceuticals — Image Upload');
  console.log('══════════════════════════════════════\n');

  if (!existsSync(LOCAL_IMAGES_DIR)) {
    console.error(`❌  Image directory not found: ${LOCAL_IMAGES_DIR}`);
    console.log('\n💡  Create the folder structure:');
    console.log('    assets/product-images/{product-slug}/01-front.png');
    process.exit(1);
  }

  const productFolders = readdirSync(LOCAL_IMAGES_DIR).filter(
    f => statSync(join(LOCAL_IMAGES_DIR, f)).isDirectory()
  );

  console.log(`📦  Found ${productFolders.length} product image folders\n`);

  for (const productSlug of productFolders) {
    // Lookup product in DB
    const { data: product } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('slug', productSlug)
      .limit(1)
      .single();

    if (!product) {
      console.warn(`⚠️   No product found for slug: ${productSlug} — skipping`);
      continue;
    }

    console.log(`\n🔄  Processing: ${product.name}`);

    const imageDir   = join(LOCAL_IMAGES_DIR, productSlug);
    const imageFiles = readdirSync(imageDir)
      .filter(f => ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extname(f).toLowerCase()))
      .sort();  // alphabetical = sort_order sequence (01-front, 02-back, ...)

    for (let i = 0; i < imageFiles.length; i++) {
      const filename  = imageFiles[i];
      const sortOrder = i + 1;              // 1-indexed
      const imageType = getImageType(sortOrder);
      const isPrimary = sortOrder === 1;

      // Storage path: front/tangi-iron-drops-15ml-01.webp
      const ext         = extname(filename);
      const storagePath = `${imageType}/${productSlug}-${String(sortOrder).padStart(2,'0')}${ext}`;
      const fileBuffer  = readFileSync(join(imageDir, filename));
      const mimeType    = getMimeType(filename);

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadErr) {
        console.error(`  ❌  Upload failed [${filename}]:`, uploadErr.message);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Upsert into product_images
      const { error: dbErr } = await supabase.from('product_images').upsert({
        product_id:   product.id,
        image_url:    publicUrl,
        storage_path: storagePath,
        alt_text:     `${product.name} — ${imageType} view`,
        image_type:   imageType,
        is_primary:   isPrimary,
        sort_order:   sortOrder,
      }, {
        onConflict: 'product_id,sort_order',
      });

      if (dbErr) {
        console.error(`  ❌  DB insert failed [${filename}]:`, dbErr.message);
      } else {
        console.log(`  ✅  sort_order=${sortOrder} [${imageType}]: ${storagePath}`);
        // DB trigger will auto-sync front_image_url and thumbnail_url on products table
        if (isPrimary) console.log(`      🎯  This is the FRONT image — auto-synced to products.front_image_url`);
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log('✅  Image upload complete!');
  console.log('\n💡  Reminder:');
  console.log('    - sort_order=1 images are auto-synced to products.front_image_url via DB trigger');
  console.log('    - These front images will automatically appear on all product cards and listings');
  console.log('    - No frontend code changes needed — data flows automatically\n');
}

uploadProductImages().catch(err => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
