import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AdminAuthService, private router: Router) {}

  async onSubmit(): Promise<void> {
    if (this.loading) return;

    this.error = '';
    this.loading = true;

    try {
      const { user } = await this.auth.signIn(this.email.trim(), this.password);

      if (!user) {
        this.error = 'Login failed. Please try again.';
        return;
      }

      const profile = await this.auth.getAdminProfile(user.id);

      if (!profile) {
        await this.auth.signOut();
        this.error = 'This account is not authorised as admin.';
        return;
      }

      if (!profile.is_active) {
        await this.auth.signOut();
        this.error = 'This admin account is inactive.';
        return;
      }

      const ok = await this.router.navigate(['/admin/dashboard']);

      if (!ok) {
        this.error =
          'Could not open the dashboard (navigation was blocked). Please try again.';
      }
    } catch (e: any) {
      this.error = e?.message || 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
