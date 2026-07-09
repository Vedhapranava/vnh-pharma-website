import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAboutCmsService, AdminPartner } from './admin-about-cms.service';

@Component({
  selector: 'app-admin-about-partners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-about-partners.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminAboutPartnersComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  rows = signal<AdminPartner[]>([]);

  showForm = false;
  editingId: any = null;
  model = this.blank();

  constructor(private svc: AdminAboutCmsService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try { this.rows.set(await this.svc.listPartners()); }
    catch (e: any) { this.error.set(e?.message || 'Failed to load partners.'); }
    finally { this.loading.set(false); }
  }

  blank(): AdminPartner {
    return { name: '', label: '', description: '', url: '', icon: '', is_active: true, sort_order: 0 };
  }
  newRow(): void { this.editingId = null; this.model = this.blank(); this.showForm = true; this.notice.set(''); }
  editRow(p: AdminPartner): void { this.editingId = p.id; this.model = { ...p }; this.showForm = true; this.notice.set(''); }
  cancel(): void { this.showForm = false; }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.model.name.trim()) { this.error.set('Name is required.'); return; }
    this.saving.set(true);
    this.error.set('');
    try {
      const payload: AdminPartner = { ...this.model, name: this.model.name.trim(),
        sort_order: Number(this.model.sort_order) || 0 };
      if (this.editingId) await this.svc.updatePartner(this.editingId, payload);
      else await this.svc.createPartner(payload);
      this.showForm = false;
      this.notice.set('Partner saved.');
      await this.load();
    } catch (e: any) { this.error.set(e?.message || 'Save failed.'); }
    finally { this.saving.set(false); }
  }

  async toggleActive(p: AdminPartner): Promise<void> {
    this.busyId.set(p.id);
    this.error.set('');
    try { await this.svc.setPartnerActive(p.id, !p.is_active); await this.load(); }
    catch (e: any) { this.error.set(e?.message || 'Could not update status.'); }
    finally { this.busyId.set(null); }
  }

  async remove(p: AdminPartner): Promise<void> {
    if (!confirm('Delete this partner card permanently?')) return;
    this.busyId.set(p.id);
    this.error.set('');
    try { await this.svc.deletePartner(p.id); await this.load(); }
    catch (e: any) { this.error.set(e?.message || 'Could not delete.'); }
    finally { this.busyId.set(null); }
  }
}
