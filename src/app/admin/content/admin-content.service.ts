import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface SiteSection {
  id?: any;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  is_active: boolean;
  updated_at?: string;
}

/**
 * AdminContentService
 * Admin-side CRUD for site_sections / site_settings. Reuses the shared
 * Supabase client (anon key); writes are authorised by RLS (is_active_admin()).
 */
@Injectable({ providedIn: 'root' })
export class AdminContentService {
  // ---- Sections ----

  async getSection(key: string): Promise<SiteSection | null> {
    const { data, error } = await supabase
      .from('site_sections')
      .select('id, section_key, title, subtitle, content, is_active, updated_at')
      .eq('section_key', key)
      .maybeSingle();

    if (error) {
      console.error('[AdminContent] getSection error:', error);
      throw error;
    }
    return (data as SiteSection) ?? null;
  }

  async upsertSection(section: {
    section_key: string;
    title: string | null;
    subtitle: string | null;
    content: any;
    is_active: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('site_sections')
      .upsert(
        { ...section, updated_at: new Date().toISOString() },
        { onConflict: 'section_key' }
      );

    if (error) {
      console.error('[AdminContent] upsertSection error:', error);
      throw error;
    }
  }

  // ---- Settings ----

  async getSettingsMap(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('[AdminContent] getSettingsMap error:', error);
      throw error;
    }
    const map: Record<string, any> = {};
    for (const row of data || []) {
      map[(row as any).setting_key] = (row as any).setting_value;
    }
    return map;
  }

  /** Upsert many settings at once (key -> value). */
  async upsertSettings(entries: Record<string, any>): Promise<void> {
    const now = new Date().toISOString();
    const rows = Object.keys(entries).map((k) => ({
      setting_key: k,
      setting_value: entries[k],
      updated_at: now,
    }));
    if (rows.length === 0) return;

    const { error } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'setting_key' });

    if (error) {
      console.error('[AdminContent] upsertSettings error:', error);
      throw error;
    }
  }
}
