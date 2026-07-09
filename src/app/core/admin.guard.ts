import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

/**
 * AdminGuard
 * Protects /admin routes. Requires an active Supabase session AND
 * an active admin row in admin_users. Otherwise redirects to /admin/login.
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  const session = await auth.getSession();
  if (!session) {
    return router.parseUrl('/admin/login');
  }

  try {
    const profile = await auth.getAdminProfile(session.user.id);

    if (!profile || !profile.is_active) {
      return router.parseUrl('/admin/login');
    }

    return true;
  } catch {
    // Do NOT sign out on a transient query error; just block this navigation
    // so a valid session is not destroyed by a one-off failure.
    return router.parseUrl('/admin/login');
  }
};
