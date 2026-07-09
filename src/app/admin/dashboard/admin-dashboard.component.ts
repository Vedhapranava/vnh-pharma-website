import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AdminProductService,
  DashboardStats,
  AdminProduct,
} from '../products/admin-product.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  stats = signal<DashboardStats | null>(null);

  constructor(private svc: AdminProductService) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.stats.set(await this.svc.getDashboardStats());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load dashboard stats.');
    } finally {
      this.loading.set(false);
    }
  }

  trackById(_: number, p: AdminProduct): any {
    return p.id;
  }
}
