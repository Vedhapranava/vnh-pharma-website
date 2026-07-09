import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface AboutPartner {
  id?: any;
  name: string;
  label: string | null;
  description: string | null;
  url: string | null;
  icon: string | null;
}

export interface FlagshipEvent {
  id?: any;
  title: string;
  subtitle: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  gallery_image_url: string | null;
}

/**
 * AboutCmsService (public-facing)
 * Reads active partner cards and flagship events for the About page.
 * Fully fallback-safe: returns [] on any error/missing table.
 */
@Injectable({ providedIn: 'root' })
export class AboutCmsService {
  async getActivePartners(): Promise<AboutPartner[]> {
    try {
      const { data, error } = await supabase
        .from('about_partners')
        .select('id, name, label, description, url, icon, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) {
        console.warn('[AboutCms] partners unavailable:', error.message);
        return [];
      }
      return (data as AboutPartner[]) ?? [];
    } catch (e) {
      console.warn('[AboutCms] partners fetch failed:', e);
      return [];
    }
  }

  async getActiveEvents(): Promise<FlagshipEvent[]> {
    try {
      const { data, error } = await supabase
        .from('flagship_events')
        .select('id, title, subtitle, event_type, event_date, location, image_url, gallery_image_url, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) {
        console.warn('[AboutCms] events unavailable:', error.message);
        return [];
      }
      return (data as FlagshipEvent[]) ?? [];
    } catch (e) {
      console.warn('[AboutCms] events fetch failed:', e);
      return [];
    }
  }
}
