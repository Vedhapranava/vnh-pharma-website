import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminContentService } from './admin-content.service';

@Component({
  selector: 'app-admin-contact-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-contact-content.component.html',
  styleUrl: './admin-content.shared.css',
})
export class AdminContactContentComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');

  model: Record<string, string> = {
    contact_email: '',
    contact_phone_display: '',
    contact_phone_tel: '',
    contact_whatsapp: '',
    address_corporate: '',
    address_dispatch: '',
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
      this.error.set(e?.message || 'Failed to load contact details.');
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
      this.notice.set('Contact details saved.');
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }
}
