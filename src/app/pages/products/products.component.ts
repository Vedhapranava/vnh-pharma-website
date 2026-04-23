import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealCard') revealCards!: QueryList<ElementRef<HTMLElement>>;

  divisions: any[] = [];
  allProducts: any[] = [];
  filteredProducts: any[] = [];

  selectedDivisionId: string | null = null;
  selectedDivisionName = 'All';
  searchTerm = '';

  loading = true;
  errorMessage = '';

  private cardObserver?: IntersectionObserver;

  constructor(private dataService: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDivisions();
    await this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.revealCards.changes.subscribe(() => {
      this.initCardObserver();
    });
  }

  async loadDivisions(): Promise<void> {
    const { data, error } = await this.dataService.getDivisions();

    if (error) {
      console.error('Error loading divisions:', error);
      this.errorMessage = error.message || 'Failed to load divisions';
      return;
    }

    this.divisions = data || [];
  }

  async loadProducts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const { data, error } = await this.dataService.getProducts();

    if (error) {
      console.error('Error loading products:', error);
      this.errorMessage = error.message || 'Failed to load products';
      this.loading = false;
      return;
    }

    const rawProducts = data || [];

    this.allProducts = rawProducts.map((product: any) => {
      const matchedDivision =
        this.divisions.find(
          (division: any) => String(division.id) === String(product.division_id)
        ) || null;

      const images = Array.isArray(product.images)
        ? [...product.images].sort(
            (a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
          )
        : [];

      const primaryImage =
        images.find((img: any) => img?.is_primary === true) ||
        product.primaryImage ||
        images[0] ||
        null;

      return {
        ...product,
        divisions: matchedDivision,
        images,
        primaryImage
      };
    });

    this.applyFilters();
    this.loading = false;

    setTimeout(() => this.initCardObserver());
  }

  selectDivision(division: any): void {
    this.selectedDivisionId = division.id;
    this.selectedDivisionName = division.name;
    this.applyFilters();
  }

  showAllProducts(): void {
    this.selectedDivisionId = null;
    this.selectedDivisionName = 'All';
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let products = [...this.allProducts];

    if (this.selectedDivisionId) {
      products = products.filter(
        (product: any) =>
          String(product.division_id) === String(this.selectedDivisionId)
      );
    }

    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      products = products.filter((product: any) => {
        const name = String(product.name || '').toLowerCase();
        const slug = String(product.slug || '').toLowerCase();
        const divisionName = String(product.divisions?.name || '').toLowerCase();
        const composition = String(product.composition || '').toLowerCase();
        const shortDesc = String(product.short_desc || '').toLowerCase();

        return (
          name.includes(term) ||
          slug.includes(term) ||
          divisionName.includes(term) ||
          composition.includes(term) ||
          shortDesc.includes(term)
        );
      });
    }

    this.filteredProducts = products;
    setTimeout(() => this.initCardObserver());
  }

  trackByProduct(index: number, product: any): any {
    return product.id ?? index;
  }

  categoryClass(name: string | undefined): string {
    const value = String(name || '').toLowerCase();

    if (value.includes('gyn')) return 'gynac';
    if (value.includes('neuro')) return 'neuroshine';
    if (value.includes('general')) return 'general';
    if (value.includes('surge')) return 'surgeon';
    if (value.includes('ortho')) return 'ortho';
    if (value.includes('pedia pro')) return 'pedia-pro';
    if (value.includes('pedi')) return 'pediatrics';
    if (value.includes('uro')) return 'uro';

    return 'general';
  }

  private initCardObserver(): void {
    if (this.cardObserver) {
      this.cardObserver.disconnect();
    }

    this.cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.cardObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = this.revealCards?.toArray() || [];

    cards.forEach((card, index) => {
      const el = card.nativeElement;
      el.classList.remove('visible');
      el.style.setProperty('--delay', `${index * 90}ms`);
      this.cardObserver?.observe(el);
    });
  }
}