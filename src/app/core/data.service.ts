import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface Distributor {
  id?: number;
  name: string;
  region: string;
  address: string;
  contact_person?: string | null;
  mobile_no?: string | null;
  landline?: string | null;
  email?: string | null;
  map_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  async getDivisions() {
    return await supabase
      .from('divisions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
  }

  async getProducts() {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (productsError) {
      return { data: null, error: productsError };
    }

    const { data: productImages, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (imagesError) {
      return { data: null, error: imagesError };
    }

    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .eq('is_active', true);

    if (divisionsError) {
      return { data: null, error: divisionsError };
    }

    const divisionMap = new Map(
      (divisions || []).map((division: any) => [String(division.id), division])
    );

    const productsWithImages = (products || []).map((product: any) => {
      const images = (productImages || [])
        .filter((img: any) => String(img.product_id) === String(product.id))
        .sort((a: any, b: any) => {
          const ao = a?.sort_order ?? 0;
          const bo = b?.sort_order ?? 0;
          return ao - bo;
        });

      const primaryImage =
        images.find((img: any) => img?.is_primary === true) ||
        images[0] ||
        null;

      return {
        ...product,
        divisions: divisionMap.get(String(product.division_id)) ?? null,
        images,
        product_images: images,
        primaryImage
      };
    });

    return { data: productsWithImages, error: null };
  }

  async getProductBySlugs(divisionSlug: string, productSlug: string) {
    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .eq('slug', divisionSlug)
      .limit(1);

    if (divisionsError) {
      return { data: null, error: divisionsError };
    }

    const division = divisions?.[0];

    if (!division) {
      return { data: null, error: { message: 'Division not found' } };
    }

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', productSlug)
      .eq('division_id', division.id)
      .limit(1);

    if (productError) {
      return { data: null, error: productError };
    }

    const product = products?.[0];

    if (!product) {
      return { data: null, error: { message: 'Product not found' } };
    }

    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    if (imagesError) {
      return { data: null, error: imagesError };
    }

    const primaryImage =
      (images || []).find((img: any) => img?.is_primary === true) ||
      (images || [])[0] ||
      null;

    return {
      data: {
        ...product,
        divisions: division,
        images: images || [],
        product_images: images || [],
        primaryImage
      },
      error: null
    };
  }

  async getDistributors() {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data ?? [], error: null };
  }

  async getDistributorById(id: number) {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      return { data: null, error };
    }

    return { data: data?.[0] ?? null, error: null };
  }
}