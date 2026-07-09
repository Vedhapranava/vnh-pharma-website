import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface SiteSectionData {
  title: string | null;
  subtitle: string | null;
  content: any;
}

/**
 * ContentService (public-facing)
 * Reads CMS content from site_settings / site_sections for the public website.
 * Fully fallback-safe: every method swallows errors and returns empty/null so
 * the public site keeps working even if the tables or rows do not exist yet.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private settingsCache: Record<string, any> | null = null;

  /** Returns a key -> value map of site_settings. {} on any error. */
  async getSettings(): Promise<Record<string, any>> {
    if (this.settingsCache) return this.settingsCache;
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.warn('[Content] settings unavailable:', error.message);
        return {};
      }
      const map: Record<string, any> = {};
      for (const row of data || []) {
        map[(row as any).setting_key] = (row as any).setting_value;
      }
      this.settingsCache = map;
      return map;
    } catch (e) {
      console.warn('[Content] settings fetch failed:', e);
      return {};
    }
  }

  /** Convenience: a single setting as string, or the provided fallback. */
  async getSetting(key: string, fallback = ''): Promise<string> {
    const map = await this.getSettings();
    const v = map[key];
    return v === undefined || v === null || v === '' ? fallback : String(v);
  }

  /** Returns an active section's data, or null if missing/error. */
  async getSection(key: string): Promise<SiteSectionData | null> {
    try {
      const { data, error } = await supabase
        .from('site_sections')
        .select('title, subtitle, content, is_active')
        .eq('section_key', key)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.warn('[Content] section unavailable:', error.message);
        return null;
      }
      if (!data) return null;
      return {
        title: (data as any).title ?? null,
        subtitle: (data as any).subtitle ?? null,
        content: (data as any).content ?? null,
      };
    } catch (e) {
      console.warn('[Content] section fetch failed:', e);
      return null;
    }
  }
}
