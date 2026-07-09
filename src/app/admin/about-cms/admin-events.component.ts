import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAboutCmsService, AdminEvent } from './admin-about-cms.service';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminEventsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  rows = signal<AdminEvent[]>([]);

  showForm = false;
  editingId: any = null;
  model = this.blank();

  constructor(private svc: AdminAboutCmsService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try { this.rows.set(await this.svc.listEvents()); }
    catch (e: any) { this.error.set(e?.message || 'Failed to load events.'); }
    finally { this.loading.set(false); }
  }

  blank(): AdminEvent {
    return { title: '', subtitle: '', event_type: '', event_date: '', location: '',
      image_url: '', gallery_image_url: '', is_active: true, sort_order: 0 };
  }
  newRow(): void { this.editingId = null; this.model = this.blank(); this.showForm = true; this.notice.set(''); }
  editRow(e: AdminEvent): void { this.editingId = e.id; this.model = { ...e }; this.showForm = true; this.notice.set(''); }
  cancel(): void { this.showForm = false; }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.model.title.trim()) { this.error.set('Title is required.'); return; }
    this.saving.set(true);
    this.error.set('');
    try {
      const payload: AdminEvent = { ...this.model, title: this.model.title.trim(),
        sort_order: Number(this.model.sort_order) || 0 };
      if (this.editingId) await this.svc.updateEvent(this.editingId, payload);
      else await this.svc.createEvent(payload);
      this.showForm = false;
      this.notice.set('Event saved.');
      await this.load();
    } catch (e: any) { this.error.set(e?.message || 'Save failed.'); }
    finally { this.saving.set(false); }
  }

  async toggleActive(e: AdminEvent): Promise<void> {
    this.busyId.set(e.id);
    this.error.set('');
    try { await this.svc.setEventActive(e.id, !e.is_active); await this.load(); }
    catch (err: any) { this.error.set(err?.message || 'Could not update status.'); }
    finally { this.busyId.set(null); }
  }

  async remove(e: AdminEvent): Promise<void> {
    if (!confirm('Delete this event permanently?')) return;
    this.busyId.set(e.id);
    this.error.set('');
    try { await this.svc.deleteEvent(e.id); await this.load(); }
    catch (err: any) { this.error.set(err?.message || 'Could not delete.'); }
    finally { this.busyId.set(null); }
  }
}
