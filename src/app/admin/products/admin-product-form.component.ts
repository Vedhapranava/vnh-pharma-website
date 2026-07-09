import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AdminProductService,
  AdminDivision,
  AdminCategory,
  AdminProductInput,
} from './admin-product.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css',
})
export class AdminProductFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  isEdit = signal(false);
  productId: any = null;

  divisions = signal<AdminDivision[]>([]);
  categories = signal<AdminCategory[]>([]);
  categoriesAvailable = signal(false);

  // Form model
  name = '';
  slug = '';
  slugTouched = false;
  divisionId: any = '';
  categoryId: any = '';
  shortDesc = '';
  longDesc = '';
  composition = '';
  sortOrder = 0;
  isActive = true;

  constructor(
    private svc: AdminProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [divisions, categories] = await Promise.all([
        this.svc.getDivisions(),
        this.svc.getCategories(),
      ]);
      this.divisions.set(divisions);
      this.categories.set(categories);
      this.categoriesAvailable.set(categories.length > 0);

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEdit.set(true);
        this.productId = id;
        const p = await this.svc.getProduct(id);
        if (!p) {
          this.error.set('Product not found.');
        } else {
          this.name = p.name ?? '';
          this.slug = p.slug ?? '';
          this.slugTouched = true;
          this.divisionId = p.division_id ?? '';
          this.categoryId = (p as any).category_id ?? '';
          this.shortDesc = p.short_desc ?? '';
          this.longDesc = p.long_desc ?? '';
          this.composition = p.composition ?? '';
          this.sortOrder = p.sort_order ?? 0;
          this.isActive = p.is_active ?? true;
        }
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load form data.');
    } finally {
      this.loading.set(false);
    }
  }

  onNameInput(): void {
    if (!this.slugTouched) {
      this.slug = this.slugify(this.name);
    }
  }

  onSlugInput(): void {
    this.slugTouched = true;
  }

  slugify(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async onSubmit(): Promise<void> {
    if (this.saving()) return;
    this.error.set('');

    const cleanSlug = this.slugify(this.slug || this.name);
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    if (!cleanSlug) {
      this.error.set('A valid slug is required.');
      return;
    }
    if (!this.divisionId) {
      this.error.set('Please select a division.');
      return;
    }

    const payload: AdminProductInput = {
      name: this.name.trim(),
      slug: cleanSlug,
      division_id: this.divisionId,
      short_desc: this.shortDesc.trim() || null,
      long_desc: this.longDesc.trim() || null,
      composition: this.composition.trim() || null,
      sort_order: Number(this.sortOrder) || 0,
      is_active: this.isActive,
    };

    // Only write category_id when categories exist AND one is chosen.
    // Keeps inserts safe on schemas without a category_id column.
    if (this.categoriesAvailable() && this.categoryId) {
      payload.category_id = this.categoryId;
    }

    this.saving.set(true);
    try {
      if (this.isEdit()) {
        await this.svc.updateProduct(this.productId, payload);
      } else {
        await this.svc.createProduct(payload);
      }
      await this.router.navigate(['/admin/products']);
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }
}
