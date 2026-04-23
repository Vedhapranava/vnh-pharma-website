import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css'
})
export class ProductDetailPage implements OnInit {
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  product = signal<any | null>(null);
  relatedProducts = signal<any[]>([]);
  images = signal<any[]>([]);
  primaryImageUrl = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private data: DataService
  ) {}

  async ngOnInit(): Promise<void> {
    const divisionSlug = this.route.snapshot.paramMap.get('divisionSlug') ?? '';
    const productSlug = this.route.snapshot.paramMap.get('productSlug') ?? '';

    const res = await this.data.getProductBySlugs(divisionSlug, productSlug);

    this.loading.set(false);

    if (res.error) {
      this.errorMsg.set(res.error.message || 'Failed to load product');
      return;
    }

    if (!res.data) {
      this.errorMsg.set('Product not found');
      return;
    }

    const p = res.data;

    const sortedImages = (p.images || p.product_images || [])
      .slice()
      .sort((a: any, b: any) => {
        const ao = a?.sort_order ?? 0;
        const bo = b?.sort_order ?? 0;
        return ao - bo;
      });

    const primary =
      sortedImages.find((img: any) => img?.is_primary === true) ||
      p.primaryImage ||
      sortedImages[0] ||
      null;

    this.product.set({
      ...p,
      category: p.divisions?.name || 'General',
      shortDescription: p.short_desc || ' ',
      overview: p.long_desc || p.short_desc || 'Detailed product information will appear here.',
      compositionLines: this.parseComposition(p.composition),
      benefits: this.buildBenefits(p)
    });

    this.images.set(sortedImages);
    this.primaryImageUrl.set(primary?.image_url || '');

    await this.loadRelatedProducts(p.id, p.division_id);
  }

  setPrimary(url: string): void {
    this.primaryImageUrl.set(url);
  }

  private parseComposition(composition: string | null | undefined): string[] {
    const text = String(composition || '').trim();

    if (!text) {
      return ['Composition not available.'];
    }

    const parts = text
      .split(/,|;|\n/)
      .map(item => item.trim())
      .filter(Boolean);

    return parts.length ? parts : [text];
  }

  private buildBenefits(product: any): string[] {
    const benefits: string[] = [];

    if (product.short_desc) benefits.push('Clear product communication');
    if (product.composition) benefits.push('Strong composition visibility');
    if (product.divisions?.name) benefits.push(`${product.divisions.name} division positioning`);
    benefits.push('Professional brand presentation');

    return benefits.slice(0, 4);
  }

  private async loadRelatedProducts(currentProductId: string, divisionId: string): Promise<void> {
    const res = await this.data.getProducts();

    if (res.error || !res.data) {
      this.relatedProducts.set([]);
      return;
    }

    const related = res.data
      .filter((item: any) =>
        String(item.id) !== String(currentProductId) &&
        String(item.division_id) === String(divisionId)
      )
      .slice(0, 3)
      .map((item: any) => ({
        ...item,
        category: item.divisions?.name || 'General'
      }));

    this.relatedProducts.set(related);
  }
}