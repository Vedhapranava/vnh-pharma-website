import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface AdminDistributor {
  id?: any;
  name: string;
  region: string | null;
  address: string | null;
  contact_person: string | null;
  mobile_no: string | null;
  landline: string | null;
  email: string | null;
  map_url: string | null;
  sort_order: number | null;
  is_active: boolean;
}

/**
 * AdminDistributorsService
 * CRUD over the EXISTING public.distributors table (used by the public
 * Locate Distributor page). RLS via is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminDistributorsService {
  async list(): Promise<AdminDistributor[]> {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) { console.error('[AdminDistributors] list error:', error); throw error; }
    return (data as AdminDistributor[]) ?? [];
  }

  private clean(d: AdminDistributor) {
    return {
      name: d.name, region: d.region, address: d.address,
      contact_person: d.contact_person, mobile_no: d.mobile_no,
      landline: d.landline, email: d.email, map_url: d.map_url,
      sort_order: d.sort_order, is_active: d.is_active,
    };
  }

  async create(d: AdminDistributor): Promise<void> {
    const { error } = await supabase.from('distributors').insert(this.clean(d));
    if (error) { console.error('[AdminDistributors] create error:', error); throw error; }
  }

  async update(id: any, d: AdminDistributor): Promise<void> {
    const { error } = await supabase.from('distributors').update(this.clean(d)).eq('id', id);
    if (error) { console.error('[AdminDistributors] update error:', error); throw error; }
  }

  async setActive(id: any, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('distributors').update({ is_active: isActive }).eq('id', id);
    if (error) { console.error('[AdminDistributors] setActive error:', error); throw error; }
  }

  async remove(id: any): Promise<void> {
    const { error } = await supabase.from('distributors').delete().eq('id', id);
    if (error) { console.error('[AdminDistributors] remove error:', error); throw error; }
  }
}
