import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface AdminJob {
  id?: any;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  experience: string | null;
  description: string | null;
  responsibilities: any;
  icon: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface AdminApplication {
  id: any;
  job_id: any;
  job_title: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  experience: string | null;
  resume_url: string | null;
  cover_note: string | null;
  status: string;
  created_at?: string;
}

/**
 * AdminCareersService
 * Job openings CRUD + applications read/status. RLS via is_active_admin().
 */
@Injectable({ providedIn: 'root' })
export class AdminCareersService {
  async listJobs(): Promise<AdminJob[]> {
    const { data, error } = await supabase
      .from('job_openings')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });
    if (error) {
      console.error('[AdminCareers] listJobs error:', error);
      throw error;
    }
    return (data as AdminJob[]) ?? [];
  }

  async createJob(job: AdminJob): Promise<void> {
    const { error } = await supabase.from('job_openings').insert(this.clean(job));
    if (error) {
      console.error('[AdminCareers] createJob error:', error);
      throw error;
    }
  }

  async updateJob(id: any, job: AdminJob): Promise<void> {
    const { error } = await supabase
      .from('job_openings')
      .update({ ...this.clean(job), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('[AdminCareers] updateJob error:', error);
      throw error;
    }
  }

  async setJobActive(id: any, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('job_openings')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) {
      console.error('[AdminCareers] setJobActive error:', error);
      throw error;
    }
  }

  async listApplications(): Promise<AdminApplication[]> {
    const { data, error } = await supabase
      .from('career_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[AdminCareers] listApplications error:', error);
      throw error;
    }
    return (data as AdminApplication[]) ?? [];
  }

  async updateApplicationStatus(id: any, status: string): Promise<void> {
    const { error } = await supabase
      .from('career_applications')
      .update({ status })
      .eq('id', id);
    if (error) {
      console.error('[AdminCareers] updateApplicationStatus error:', error);
      throw error;
    }
  }

  private clean(job: AdminJob) {
    return {
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      experience: job.experience,
      description: job.description,
      responsibilities: job.responsibilities,
      icon: job.icon,
      is_active: job.is_active,
      sort_order: job.sort_order,
    };
  }
}
