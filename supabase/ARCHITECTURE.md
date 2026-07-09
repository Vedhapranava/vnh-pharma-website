# VNH Pharmaceuticals — Backend Architecture Guide

> **Scope:** Supabase backend, product data model, Angular integration, storage, import workflow.  
> **No UI changes.** This document covers data layer only.

---

## 1. Database Structure

### Tables

| Table | Purpose |
|---|---|
| `divisions` | Top-level product divisions (Pediatrics, Nutraceuticals, etc.) |
| `categories` | Sub-groups within a division (Iron & Haematinics, Probiotics, etc.) |
| `products` | Core product record with all medical + commercial fields |
| `product_images` | Ordered images per product. sort_order=1 is ALWAYS the front/hero image |
| `featured_products` | Explicit control over homepage featured slots |
| `product_documents` | PDFs, brochures, certificates |

### Key Relations

```
divisions  ──┬── categories ──── products ──── product_images
             └─────────────────────┘           product_documents
                                   └── featured_products
```

---

## 2. The Front Image Rule (CRITICAL)

**sort_order = 1 is ALWAYS the FRONT view image.**

This is enforced at three layers:

1. **Database constraint** — `uq_product_front_image` unique index ensures only one `image_type='front'` per product.  
2. **DB trigger** — `trg_sync_product_front_image` automatically writes `front_image_url` and `thumbnail_url` on the `products` row whenever a front image is inserted/updated.  
3. **Angular service** — `resolveFrontImage()` helper in `data.service.ts` always picks `image_type='front'` first, then `is_primary`, then `sort_order` ascending.

Result: **Adding/changing a front image in Supabase automatically updates every card, listing, hero, and featured section on the website with zero frontend code changes.**

---

## 3. Storage Bucket Structure

**Bucket name:** `product-assets` (set to Public)

```
product-assets/
  front/       ← 01-front.webp — Hero/card image (sort_order=1)
  back/        ← 02-back.webp  — Detail/back view (sort_order=2)
  gallery/     ← 03-gallery.webp, 04-gallery.webp, ... (sort_order=3+)
  thumb/       ← Auto-generated thumbnails (optional CDN resize)
  docs/        ← product-brochure.pdf, coa.pdf, etc.
```

**Naming convention:** `{image_type}/{product-slug}-{sort_order:02}.{ext}`  
Example: `front/tangi-iron-drops-15ml-01.webp`

---

## 4. Angular File Structure

```
src/app/
  core/
    models/
      product.model.ts      ← All TypeScript interfaces (Division, Product, EnrichedProduct, etc.)
    data.service.ts          ← Main service: products, divisions, categories, distributors
    supabase.client.ts       ← Supabase client singleton
  pages/
    products/
      products.component.ts  ← Listing with division + category + search filter
    product-detail-page/
      product-detail-page.ts ← Detail page, gallery, related products
    home-page/
      home-page.ts           ← Uses getFeaturedProducts() for homepage section
supabase/
  schema.sql                 ← Full DB schema (run once in Supabase SQL editor)
  import-products.mjs        ← Node.js CSV import script
  upload-product-images.mjs  ← Node.js image upload script
  ARCHITECTURE.md            ← This document
```

---

## 5. Key Service Methods

| Method | Purpose |
|---|---|
| `getDivisions()` | All active divisions (sidebar filter) |
| `getCategories(divisionId?)` | Categories, optionally scoped to division |
| `getProducts(filter?)` | Listing via `v_product_listing` view — fast, single query |
| `getProductBySlugs(divSlug, prodSlug)` | Full detail with images + documents |
| `getProductById(id)` | Lookup by UUID (admin / related) |
| `getRelatedProducts(id, divisionId)` | Related products (same division) |
| `getFeaturedProducts(section?)` | Homepage featured via `v_featured_products` view |
| `getProductImages(productId)` | Ordered image set for a product |
| `getStorageUrl(path)` | Resolve Supabase Storage public URL |

---

## 6. Automation: How Products Flow to the Website

```
┌─────────────────────────────────────────────────────┐
│                   SUPABASE ADMIN                    │
│                                                     │
│  1. Add/edit product row in `products` table        │
│  2. Upload image to product-assets/front/{slug}.webp│
│  3. Insert row in product_images (sort_order=1)     │
│  4. DB trigger auto-syncs front_image_url           │
│  5. Toggle is_featured=true → auto-adds to featured │
│                                                     │
└──────────────────────┬──────────────────────────────┘
                       │ Real-time / Next page load
┌──────────────────────▼──────────────────────────────┐
│                  ANGULAR WEBSITE                    │
│                                                     │
│  • Product cards show new product automatically     │
│  • Front image appears on cards, hero, listing      │
│  • Featured section updates on homepage             │
│  • Product detail page renders all images, docs     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

No code deployments needed. The data flows automatically.

---

## 7. Step-by-Step: First Import

### Step 1 — Run schema in Supabase

1. Open your Supabase project → SQL Editor
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**
4. This creates all tables, indexes, triggers, RLS policies, views, and seeds the 5 divisions + Pediatrics categories

### Step 2 — Create Storage Bucket

1. Supabase Dashboard → Storage → New Bucket
2. Name: `product-assets`
3. Public: **Yes** (products are public content)
4. Add CORS policy for your domain if needed

### Step 3 — Install script dependencies

```bash
cd your-project-root
npm install @supabase/supabase-js csv-parse
```

### Step 4 — Set your service role key

Get your **Service Role** key from Supabase → Settings → API (not the anon key).

```bash
export SUPABASE_SERVICE_KEY="your_service_role_key_here"
```

### Step 5 — Run product import

```bash
node supabase/import-products.mjs
```

This upserts all 17 pediatric products with correct division + category assignments.

### Step 6 — Upload product images

Organise your product images locally:
```
assets/product-images/
  tangi-iron-drops-15ml/
    01-front.png    ← MUST be numbered 01 (sort_order=1, front view)
    02-back.png
    03-gallery.png
  floravate-gg-15ml/
    01-front.png
    ...
```

Then run:
```bash
node supabase/upload-product-images.mjs
```

The script uploads each image, inserts the `product_images` row, and the DB trigger automatically syncs `front_image_url` on the products table.

### Step 7 — Verify on website

Open your Angular app. Products should now load dynamically from Supabase with images.

---

## 8. Adding New Products (Ongoing)

**Option A — Direct Supabase table insert:**
1. Go to Supabase → Table Editor → `products`
2. Click Insert
3. Fill fields — `division_id` from the divisions table, `category_id` from categories
4. Set `is_active = true`, `status = 'active'`
5. Upload image → `product-assets/front/{slug}-01.webp`
6. Insert `product_images` row with `sort_order=1`, `image_type='front'`, `is_primary=true`
7. DB trigger syncs `front_image_url` — website updates automatically

**Option B — Script (bulk):**
Add the product to `MANUAL_PRODUCTS` array in `import-products.mjs` and run again.

---

## 9. Featured Products Management

**Toggle on:**
```sql
UPDATE products SET is_featured = true WHERE slug = 'tangi-iq-200ml';
-- DB trigger automatically inserts into featured_products
```

**Reorder:**
```sql
UPDATE featured_products SET sort_order = 1 WHERE product_id = '...uuid...';
```

**Time-limited feature:**
```sql
UPDATE featured_products
SET valid_from = '2026-06-01', valid_until = '2026-06-30'
WHERE product_id = '...uuid...';
```

---

## 10. RLS Policy Summary

| Table | Public (anon) | Authenticated (admin) |
|---|---|---|
| divisions | SELECT where is_active | Full CRUD |
| categories | SELECT where is_active | Full CRUD |
| products | SELECT where active + not discontinued | Full CRUD |
| product_images | SELECT all | Full CRUD |
| featured_products | SELECT where active + within valid dates | Full CRUD |
| product_documents | SELECT where is_public | Full CRUD |

**Frontend** uses the `anon` key (in `environment.ts`) — read-only, safe to expose.  
**Scripts** use the `service_role` key — write access, keep secret, never commit.

---

## 11. Database Views

| View | Used by |
|---|---|
| `v_product_listing` | `getProducts()` — flat, fast product grid query |
| `v_featured_products` | `getFeaturedProducts()` — homepage hero section |

Both views already join divisions and categories, so the Angular service makes a single query with no client-side merging needed.

---

## 12. Admin Panel Readiness

The schema is fully admin-panel ready:

- All tables have `id`, `created_at`, `updated_at`, `sort_order`, `is_active`
- RLS separates public read from authenticated write cleanly
- `featured_products.section` enum supports homepage, hero, catalog, division sections
- `featured_products.valid_from/valid_until` supports scheduled promotions
- `product_documents.doc_type` supports brochure, coa, msds, prescription
- `products.status` enum supports active, inactive, coming_soon, discontinued
- `divisions.color_hex` enables per-division theming in future admin UI

When you build the admin panel, connect it with the **service_role** key. All reads and writes will flow through the same Supabase tables and the Angular website will reflect changes on next page load.

---

*VNH Pharmaceuticals — Vaidhyo Narayano Hari*
