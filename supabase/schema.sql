-- ============================================================
-- VNH Pharmaceuticals — Supabase Database Schema
-- Production-ready | Scalable | Admin-panel ready
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: divisions
-- Pediatrics | Nutraceuticals | General | Healthcare | Specialty
-- ============================================================
CREATE TABLE IF NOT EXISTS public.divisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  icon_url      TEXT,                        -- Division icon/badge image
  banner_url    TEXT,                        -- Division hero banner
  color_hex     TEXT DEFAULT '#2563eb',      -- Accent color per division
  sort_order    INT  DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_divisions_slug      ON public.divisions (slug);
CREATE INDEX IF NOT EXISTS idx_divisions_active    ON public.divisions (is_active);
CREATE INDEX IF NOT EXISTS idx_divisions_sort      ON public.divisions (sort_order);

-- ============================================================
-- TABLE: categories
-- Sub-groups within each division (Iron Supplements, Probiotics, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id   UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  sort_order    INT  DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_division    ON public.categories (division_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug        ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_active      ON public.categories (is_active);

-- ============================================================
-- TABLE: products
-- Core product record — all fields required by VNH
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  brand_name        TEXT,                          -- Branded name if different

  -- Relations
  division_id       UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Medical / Composition
  composition       TEXT,                          -- Full ingredient list
  short_desc        TEXT,                          -- 1-2 line tagline for cards
  long_desc         TEXT,                          -- Detailed product description
  key_features      TEXT[],                        -- Array of bullet points
  usage_instructions TEXT,                         -- How to use / dosage guidance
  indications       TEXT,                          -- Clinical indications
  contraindications TEXT,                          -- Safety notes
  storage_conditions TEXT DEFAULT 'Store in a cool, dry place.',

  -- Packaging & Pricing
  packaging         TEXT,                          -- e.g. "15 ml Drop Bottle"
  pack_size         TEXT,                          -- e.g. "30 ml", "200 ml"
  mrp               NUMERIC(10,2),                 -- Maximum Retail Price
  ptr               NUMERIC(10,2),                 -- Price to retailer
  pts               NUMERIC(10,2),                 -- Price to stockist

  -- Images (primary URLs — storage references)
  -- Rule: front_image is ALWAYS sort_order=1 in product_images
  thumbnail_url     TEXT,                          -- Small card thumbnail (auto-set from front)
  front_image_url   TEXT,                          -- Front view (hero, card, listing)
  back_image_url    TEXT,                          -- Back/detail view

  -- Documents
  product_pdf_url   TEXT,                          -- Downloadable product PDF

  -- Status & Visibility
  is_active         BOOLEAN DEFAULT TRUE,
  is_featured       BOOLEAN DEFAULT FALSE,         -- Show on homepage featured section
  is_new            BOOLEAN DEFAULT FALSE,         -- "New" badge on card
  status            TEXT DEFAULT 'active'
                    CHECK (status IN ('active','inactive','coming_soon','discontinued')),

  -- SEO
  meta_title        TEXT,
  meta_description  TEXT,
  meta_keywords     TEXT[],

  -- Ordering
  sort_order        INT DEFAULT 0,

  -- Audit
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug          ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_division      ON public.products (division_id);
CREATE INDEX IF NOT EXISTS idx_products_category      ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active        ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured      ON public.products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_status        ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_sort          ON public.products (sort_order);
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products
  USING GIN (to_tsvector('english',
    COALESCE(name,'') || ' ' ||
    COALESCE(short_desc,'') || ' ' ||
    COALESCE(composition,'') || ' ' ||
    COALESCE(brand_name,'')
  ));

-- ============================================================
-- TABLE: product_images
-- Ordered images per product.
-- RULE: sort_order = 1  → FRONT image (always first)
--       sort_order = 2  → BACK  image
--       sort_order = 3+ → Gallery images
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  image_url     TEXT NOT NULL,                     -- Supabase Storage public URL
  storage_path  TEXT,                              -- e.g. product-assets/front/{id}.webp
  alt_text      TEXT,                              -- Accessibility / SEO

  -- Type flags
  image_type    TEXT DEFAULT 'gallery'
                CHECK (image_type IN ('front','back','gallery','thumbnail')),
  is_primary    BOOLEAN DEFAULT FALSE,             -- Convenience flag (same as sort_order=1)
  sort_order    INT DEFAULT 1,                     -- 1=FRONT always

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product    ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary    ON public.product_images (product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_sort       ON public.product_images (product_id, sort_order);

-- Enforce: only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_primary_image
  ON public.product_images (product_id) WHERE (is_primary = TRUE);

-- Enforce: only one front-type image per product
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_front_image
  ON public.product_images (product_id) WHERE (image_type = 'front');

-- ============================================================
-- TABLE: featured_products
-- Explicit homepage / landing page feature control.
-- Decoupled from products.is_featured for granular ordering.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.featured_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section       TEXT DEFAULT 'homepage'
                CHECK (section IN ('homepage','hero','catalog','division')),
  headline      TEXT,                              -- Override headline for this feature slot
  subline       TEXT,                              -- Override sub-text
  cta_label     TEXT DEFAULT 'View Product',
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  valid_from    TIMESTAMPTZ,
  valid_until   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_featured_product_section
  ON public.featured_products (product_id, section);
CREATE INDEX IF NOT EXISTS idx_featured_section    ON public.featured_products (section, is_active);
CREATE INDEX IF NOT EXISTS idx_featured_sort       ON public.featured_products (sort_order);

-- ============================================================
-- TABLE: product_documents
-- PDFs, brochures, certificates per product
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,                     -- "Product Brochure", "Certificate of Analysis"
  doc_url       TEXT NOT NULL,                     -- Supabase Storage URL
  storage_path  TEXT,
  doc_type      TEXT DEFAULT 'brochure'
                CHECK (doc_type IN ('brochure','coa','msds','prescription','other')),
  is_public     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_docs_product   ON public.product_documents (product_id);

-- ============================================================
-- AUTO-UPDATE trigger: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- AUTO-SYNC: When product_images front is set, sync to products
-- This keeps products.front_image_url always accurate
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_product_front_image()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.image_type = 'front' OR NEW.sort_order = 1 OR NEW.is_primary = TRUE THEN
    UPDATE public.products
    SET
      front_image_url = NEW.image_url,
      thumbnail_url   = NEW.image_url,
      updated_at      = NOW()
    WHERE id = NEW.product_id;
  END IF;
  IF NEW.image_type = 'back' OR NEW.sort_order = 2 THEN
    UPDATE public.products
    SET back_image_url = NEW.image_url, updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_product_front_image
  AFTER INSERT OR UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_front_image();

-- ============================================================
-- AUTO-SYNC: When products.is_featured toggled,
-- keep featured_products table in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_featured_products()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_featured = TRUE AND (OLD.is_featured IS DISTINCT FROM TRUE) THEN
    INSERT INTO public.featured_products (product_id, section, sort_order, is_active)
    VALUES (NEW.id, 'homepage', 0, TRUE)
    ON CONFLICT (product_id, section) DO UPDATE
      SET is_active = TRUE;
  END IF;
  IF NEW.is_featured = FALSE AND (OLD.is_featured IS DISTINCT FROM FALSE) THEN
    UPDATE public.featured_products
    SET is_active = FALSE
    WHERE product_id = NEW.id AND section = 'homepage';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_featured_products
  AFTER UPDATE OF is_featured ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_featured_products();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Public read | Authenticated write
-- ============================================================
ALTER TABLE public.divisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents  ENABLE ROW LEVEL SECURITY;

-- Public READ policies (anonymous users can read active content)
CREATE POLICY "public_read_divisions"
  ON public.divisions FOR SELECT USING (is_active = TRUE);

CREATE POLICY "public_read_categories"
  ON public.categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "public_read_products"
  ON public.products FOR SELECT USING (is_active = TRUE AND status != 'discontinued');

CREATE POLICY "public_read_product_images"
  ON public.product_images FOR SELECT USING (TRUE);

CREATE POLICY "public_read_featured"
  ON public.featured_products FOR SELECT USING (
    is_active = TRUE AND
    (valid_from IS NULL OR valid_from <= NOW()) AND
    (valid_until IS NULL OR valid_until >= NOW())
  );

CREATE POLICY "public_read_documents"
  ON public.product_documents FOR SELECT USING (is_public = TRUE);

-- Authenticated WRITE policies (admin panel uses service role key)
CREATE POLICY "auth_write_divisions"
  ON public.divisions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_categories"
  ON public.categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_products"
  ON public.products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_product_images"
  ON public.product_images FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_featured"
  ON public.featured_products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_documents"
  ON public.product_documents FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED: Core Divisions
-- ============================================================
INSERT INTO public.divisions (name, slug, description, color_hex, sort_order) VALUES
  ('Pediatrics',      'pediatrics',     'Science-backed nutrition and care for children from infancy through adolescence.', '#0ea5a4', 1),
  ('Nutraceuticals',  'nutraceuticals', 'Premium-grade nutritional supplements for therapeutic nutrition management.',         '#2563eb', 2),
  ('General',         'general',        'Broad-spectrum pharmaceuticals for everyday wellness and clinical management.',       '#081528', 3),
  ('Healthcare',      'healthcare',     'Advanced formulations for specialised healthcare and hospital segments.',             '#f97316', 4),
  ('Speciality',      'speciality',     'High-efficacy specialty products for targeted therapeutic outcomes.',                 '#7c3aed', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: Pediatrics Categories
-- ============================================================
WITH div AS (SELECT id FROM public.divisions WHERE slug = 'pediatrics' LIMIT 1)
INSERT INTO public.categories (division_id, name, slug, sort_order)
SELECT div.id, v.name, v.slug, v.sort_order FROM div,
(VALUES
  ('Iron & Haematinics',   'iron-haematinics',   1),
  ('Probiotics',           'probiotics',          2),
  ('Multivitamins',        'multivitamins',       3),
  ('Digestive Enzymes',    'digestive-enzymes',   4),
  ('Calcium & Bone',       'calcium-bone',        5),
  ('Laxatives',            'laxatives',           6),
  ('Brain & Neuro',        'brain-neuro',         7)
) AS v(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET SETUP (run via Supabase Dashboard or API)
-- Bucket name: product-assets
-- Public bucket with signed URL fallback
-- Folder structure:
--   product-assets/
--     front/     ← front/hero images  (sort_order = 1)
--     back/      ← back view images   (sort_order = 2)
--     gallery/   ← extra gallery      (sort_order = 3+)
--     thumb/     ← auto-generated thumbnails
--     docs/      ← PDFs, brochures
-- ============================================================

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: products with their front image and division name (optimised for listing)
CREATE OR REPLACE VIEW public.v_product_listing AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.short_desc,
  p.composition,
  p.packaging,
  p.pack_size,
  p.mrp,
  p.is_featured,
  p.is_new,
  p.status,
  p.sort_order,
  p.front_image_url,
  p.thumbnail_url,
  d.id   AS division_id,
  d.name AS division_name,
  d.slug AS division_slug,
  d.color_hex,
  c.id   AS category_id,
  c.name AS category_name,
  c.slug AS category_slug
FROM public.products p
LEFT JOIN public.divisions  d ON d.id = p.division_id
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.is_active = TRUE AND p.status != 'discontinued';

-- View: featured products with full image and division data
CREATE OR REPLACE VIEW public.v_featured_products AS
SELECT
  fp.id         AS feature_id,
  fp.section,
  fp.headline,
  fp.subline,
  fp.cta_label,
  fp.sort_order AS feature_order,
  p.id,
  p.name,
  p.slug,
  p.short_desc,
  p.composition,
  p.front_image_url,
  p.thumbnail_url,
  d.name AS division_name,
  d.slug AS division_slug,
  d.color_hex
FROM public.featured_products fp
JOIN public.products  p ON p.id  = fp.product_id
JOIN public.divisions d ON d.id  = p.division_id
WHERE fp.is_active = TRUE
  AND p.is_active  = TRUE
  AND (fp.valid_from  IS NULL OR fp.valid_from  <= NOW())
  AND (fp.valid_until IS NULL OR fp.valid_until >= NOW())
ORDER BY fp.section, fp.sort_order;
