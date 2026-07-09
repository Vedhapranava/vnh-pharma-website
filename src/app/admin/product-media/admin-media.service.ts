import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface AdminProductImage {
  id: any;
  product_id: any;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number | null;
}

/**
 * AdminMediaService
 * Handles Supabase Storage uploads and product_images CRUD for the admin panel.
 * Reuses the shared Supabase client (anon/publishable key). All writes are
 * authorised server-side by RLS / Storage policies backed by is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminMediaService {
  /** Images for a product, ordered by sort_order. */
  async listImages(productId: any): Promise<AdminProductImage[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, image_url, alt_text, is_primary, sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[AdminMedia] listImages error:', error);
      throw error;
    }
    return (data as AdminProductImage[]) ?? [];
  }

  /** Build a safe storage path: products/<slug>/<slug>-<ts>-<n>.<ext> */
  buildStoragePath(productSlug: string, originalName: string, index: number): string {
    const slug = this.safeSlug(productSlug) || 'product';
    const ext = this.fileExt(originalName);
    const ts = Date.now();
    const fileName = `${slug}-${ts}-${index}${ext}`;
    return `products/${slug}/${fileName}`;
  }

  /** Upload a single file to the product-images bucket and return its public URL. */
  async uploadFile(path: string, file: File): Promise<string> {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) {
      console.error('[AdminMedia] uploadFile error:', error);
      throw error;
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Insert a product_images row, skipping if an identical
   * (product_id, image_url) row already exists (#19 no duplicates).
   */
  async insertImageRow(row: {
    product_id: any;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }): Promise<void> {
    const { data: existing, error: checkError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', row.product_id)
      .eq('image_url', row.image_url)
      .maybeSingle();

    if (checkError) {
      console.error('[AdminMedia] duplicate-check error:', checkError);
      throw checkError;
    }
    if (existing) {
      console.warn('[AdminMedia] duplicate image row skipped:', row.image_url);
      return;
    }

    const { error } = await supabase.from('product_images').insert(row);
    if (error) {
      console.error('[AdminMedia] insertImageRow error:', error);
      throw error;
    }
  }

  /** Ensure exactly one primary image for a product (#13). */
  async setPrimary(productId: any, imageId: any): Promise<void> {
    const { error: clearError } = await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    if (clearError) {
      console.error('[AdminMedia] setPrimary clear error:', clearError);
      throw clearError;
    }

    const { error: setError } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (setError) {
      console.error('[AdminMedia] setPrimary set error:', setError);
      throw setError;
    }
  }

  /** Update alt_text and sort_order for one image. */
  async updateImageMeta(
    imageId: any,
    meta: { alt_text: string | null; sort_order: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('product_images')
      .update(meta)
      .eq('id', imageId);

    if (error) {
      console.error('[AdminMedia] updateImageMeta error:', error);
      throw error;
    }
  }

  /** Delete an image row. */
  async deleteImageRow(imageId: any): Promise<void> {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('[AdminMedia] deleteImageRow error:', error);
      throw error;
    }
  }

  /**
   * Best-effort delete of the underlying storage object (#16).
   * Derives the bucket path from a public URL; no-op if it can't be derived.
   */
  async deleteStorageObject(imageUrl: string): Promise<void> {
    const path = this.storagePathFromUrl(imageUrl);
    if (!path) {
      console.warn('[AdminMedia] could not derive storage path from URL:', imageUrl);
      return;
    }
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      // Non-fatal: the DB row is already gone; just log.
      console.warn('[AdminMedia] storage remove failed (non-fatal):', error.message);
    }
  }

  /** Extract the in-bucket path from a Supabase public URL. */
  storagePathFromUrl(imageUrl: string): string | null {
    const marker = `/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(imageUrl.substring(idx + marker.length));
  }

  private safeSlug(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private fileExt(name: string): string {
    const m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
    return m ? `.${m[1].toLowerCase()}` : '';
  }
}
