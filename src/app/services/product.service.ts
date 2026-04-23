import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase.client';

export interface Division {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id?: string;
  image_url: string;
  is_primary: boolean;
  sort_order?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  division_id: string;
  divisions?: Division | Division[] | null;
  product_images?: ProductImage[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  async getProductsDivisionWise(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        division_id,
        divisions (
          id,
          name,
          slug
        ),
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return (data as Product[]) || [];
  }
}