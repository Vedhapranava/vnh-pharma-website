import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Distributor } from '../../core/data.service';

@Component({
  selector: 'app-distributor-locator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distributor-locator.component.html',
  styleUrl: './distributor-locator.component.css'
})
export class DistributorLocatorComponent implements OnInit {
  searchTerm = '';
  distributors: Distributor[] = [];
  loading = true;
  errorMessage = '';

  constructor(private dataService: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDistributors();
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
}