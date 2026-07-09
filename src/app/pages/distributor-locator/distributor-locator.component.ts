import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Distributor } from '../../core/data.service';

@Component({
  selector: 'app-distributor-locator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './distributor-locator.component.html',
  styleUrl: './distributor-locator.component.css'
})
export class DistributorLocatorComponent implements OnInit, OnDestroy {
  searchTerm = '';
  distributors: Distributor[] = [];
  loading = true;
  errorMessage = '';
  private observer?: IntersectionObserver;

  constructor(private dataService: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDistributors();
    this.initRevealObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  async loadDistributors(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const { data, error } = await this.dataService.getDistributors();

    if (error) {
      this.errorMessage = error.message || 'Failed to load distributors.';
      this.distributors = [];
      this.loading = false;
      return;
    }

    this.distributors = data ?? [];
    this.loading = false;
    // re-observe after data loads
    setTimeout(() => this.initRevealObserver(), 60);
  }

  get filteredDistributors(): Distributor[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.distributors;
    }

    return this.distributors.filter((item) =>
      (item.name || '').toLowerCase().includes(term) ||
      (item.region || '').toLowerCase().includes(term) ||
      (item.address || '').toLowerCase().includes(term) ||
      (item.contact_person || '').toLowerCase().includes(term) ||
      (item.mobile_no || '').toLowerCase().includes(term) ||
      (item.landline || '').toLowerCase().includes(term) ||
      (item.email || '').toLowerCase().includes(term)
    );
  }

  openMap(distributor: Distributor): void {
    if (distributor.map_url && distributor.map_url.trim()) {
      window.open(distributor.map_url, '_blank', 'noopener,noreferrer');
      return;
    }

    const fallbackAddress = distributor.address || distributor.region || distributor.name;
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackAddress)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  }

  trackByDistributor(_: number, item: Distributor): number | string {
    return item.id ?? item.name;
  }

  private initRevealObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer!.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    document.querySelectorAll('.reveal-up').forEach(el => this.observer!.observe(el));
  }
}
