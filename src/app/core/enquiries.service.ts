import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

/**
 * EnquiriesService (public-facing)
 * Inserts contact-form enquiries. Public can insert but not read (RLS).
 */
@Injectable({ providedIn: 'root' })
export class EnquiriesService {
  async submitEnquiry(payload: {
    name: string;
    mobile: string | null;
    email: string | null;
    city: string | null;
    enquiry_type: string | null;
    message: string | null;
    status: string;
  }): Promise<void> {
    const { error } = await supabase.from('enquiries').insert(payload);
    if (error) {
      console.error('[Enquiries] insert error:', error);
      throw error;
    }
  }
}
