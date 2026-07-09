import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface AdminPartner {
  id?: any;
  name: string;
  label: string | null;
  description: string | null;
  url: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface AdminEvent {
  id?: any;
  title: string;
  subtitle: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  gallery_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
}

/**
 * AdminAboutCmsService
 * CRUD for about_partners + flagship_events. RLS via is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminAboutCmsService {
  // ---- Partners ----
  async listPartners(): Promise<AdminPartner[]> {
    const { data, error } = await supabase
      .from('about_partners').select('*')
      .order('sort_order', { ascending: true });
    if (error) { console.error('[AdminAboutCms] listPartners error:', error); throw error; }
    return (data as AdminPartner[]) ?? [];
  }
  private cleanPartner(p: AdminPartner) {
    return { name: p.name, label: p.label, description: p.description, url: p.url,
      icon: p.icon, is_active: p.is_active, sort_order: p.sort_order };
  }
  async createPartner(p: AdminPartner): Promise<void> {
    const { error } = await supabase.from('about_partners').insert(this.cleanPartner(p));
    if (error) { console.error('[AdminAboutCms] createPartner error:', error); throw error; }
  }
  async updatePartner(id: any, p: AdminPartner): Promise<void> {
    const { error } = await supabase.from('about_partners')
      .update({ ...this.cleanPartner(p), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('[AdminAboutCms] updatePartner error:', error); throw error; }
  }
  async setPartnerActive(id: any, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('about_partners').update({ is_active: isActive }).eq('id', id);
    if (error) { console.error('[AdminAboutCms] setPartnerActive error:', error); throw error; }
  }
  async deletePartner(id: any): Promise<void> {
    const { error } = await supabase.from('about_partners').delete().eq('id', id);
    if (error) { console.error('[AdminAboutCms] deletePartner error:', error); throw error; }
  }

  // ---- Events ----
  async listEvents(): Promise<AdminEvent[]> {
    const { data, error } = await supabase
      .from('flagship_events').select('*')
      .order('sort_order', { ascending: true });
    if (error) { console.error('[AdminAboutCms] listEvents error:', error); throw error; }
    return (data as AdminEvent[]) ?? [];
  }
  private cleanEvent(e: AdminEvent) {
    return { title: e.title, subtitle: e.subtitle, event_type: e.event_type,
      event_date: e.event_date, location: e.location, image_url: e.image_url,
      gallery_image_url: e.gallery_image_url, is_active: e.is_active, sort_order: e.sort_order };
  }
  async createEvent(e: AdminEvent): Promise<void> {
    const { error } = await supabase.from('flagship_events').insert(this.cleanEvent(e));
    if (error) { console.error('[AdminAboutCms] createEvent error:', error); throw error; }
  }
  async updateEvent(id: any, e: AdminEvent): Promise<void> {
    const { error } = await supabase.from('flagship_events')
      .update({ ...this.cleanEvent(e), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('[AdminAboutCms] updateEvent error:', error); throw error; }
  }
  async setEventActive(id: any, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('flagship_events').update({ is_active: isActive }).eq('id', id);
    if (error) { console.error('[AdminAboutCms] setEventActive error:', error); throw error; }
  }
  async deleteEvent(id: any): Promise<void> {
    const { error } = await supabase.from('flagship_events').delete().eq('id', id);
    if (error) { console.error('[AdminAboutCms] deleteEvent error:', error); throw error; }
  }
}
