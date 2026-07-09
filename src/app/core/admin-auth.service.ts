import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('[AdminAuth] Supabase Auth sign-in error:', error);
      throw error;
    }
    return data;
  }

  async getAdminProfile(userId: string): Promise<AdminProfile | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, user_id, email, full_name, role, is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AdminAuth] admin_users profile query error:', error);
      throw error;
    }
    return (data as AdminProfile) ?? null;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async isAdmin(userId?: string): Promise<boolean> {
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }
    if (!userId) return false;

    try {
      const profile = await this.getAdminProfile(userId);
      return !!profile && profile.is_active === true;
    } catch {
      return false;
    }
  }
}
