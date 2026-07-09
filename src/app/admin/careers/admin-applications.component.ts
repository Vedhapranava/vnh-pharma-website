import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCareersService, AdminApplication } from './admin-careers.service';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-applications.component.html',
  styleUrl: '../shared/admin-page.css',
})
export class AdminApplicationsComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);
  apps = signal<AdminApplication[]>([]);

  readonly statuses = ['new', 'contacted', 'shortlisted', 'rejected'];

  constructor(private svc: AdminCareersService) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.apps.set(await this.svc.listApplications());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load applications.');
    } finally {
      this.loading.set(false);
    }
  }

  async changeStatus(a: AdminApplication, status: string): Promise<void> {
    this.busyId.set(a.id);
    this.error.set('');
    try {
      await this.svc.updateApplicationStatus(a.id, status);
      a.status = status;
      this.notice.set('Status updated.');
    } catch (e: any) {
      this.error.set(e?.message || 'Could not update status.');
    } finally {
      this.busyId.set(null);
    }
  }
}
