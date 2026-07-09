/**
 * VNH Pharmaceuticals — Supabase Product Import Script
 * ─────────────────────────────────────────────────────
 * Parses the uploaded CSV and upserts all products into Supabase.
 *
 * Usage:
 *   node supabase/import-products.mjs
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js csv-parse
 *   Set environment variables (or edit the CONFIG block below):
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_KEY   ← use SERVICE ROLE key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { parse }        from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// CONFIG — edit or use env vars
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://dfnssoeoezzltuomcpkq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';
const CSV_FILE             = process.env.CSV_FILE             || join(__dirname, '../vnh_products_pediatrics_fixed.csv');
const DEFAULT_DIVISION     = 'pediatrics';   // fallback if division_slug is blank in CSV

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─────────────────────────────────────────────────────────────
// CSV Product catalogue — all 17 Pediatrics products
// Extended with composition-derived category mapping
// ─────────────────────────────────────────────────────────────
const MANUAL_PRODUCTS = [
  {
    name:         'Tangi Iron Drops 15ml',
    slug:         'tangi-iron-drops-15ml',
    division:     'pediatrics',
    category:     'iron-haematinics',
    composition:  'Liposomal Iron 5 mg, Folic Acid 30 mcg, Vitamin B12 0.9 mcg / 0.5 ml',
    short_desc:   'Advanced liposomal iron drops for infants and toddlers',
    packaging:    '15 ml Drop Bottle',
    pack_size:    '15 ml',
    is_featured:  true,
    sort_order:   1,
  },
  {
    name:         'Tangi Iron Syrup 200ml',
    slug:         'tangi-iron-syrup-200ml',
    division:     'pediatrics',
    category:     'iron-haematinics',
    composition:  'Liposomal Iron 10 mg, Folic Acid 50 mcg, Vitamin B12 1 mcg / 5 ml',
    short_desc:   'Liposomal iron syrup for children with enhanced bioavailability',
    packaging:    '200 ml Syrup Bottle',
    pack_size:    '200 ml',
    sort_order:   2,
  },
  {
    name:         'Tangi Iron Gummies',
    slug:         'tangi-iron-gummies-nan',
    division:     'pediatrics',
    category:     'iron-haematinics',
    composition:  'Ferric Pyrophosphate 13 mg (Fe standardised to 8% elemental iron)',
    short_desc:   'Tasty iron gummies for school-age children',
    packaging:    'Gummy Bottle',
    pack_size:    '30 gummies',
    sort_order:   3,
  },
  {
    name:         'Floravate GG 15ml',
    slug:         'floravate-gg-15ml',
    division:     'pediatrics',
    category:     'probiotics',
    composition:  'Lactobacillus rhamnosus GG, NLT 1 Billion cells / 0.5 ml',
    short_desc:   'Clinically validated Lactobacillus GG probiotic drops',
    packaging:    '15 ml Drop Bottle',
    pack_size:    '15 ml',
    is_featured:  true,
    sort_order:   4,
  },
  {
    name:         'Floravate-S 10ml',
    slug:         'floravate-s-10ml',
    division:     'pediatrics',
    category:     'probiotics',
    composition:  'Saccharomyces boulardii 2.5 billion / 5 ml',
    short_desc:   'Saccharomyces boulardii probiotic for gut health',
    packaging:    '10 ml Drops',
    pack_size:    '10 ml',
    sort_order:   5,
  },
  {
    name:         'Daily Solo Drops 30ml',
    slug:         'daily-solo-drops-30ml',
    division:     'pediatrics',
    category:     'multivitamins',
    composition:  'Vit. A 800 IU, Vit. D3 400 IU, Vit E 5 mg, Vit. K2-7 10 mcg, Vit. B1 0.5 mg, Vit. B6 0.5 mg, Vit. B12 1 mcg, Folic Acid 100 mcg, Vit. C 30 mg, Zinc 2 mg, Liposomal Iron 2 mg, Iodine 30 mcg, Selenium 5 mcg, Lutein 0.5 mg, DHA 25 mg, Inulin 25 mg, Probiotic 1 Billion CFU, Choline 20 mg / 1 ml',
    short_desc:   'Complete 18-in-1 daily multivitamin drops for infants',
    packaging:    '30 ml Drop Bottle',
    pack_size:    '30 ml',
    is_featured:  true,
    sort_order:   6,
  },
  {
    name:         'Daily Solo Syrup 100ml',
    slug:         'daily-solo-syrup-100ml',
    division:     'pediatrics',
    category:     'multivitamins',
    composition:  'Vit. A 1500 IU, Vit. D3 400 IU, Vit E 6 mg, Vit. K2-7 10 mcg, Vit. B1 0.8 mg, Vit. B6 1 mg, Vit. B12 2.2 mcg, Folic Acid 100 mcg, Vit. C 30 mg, Zinc 2 mg, Liposomal Iron 2 mg, Iodine 50 mcg, Selenium 5 mcg, Lutein 0.5 mg, DHA 25 mg, Inulin 25 mg, Probiotic 2 Billion CFU',
    short_desc:   'Comprehensive daily multivitamin syrup for growing children',
    packaging:    '100 ml Syrup Bottle',
    pack_size:    '100 ml',
    sort_order:   7,
  },
  {
    name:         'Losmo Flush-B 200ml',
    slug:         'losmo-flush-b-200ml',
    division:     'pediatrics',
    category:     'laxatives',
    composition:  'Bacillus coagulans 2 Billion CFU, Lactulose 10 gm / 15 ml',
    short_desc:   'Probiotic-lactulose combination for paediatric constipation',
    packaging:    '200 ml Syrup Bottle',
    pack_size:    '200 ml',
    sort_order:   8,
  },
  {
    name:         'Rutivate 5ml',
    slug:         'rutivate-5ml',
    division:     'pediatrics',
    category:     'probiotics',
    composition:  'Lactobacillus reuteri 100 Million CFU / 5 drops',
    short_desc:   'Lactobacillus reuteri drops for infant colic and gut health',
    packaging:    '5 ml Drop Bottle',
    pack_size:    '5 ml',
    sort_order:   9,
  },
  {
    name:         'Thedigi Soft 10ml',
    slug:         'thedigi-soft-10ml',
    division:     'pediatrics',
    category:     'digestive-enzymes',
    composition:  'Bacillus coagulans 500 Million CFU, Alpha amylase 20 mg, Papain 10 mg, Lactase 6 mg, Dill Oil 2 mg, Fennel Oil 0.0007 ml / 1 ml',
    short_desc:   'Multi-enzyme probiotic drops for infant digestion',
    packaging:    '10 ml Drop Bottle',
    pack_size:    '10 ml',
    sort_order:   10,
  },
  {
    name:         'Thedigi Soft 50ml',
    slug:         'thedigi-soft-50ml',
    division:     'pediatrics',
    category:     'digestive-enzymes',
    composition:  'Dry Syp: Bacillus coagulans 500 Million CFU, Alpha amylase 25 mg, Papain 10 mg, Lipase 1.5 mg / 5 ml',
    short_desc:   'Probiotic-enzyme dry syrup for digestive health',
    packaging:    '50 ml Dry Syrup Bottle',
    pack_size:    '50 ml',
    sort_order:   11,
  },
  {
    name:         'Thedigi 15ml',
    slug:         'thedigi-15ml',
    division:     'pediatrics',
    category:     'digestive-enzymes',
    composition:  'Alpha Amylase 20 mg, Papain 10 mg, Dill Oil 2 mg, Anise Oil 2 mg, Caraway Oil 2 mg / 1 ml',
    short_desc:   'Enzyme + aromatic oil drops to relieve infant colic and gas',
    packaging:    '15 ml Drop Bottle',
    pack_size:    '15 ml',
    sort_order:   12,
  },
  {
    name:         'Thedigi-Lact 15ml',
    slug:         'thedigi-lact-15ml',
    division:     'pediatrics',
    category:     'digestive-enzymes',
    composition:  'Lactase Enzyme 600 FCC units / 1 ml',
    short_desc:   'Lactase enzyme drops to manage lactose intolerance in infants',
    packaging:    '15 ml Drop Bottle',
    pack_size:    '15 ml',
    sort_order:   13,
  },
  {
    name:         'Tangical 15ml',
    slug:         'tangical-15ml',
    division:     'pediatrics',
    category:     'calcium-bone',
    composition:  'Liposomal Calcium 40 mg, Vitamin D3 400 IU, Vitamin K2-7 (MK-7) 10 mcg, Liposomal Magnesium 10 mg, Zinc 2 mg / 1 ml',
    short_desc:   'Liposomal calcium + D3 + K2 drops for infant bone development',
    packaging:    '15 ml Drop Bottle',
    pack_size:    '15 ml',
    is_featured:  true,
    sort_order:   14,
  },
  {
    name:         'Tangical Syrup 200ml',
    slug:         'tangical-syrup-200ml',
    division:     'pediatrics',
    category:     'calcium-bone',
    composition:  'Liposomal Calcium 350 mg, Vitamin D3 200 IU, Vitamin K2-7 12 mcg / 5 ml',
    short_desc:   'Liposomal calcium syrup for children\'s bone strength',
    packaging:    '200 ml Syrup Bottle',
    pack_size:    '200 ml',
    sort_order:   15,
  },
  {
    name:         'Colanese-Peg 200ml',
    slug:         'colanese-peg-200ml',
    division:     'pediatrics',
    category:     'laxatives',
    composition:  'Polyethylene Glycol 4000 — 10 gm / 25 ml',
    short_desc:   'PEG 4000 solution for safe paediatric bowel management',
    packaging:    '200 ml Bottle',
    pack_size:    '200 ml',
    sort_order:   16,
  },
  {
    name:         'TANGI-IQ 200ml',
    slug:         'tangi-iq-200ml',
    division:     'pediatrics',
    category:     'brain-neuro',
    composition:  'L-carnosine 100 mg, DHA 335 mg & Vitamin D3 400 IU / 5 ml',
    short_desc:   'Brain development syrup with DHA, L-carnosine and Vitamin D3',
    packaging:    '200 ml Syrup Bottle',
    pack_size:    '200 ml',
    is_featured:  true,
    sort_order:   17,
  },
];

// ─────────────────────────────────────────────────────────────
// MAIN IMPORT FUNCTION
// ─────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🏥  VNH Pharmaceuticals — Supabase Product Import');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Load divisions
  const { data: divisions, error: divErr } = await supabase
    .from('divisions').select('id, slug');
  if (divErr) { console.error('❌  Could not load divisions:', divErr.message); process.exit(1); }

  const divisionMap = Object.fromEntries(
    (divisions ?? []).map(d => [d.slug, d.id])
  );
  console.log('✅  Divisions loaded:', Object.keys(divisionMap));

  // 2. Load categories
  const { data: categories, error: catErr } = await supabase
    .from('categories').select('id, slug');
  if (catErr) { console.error('❌  Could not load categories:', catErr.message); process.exit(1); }

  const categoryMap = Object.fromEntries(
    (categories ?? []).map(c => [c.slug, c.id])
  );
  console.log('✅  Categories loaded:', Object.keys(categoryMap));

  // 3. Upsert products
  let inserted = 0, updated = 0, failed = 0;

  for (const row of MANUAL_PRODUCTS) {
    const divisionId = divisionMap[row.division ?? DEFAULT_DIVISION];
    const categoryId = categoryMap[row.category ?? ''];

    if (!divisionId) {
      console.warn(`⚠️   Division not found for "${row.name}" (slug: ${row.division})`);
      failed++;
      continue;
    }

    const payload = {
      name:        row.name,
      slug:        row.slug,
      division_id: divisionId,
      category_id: categoryId ?? null,
      composition: row.composition ?? null,
      short_desc:  row.short_desc  ?? null,
      packaging:   row.packaging   ?? null,
      pack_size:   row.pack_size   ?? null,
      is_featured: row.is_featured ?? false,
      is_active:   true,
      status:      'active',
      sort_order:  row.sort_order  ?? 0,
    };

    // Check if already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', row.slug)
      .limit(1)
      .single();

    if (existing?.id) {
      // UPDATE
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.error(`❌  Update failed [${row.name}]:`, error.message);
        failed++;
      } else {
        console.log(`🔄  Updated:  ${row.name}`);
        updated++;

        // If is_featured, ensure featured_products entry exists
        if (row.is_featured) {
          await supabase.from('featured_products').upsert({
            product_id: existing.id,
            section:    'homepage',
            sort_order: row.sort_order ?? 0,
            is_active:  true,
          }, { onConflict: 'product_id,section' });
        }
      }
    } else {
      // INSERT
      const { data: inserted_row, error } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error(`❌  Insert failed [${row.name}]:`, error.message);
        failed++;
      } else {
        console.log(`✅  Inserted: ${row.name}`);
        inserted++;

        // If is_featured, create featured_products entry
        if (row.is_featured && inserted_row?.id) {
          await supabase.from('featured_products').upsert({
            product_id: inserted_row.id,
            section:    'homepage',
            sort_order: row.sort_order ?? 0,
            is_active:  true,
          }, { onConflict: 'product_id,section' });
        }
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`📊  Summary:`);
  console.log(`    ✅  Inserted : ${inserted}`);
  console.log(`    🔄  Updated  : ${updated}`);
  console.log(`    ❌  Failed   : ${failed}`);
  console.log(`    📦  Total    : ${MANUAL_PRODUCTS.length}`);
  console.log('═══════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉  All products imported successfully!\n');
    console.log('👉  Next steps:');
    console.log('    1. Upload product images to Supabase Storage bucket: product-assets');
    console.log('       Folder structure:');
    console.log('         product-assets/front/   ← front view  (sort_order=1)');
    console.log('         product-assets/back/    ← back view   (sort_order=2)');
    console.log('         product-assets/gallery/ ← extra views (sort_order=3+)');
    console.log('    2. Insert image URLs into product_images table (use the image uploader script)');
    console.log('    3. The DB trigger will auto-sync front_image_url to products table\n');
  }
}

run().catch(err => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
