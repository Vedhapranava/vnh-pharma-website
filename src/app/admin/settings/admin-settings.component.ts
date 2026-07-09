import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminContentService } from '../content/admin-content.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrl: '../content/admin-content.shared.css',
})
export class AdminSettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');

  model: Record<string, string> = {
    company_name: '',
    company_tagline: '',
    footer_text: '',
    social_linkedin: '',
    social_instagram: '',
    social_twitter: '',
    social_youtube: '',
    seo_title: '',
    seo_description: '',
  };

  constructor(private svc: AdminContentService) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const map = await this.svc.getSettingsMap();
      for (const k of Object.keys(this.model)) {
        if (map[k] !== undefined && map[k] !== null) this.model[k] = String(map[k]);
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load settings.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      const entries: Record<string, string> = {};
      for (const k of Object.keys(this.model)) entries[k] = (this.model[k] || '').trim();
      await this.svc.upsertSettings(entries);
      this.notice.set('Settings saved.');
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }
}
