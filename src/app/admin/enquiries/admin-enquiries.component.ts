import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminEnquiriesService, AdminLeadRow } from './admin-enquiries.service';

@Component({
  selector: 'app-admin-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-enquiries.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminEnquiriesComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  rows = signal<AdminLeadRow[]>([]);

  readonly statuses = ['new', 'follow_up', 'closed'];

  constructor(private svc: AdminEnquiriesService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.rows.set(await this.svc.listEnquiries());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load enquiries.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(r: AdminLeadRow): Promise<void> {
    this.busyId.set(r.id);
    this.error.set('');
    try {
      await this.svc.updateEnquiry(r.id, { status: r.status, admin_notes: r.admin_notes });
      this.notice.set('Saved.');
    } catch (e: any) {
      this.error.set(e?.message || 'Could not save.');
    } finally {
      this.busyId.set(null);
    }
  }
}
