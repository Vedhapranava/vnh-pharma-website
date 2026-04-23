import { Component, OnInit } from '@angular/core';
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
export class ProductsComponent implements OnInit {
  divisions: any[] = [];
  allProducts: any[] = [];
  filteredProducts: any[] = [];

  selectedDivisionId: string | null = null;
  selectedDivisionName = 'All Products';
  searchTerm = '';

  loading = true;
  errorMessage = '';

  constructor(private dataService: DataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDivisions();
    await this.loadProducts();
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
      const sortedImages = (product.product_images || []).slice().sort((a: any, b: any) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        return ao - bo;
      });

      const primaryImage =
        sortedImages.find((img: any) => img.is_primary) ||
        sortedImages[0] ||
        null;

      return {
        ...product,
        primaryImage
      };
    });

    this.applyFilters();
    this.loading = false;
  }

  selectDivision(division: any): void {
    this.selectedDivisionId = division.id;
    this.selectedDivisionName = division.name;
    this.applyFilters();
  }

  showAllProducts(): void {
    this.selectedDivisionId = null;
    this.selectedDivisionName = 'All Products';
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let products = [...this.allProducts];

    if (this.selectedDivisionId) {
      products = products.filter(
        (product: any) => product.division_id === this.selectedDivisionId
      );
    }

    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      products = products.filter((product: any) => {
        const name = (product.name || '').toLowerCase();
        const slug = (product.slug || '').toLowerCase();
        const divisionName = (product.divisions?.name || '').toLowerCase();
        const composition = (product.composition || '').toLowerCase();

        return (
          name.includes(term) ||
          slug.includes(term) ||
          divisionName.includes(term) ||
          composition.includes(term)
        );
      });
    }

    this.filteredProducts = products;
  }

  trackByProduct(index: number, product: any): any {
    return product.id;
  }
}