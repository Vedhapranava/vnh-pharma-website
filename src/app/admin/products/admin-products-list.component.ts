import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AdminProductService,
  AdminProduct,
  AdminProductImageRef,
} from './admin-product.service';

type ProductFilter = 'all' | 'active' | 'inactive' | 'no-image';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.css',
})
export class AdminProductsListComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  busyId = signal<any>(null);
  products = signal<AdminProduct[]>([]);
  filter = signal<ProductFilter>('all');

  filtered = computed(() => {
    const f = this.filter();
    return this.products().filter((p) => {
      const imgs = p.product_images || [];
      if (f === 'active') return p.is_active;
      if (f === 'inactive') return !p.is_active;
      if (f === 'no-image') return imgs.length === 0;
      return true;
    });
  });

  // Counts for the filter chips.
  countAll = computed(() => this.products().length);
  countActive = computed(() => this.products().filter((p) => p.is_active).length);
  countInactive = computed(() => this.products().filter((p) => !p.is_active).length);
  countNoImage = computed(
    () => this.products().filter((p) => (p.product_images || []).length === 0).length
  );

  constructor(private svc: AdminProductService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.products.set(await this.svc.listProducts());
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load products.');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(f: ProductFilter): void {
    this.filter.set(f);
  }

  imageCount(p: AdminProduct): number {
    return (p.product_images || []).length;
  }

  primaryUrl(p: AdminProduct): string | null {
    const imgs = p.product_images || [];
    if (imgs.length === 0) return null;
    const primary = imgs.find((i) => i.is_primary);
    if (primary) return primary.image_url;
    const sorted = [...imgs].sort(
      (a: AdminProductImageRef, b: AdminProductImageRef) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    return sorted[0]?.image_url ?? null;
  }

  async toggleActive(p: AdminProduct): Promise<void> {
    this.busyId.set(p.id);
    this.error.set('');
    try {
      await this.svc.setActive(p.id, !p.is_active);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not update product status.');
    } finally {
      this.busyId.set(null);
    }
  }
}
