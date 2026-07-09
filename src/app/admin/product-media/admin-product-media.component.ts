import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminProductService, AdminProduct } from '../products/admin-product.service';
import { AdminMediaService, AdminProductImage } from './admin-media.service';

@Component({
  selector: 'app-admin-product-media',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-product-media.component.html',
  styleUrl: './admin-product-media.component.css',
})
export class AdminProductMediaComponent implements OnInit {
  loading = signal(true);
  uploading = signal(false);
  error = signal('');
  notice = signal('');
  busyId = signal<any>(null);

  productId: any = null;
  product = signal<AdminProduct | null>(null);
  images = signal<AdminProductImage[]>([]);
  selectedFiles: File[] = [];

  constructor(
    private products: AdminProductService,
    private media: AdminMediaService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id');
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const p = await this.products.getProduct(this.productId);
      if (!p) {
        this.error.set('Product not found.');
        return;
      }
      this.product.set(p);
      this.images.set(await this.media.listImages(this.productId));
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load media.');
    } finally {
      this.loading.set(false);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  async uploadSelected(): Promise<void> {
    if (this.uploading() || this.selectedFiles.length === 0) return;
    const p = this.product();
    if (!p) return;

    this.uploading.set(true);
    this.error.set('');
    this.notice.set('');

    try {
      const existingCount = this.images().length;
      let added = 0;

      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        const path = this.media.buildStoragePath(p.slug, file.name, i + 1);
        const publicUrl = await this.media.uploadFile(path, file);

        // First image overall becomes primary (#11).
        const isPrimary = existingCount === 0 && added === 0;

        await this.media.insertImageRow({
          product_id: this.productId,
          image_url: publicUrl,
          alt_text: p.name,
          is_primary: isPrimary,
          sort_order: existingCount + added,
        });
        added++;
      }

      this.selectedFiles = [];
      this.notice.set(`Uploaded ${added} image(s).`);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Upload failed.');
    } finally {
      this.uploading.set(false);
    }
  }

  async makePrimary(img: AdminProductImage): Promise<void> {
    this.busyId.set(img.id);
    this.error.set('');
    try {
      await this.media.setPrimary(this.productId, img.id);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not set primary image.');
    } finally {
      this.busyId.set(null);
    }
  }

  async saveMeta(img: AdminProductImage): Promise<void> {
    this.busyId.set(img.id);
    this.error.set('');
    try {
      await this.media.updateImageMeta(img.id, {
        alt_text: (img.alt_text || '').trim() || null,
        sort_order: Number(img.sort_order) || 0,
      });
      this.notice.set('Saved.');
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not save changes.');
    } finally {
      this.busyId.set(null);
    }
  }

  async deleteImage(img: AdminProductImage): Promise<void> {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    this.busyId.set(img.id);
    this.error.set('');
    try {
      await this.media.deleteImageRow(img.id);
      await this.media.deleteStorageObject(img.image_url); // best-effort
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not delete image.');
    } finally {
      this.busyId.set(null);
    }
  }

  async copyUrl(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.notice.set('URL copied to clipboard.');
    } catch {
      this.notice.set('Copy failed — select and copy manually.');
    }
  }
}
