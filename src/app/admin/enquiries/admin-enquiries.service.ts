import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface AdminLeadRow {
  id: any;
  status: string;
  admin_notes: string | null;
  created_at?: string;
  [key: string]: any;
}

/**
 * AdminEnquiriesService
 * Read + status/notes updates for enquiries, institutional_orders,
 * partner_enquiries. RLS via is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminEnquiriesService {
  private async list(table: string): Promise<AdminLeadRow[]> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(`[AdminEnquiries] list ${table} error:`, error);
      throw error;
    }
    return (data as AdminLeadRow[]) ?? [];
  }

  private async update(
    table: string,
    id: any,
    patch: { status?: string; admin_notes?: string | null }
  ): Promise<void> {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) {
      console.error(`[AdminEnquiries] update ${table} error:`, error);
      throw error;
    }
  }

  listEnquiries() { return this.list('enquiries'); }
  updateEnquiry(id: any, patch: { status?: string; admin_notes?: string | null }) {
    return this.update('enquiries', id, patch);
  }

  listOrders() { return this.list('institutional_orders'); }
  updateOrder(id: any, patch: { status?: string; admin_notes?: string | null }) {
    return this.update('institutional_orders', id, patch);
  }

  listPartners() { return this.list('partner_enquiries'); }
  updatePartner(id: any, patch: { status?: string; admin_notes?: string | null }) {
    return this.update('partner_enquiries', id, patch);
  }
}
