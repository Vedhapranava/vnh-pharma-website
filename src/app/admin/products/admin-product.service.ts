import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface AdminDivision {
  id: any;
  name: string;
  slug?: string;
  is_active?: boolean;
}

export interface AdminCategory {
  id: any;
  name: string;
}

export interface AdminProductImageRef {
  id: any;
  image_url: string;
  is_primary: boolean;
  sort_order: number | null;
}

export interface AdminProduct {
  id: any;
  name: string;
  slug: string;
  division_id: any;
  short_desc: string | null;
  long_desc: string | null;
  composition: string | null;
  sort_order: number | null;
  is_active: boolean;
  category_id?: any;
  created_at?: string;
  updated_at?: string;
  divisions?: { id: any; name: string } | null;
  product_images?: AdminProductImageRef[];
}

/** Payload of fields the admin form is allowed to write to products. */
export interface AdminProductInput {
  name: string;
  slug: string;
  division_id: any;
  short_desc: string | null;
  long_desc: string | null;
  composition: string | null;
  sort_order: number | null;
  is_active: boolean;
  category_id?: any;
}

/** Aggregated live stats for the admin dashboard. */
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsWithoutImages: number;
  productsWithoutPrimary: number;
  multiplePrimary: number;
  totalImages: number;
  latest: AdminProduct[];
}

/**
 * AdminProductService
 * Products CRUD + dashboard/aggregate helpers for the admin panel.
 * Reuses the shared Supabase client (anon/publishable key). Writes are
 * authorised server-side by RLS policies backed by public.is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminProductService {
  /**
   * All products (active + inactive) with their images in one query,
   * so the list/dashboard can derive thumbnails, counts and primary state.
   */
  async listProducts(): Promise<AdminProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select(
        '*, divisions ( id, name ), product_images ( id, image_url, is_primary, sort_order )'
      )
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[AdminProduct] listProducts error:', error);
      throw error;
    }
    return (data as AdminProduct[]) ?? [];
  }

  /** Single product by id (for the edit form). */
  async getProduct(id: any): Promise<AdminProduct | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, divisions ( id, name )')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[AdminProduct] getProduct error:', error);
      throw error;
    }
    return (data as AdminProduct) ?? null;
  }

  /** Active divisions for the division dropdown. */
  async getDivisions(): Promise<AdminDivision[]> {
    const { data, error } = await supabase
      .from('divisions')
      .select('id, name, slug, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[AdminProduct] getDivisions error:', error);
      throw error;
    }
    return (data as AdminDivision[]) ?? [];
  }

  /**
   * Categories for the optional category dropdown.
   * Defensive: returns [] if the table is missing/blocked.
   */
  async getCategories(): Promise<AdminCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[AdminProduct] categories unavailable:', error.message);
        return [];
      }
      return (data as AdminCategory[]) ?? [];
    } catch (e) {
      console.warn('[AdminProduct] categories fetch failed:', e);
      return [];
    }
  }

  async createProduct(input: AdminProductInput): Promise<AdminProduct> {
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      console.error('[AdminProduct] createProduct error:', error);
      throw error;
    }
    return data as AdminProduct;
  }

  async updateProduct(id: any, input: AdminProductInput): Promise<AdminProduct> {
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[AdminProduct] updateProduct error:', error);
      throw error;
    }
    return data as AdminProduct;
  }

  /** Deactivate / reactivate without deleting. */
  async setActive(id: any, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('[AdminProduct] setActive error:', error);
      throw error;
    }
  }

  // ---- Image-safety helpers (pure; operate on an already-fetched list) ----

  /** Products that have zero images. */
  productsWithoutImages(list: AdminProduct[]): AdminProduct[] {
    return list.filter((p) => (p.product_images || []).length === 0);
  }

  /** Products that have images but none flagged primary. */
  productsWithoutPrimary(list: AdminProduct[]): AdminProduct[] {
    return list.filter((p) => {
      const imgs = p.product_images || [];
      return imgs.length > 0 && imgs.every((i) => !i.is_primary);
    });
  }

  /** Products with more than one primary image (data inconsistency). */
  productsWithMultiplePrimary(list: AdminProduct[]): AdminProduct[] {
    return list.filter(
      (p) => (p.product_images || []).filter((i) => i.is_primary).length > 1
    );
  }

  /** Live aggregate stats computed from a single products+images fetch. */
  async getDashboardStats(): Promise<DashboardStats> {
    const products = await this.listProducts();

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const inactiveProducts = totalProducts - activeProducts;

    let totalImages = 0;
    for (const p of products) {
      totalImages += (p.product_images || []).length;
    }

    const productsWithoutImages = this.productsWithoutImages(products).length;
    const productsWithoutPrimary = this.productsWithoutPrimary(products).length;
    const multiplePrimary = this.productsWithMultiplePrimary(products).length;

    const recency = (p: AdminProduct) =>
      Date.parse((p.updated_at || p.created_at || '') as string) || 0;
    const latest = [...products].sort((a, b) => recency(b) - recency(a)).slice(0, 5);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      productsWithoutImages,
      productsWithoutPrimary,
      multiplePrimary,
      totalImages,
      latest,
    };
  }
}
