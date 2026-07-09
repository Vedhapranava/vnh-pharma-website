import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCareersService, AdminJob } from './admin-careers.service';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-jobs.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminJobsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  jobs = signal<AdminJob[]>([]);

  readonly icons = ['mr', 'asm', 'pe', 'ops', 'acc'];

  showForm = false;
  editingId: any = null;
  model = this.blank();
  respText = '';

  constructor(private svc: AdminCareersService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.jobs.set(await this.svc.listJobs());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load jobs.');
    } finally {
      this.loading.set(false);
    }
  }

  blank(): AdminJob {
    return {
      title: '', department: '', location: '', employment_type: 'Full-Time',
      experience: '', description: '', responsibilities: [], icon: 'mr',
      is_active: true, sort_order: 0,
    };
  }

  newJob(): void {
    this.editingId = null;
    this.model = this.blank();
    this.respText = '';
    this.showForm = true;
    this.notice.set('');
  }

  editJob(j: AdminJob): void {
    this.editingId = j.id;
    this.model = { ...j };
    this.respText = Array.isArray(j.responsibilities) ? j.responsibilities.join('\n') : '';
    this.showForm = true;
    this.notice.set('');
  }

  cancel(): void { this.showForm = false; }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.model.title.trim()) { this.error.set('Title is required.'); return; }
    this.saving.set(true);
    this.error.set('');
    try {
      const payload: AdminJob = {
        ...this.model,
        title: this.model.title.trim(),
        responsibilities: this.respText
          .split('\n').map((x) => x.trim()).filter(Boolean),
        sort_order: Number(this.model.sort_order) || 0,
      };
      if (this.editingId) await this.svc.updateJob(this.editingId, payload);
      else await this.svc.createJob(payload);
      this.showForm = false;
      this.notice.set('Job saved.');
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(j: AdminJob): Promise<void> {
    this.busyId.set(j.id);
    this.error.set('');
    try {
      await this.svc.setJobActive(j.id, !j.is_active);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not update status.');
    } finally {
      this.busyId.set(null);
    }
  }
}
