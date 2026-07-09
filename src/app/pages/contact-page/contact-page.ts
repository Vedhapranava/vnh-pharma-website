import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContentService } from '../../core/content.service';
import { EnquiriesService } from '../../core/enquiries.service';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPage implements OnInit, OnDestroy {

  form!: FormGroup;
  formStatus: FormStatus = 'idle';
  private observer?: IntersectionObserver;

  readonly enquiryTypes = [
    'Product Enquiry',
    'Distribution Enquiry',
    'Institutional Order',
    'Business Partnership',
    'Career Enquiry'
  ];

  readonly officeCards = [
    {
      icon: 'building',
      label: 'Corporate Office',
      lines: ['Genome Valley', 'Hyderabad, Telangana'],
      accent: 'red'
    },
    {
      icon: 'truck',
      label: 'Dispatch Unit',
      lines: ['Mancherial', 'Telangana, India'],
      accent: 'gold'
    },
    {
      icon: 'mail',
      label: 'Email Us',
      lines: ['info@vnhpharma.com'],
      link: 'mailto:info@vnhpharma.com',
      accent: 'red'
    },
    {
      icon: 'phone',
      label: 'Call / WhatsApp',
      lines: ['+91 92872 87287'],
      link: 'tel:+919287287287',
      whatsapp: 'https://wa.me/919287287287',
      accent: 'gold'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private content: ContentService,
    private enquiries: EnquiriesService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      mobile:  ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,16}$/)]],
      email:   ['', [Validators.required, Validators.email]],
      city:    [''],
      enquiry: ['Product Enquiry'],
      message: ['', [Validators.required, Validators.minLength(20)]]
    });

    this.initRevealObserver();
    void this.applyContactSettings();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /**
   * Overlay CMS contact settings onto the hardcoded office cards.
   * Fully fallback-safe: keeps existing values if a setting is missing.
   */
  private async applyContactSettings(): Promise<void> {
    try {
      const s = await this.content.getSettings();
      const patch = (i: number, p: any) => Object.assign(this.officeCards[i] as any, p);

      if (s['contact_email']) {
        patch(2, {
          lines: [String(s['contact_email'])],
          link: 'mailto:' + s['contact_email']
        });
      }

      const phonePatch: any = {};
      if (s['contact_phone_display']) phonePatch.lines = [String(s['contact_phone_display'])];
      if (s['contact_phone_tel']) phonePatch.link = 'tel:' + s['contact_phone_tel'];
      if (s['contact_whatsapp']) phonePatch.whatsapp = String(s['contact_whatsapp']);
      if (Object.keys(phonePatch).length) patch(3, phonePatch);

      const toLines = (v: string) =>
        String(v).split(/\n|,\s*/).map((x) => x.trim()).filter(Boolean);
      if (s['address_corporate']) patch(0, { lines: toLines(s['address_corporate']) });
      if (s['address_dispatch']) patch(1, { lines: toLines(s['address_dispatch']) });

      this.cdr.markForCheck();
    } catch (e) {
      console.warn('[Contact] settings apply failed:', e);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.formStatus = 'sending';
    this.cdr.markForCheck();

    const v = this.form.value;
    try {
      await this.enquiries.submitEnquiry({
        name: v.name,
        mobile: v.mobile || null,
        email: v.email || null,
        city: v.city || null,
        enquiry_type: v.enquiry || null,
        message: v.message || null,
        status: 'new'
      });
      this.formStatus = 'success';
    } catch (e) {
      this.formStatus = 'error';
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    this.form.reset({ enquiry: 'Product Enquiry' });
    this.formStatus = 'idle';
    this.cdr.markForCheck();
  }

  private initRevealObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer!.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    setTimeout(() => {
      document.querySelectorAll('.reveal-up').forEach(el => this.observer!.observe(el));
    }, 60);
  }
}
