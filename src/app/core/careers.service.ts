import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface PublicJob {
  id?: any;
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  experience?: string | null;
  description?: string | null;
  responsibilities?: any;
  icon?: string | null;
}

/**
 * CareersService (public-facing)
 * Reads active job openings (fallback-safe) and submits applications.
 */
@Injectable({ providedIn: 'root' })
export class CareersService {
  async getActiveJobs(): Promise<PublicJob[]> {
    try {
      const { data, error } = await supabase
        .from('job_openings')
        .select(
          'id, title, department, location, employment_type, experience, description, responsibilities, icon, is_active, sort_order'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        console.warn('[Careers] jobs unavailable:', error.message);
        return [];
      }
      return (data as PublicJob[]) ?? [];
    } catch (e) {
      console.warn('[Careers] jobs fetch failed:', e);
      return [];
    }
  }

  async submitApplication(payload: {
    job_id?: any;
    job_title: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    experience: string | null;
    resume_url: string | null;
    cover_note: string | null;
    status: string;
  }): Promise<void> {
    const { error } = await supabase.from('career_applications').insert(payload);
    if (error) {
      console.error('[Careers] application insert error:', error);
      throw error;
    }
  }
}
