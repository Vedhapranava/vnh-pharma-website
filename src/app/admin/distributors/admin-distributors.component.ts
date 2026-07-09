import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDistributorsService, AdminDistributor } from './admin-distributors.service';

@Component({
  selector: 'app-admin-distributors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-distributors.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminDistributorsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  rows = signal<AdminDistributor[]>([]);

  showForm = false;
  editingId: any = null;
  model = this.blank();

  constructor(private svc: AdminDistributorsService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try { this.rows.set(await this.svc.list()); }
    catch (e: any) { this.error.set(e?.message || 'Failed to load distributors.'); }
    finally { this.loading.set(false); }
  }

  blank(): AdminDistributor {
    return { name: '', region: '', address: '', contact_person: '', mobile_no: '',
      landline: '', email: '', map_url: '', sort_order: 0, is_active: true };
  }

  newRow(): void { this.editingId = null; this.model = this.blank(); this.showForm = true; this.notice.set(''); }
  editRow(d: AdminDistributor): void { this.editingId = d.id; this.model = { ...d }; this.showForm = true; this.notice.set(''); }
  cancel(): void { this.showForm = false; }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.model.name.trim()) { this.error.set('Name is required.'); return; }
    this.saving.set(true);
    this.error.set('');
    try {
      const payload: AdminDistributor = { ...this.model, name: this.model.name.trim(),
        sort_order: Number(this.model.sort_order) || 0 };
      if (this.editingId) await this.svc.update(this.editingId, payload);
      else await this.svc.create(payload);
      this.showForm = false;
      this.notice.set('Distributor saved.');
      await this.load();
    } catch (e: any) { this.error.set(e?.message || 'Save failed.'); }
    finally { this.saving.set(false); }
  }

  async toggleActive(d: AdminDistributor): Promise<void> {
    this.busyId.set(d.id);
    this.error.set('');
    try { await this.svc.setActive(d.id, !d.is_active); await this.load(); }
    catch (e: any) { this.error.set(e?.message || 'Could not update status.'); }
    finally { this.busyId.set(null); }
  }

  async remove(d: AdminDistributor): Promise<void> {
    if (!confirm('Delete this distributor permanently?')) return;
    this.busyId.set(d.id);
    this.error.set('');
    try { await this.svc.remove(d.id); await this.load(); }
    catch (e: any) { this.error.set(e?.message || 'Could not delete.'); }
    finally { this.busyId.set(null); }
  }
}
