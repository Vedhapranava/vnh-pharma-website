import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';

interface Particle {
  x: number;
  delay: number;
  duration: number;
  size: number;
  hue: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit, OnDestroy {

  /* ── Entrance animation state ────────────────────────── */
  ready = false;

  /* ── Parallax state (mouse-move) ─────────────────────── */
  parallaxX = 0;
  parallaxY = 0;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private parallaxEnabled = true;

  /* ── Background video state ──────────────────────────── */
  readonly videoSrc    = 'assets/hero/hero-bg.mp4';
  readonly videoPoster = 'assets/hero/hero-poster.jpg';
  videoActive  = false;
  videoLoaded  = false;

  /* ── Floating premium particles ──────────────────────── */
  particles: Particle[] = [];

  /* ── CMS-overridable hero copy (defaults double as fallback) ── */
  heroLine1 = 'MNC Quality.';
  heroLine2 = 'Trusted Healthcare.';
  heroSubtitle =
    'VNH Pharmaceuticals delivers quality-focused healthcare products supported by ' +
    'reputed manufacturing partnerships, scientific presentation, and doctor-first trust.';
  heroCta = 'Explore Products';

  /* ── Static data ─────────────────────────────────────── */
  readonly stats = [
    { value: '18+',  label: 'Years of expertise'      },
    { value: '6',    label: 'Certified manufacturers' },
    { value: '100%', label: 'Ethical standards'       }
  ];

  readonly previewProducts = [
    { name: 'Mimoza Baby Soap', division: 'Baby Care',      status: 'Active' },
    { name: 'Mimoza Shampoo',   division: 'Baby Care',      status: 'Active' },
    { name: 'Dailysolo Syrup',  division: 'Nutraceuticals', status: 'Active' }
  ];

  readonly certBadges = ['WHO-GMP', 'ISO Certified', 'FSSAI', 'Doctor-First'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private content: ContentService
  ) {}

  ngOnInit(): void {
    // Red (hue ~0) + Gold (hue ~40) particle palette
    this.particles = this.buildParticles(18);

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      this.parallaxEnabled = false;
    }

    if (typeof window !== 'undefined') {
      const isWide = window.matchMedia('(min-width: 1024px)').matches;
      this.videoActive = isWide && !reduceMotion;
    }

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.ready = true;
          this.cdr.markForCheck();
        }, 80);
      });
    } else {
      this.ready = true;
    }

    if (this.parallaxEnabled) {
      this.startParallaxLoop();
    }

    void this.loadHeroContent();
  }

  /**
   * Overlay CMS home_hero content. Fallback-safe: keeps the hardcoded
   * defaults if the section is missing/inactive. Title supports an optional
   * "|" separator to split the two headline lines.
   */
  private async loadHeroContent(): Promise<void> {
    const sec = await this.content.getSection('home_hero');
    if (!sec) return;

    if (sec.title) {
      const parts = String(sec.title).split('|');
      this.heroLine1 = (parts[0] || '').trim() || this.heroLine1;
      this.heroLine2 = parts.length > 1 ? (parts[1] || '').trim() : '';
    }
    if (sec.subtitle) this.heroSubtitle = String(sec.subtitle);

    const c = sec.content || {};
    if (c.ctaText) this.heroCta = String(c.ctaText);

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.parallaxEnabled) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.targetX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    this.targetY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.targetX = 0;
    this.targetY = 0;
  }

  onVideoLoaded(): void {
    this.videoLoaded = true;
    this.cdr.markForCheck();
  }

  onVideoError(): void {
    this.videoActive = false;
    this.videoLoaded = false;
    this.cdr.markForCheck();
  }

  onScrollHint(event: Event): void {
    event.preventDefault();
    if (typeof window === 'undefined') return;
    const target = this.el.nativeElement.getBoundingClientRect().bottom + window.scrollY - 80;
    window.scrollTo({ top: target, behavior: 'smooth' });
  }

  private startParallaxLoop(): void {
    const tick = () => {
      this.currentX += (this.targetX - this.currentX) * 0.06;
      this.currentY += (this.targetY - this.currentY) * 0.06;
      this.parallaxX = this.currentX;
      this.parallaxY = this.currentY;
      this.cdr.markForCheck();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private buildParticles(count: number): Particle[] {
    const particles: Particle[] = [];
    // Red hues (0–12) and Gold hues (35–48) to match brand palette
    const hues = [0, 4, 8, 40, 44, 6, 42, 2, 46, 10, 38, 3, 48, 5, 41, 7, 36, 9];
    for (let i = 0; i < count; i++) {
      particles.push({
        x:        Math.round(this.seededRandom(i + 1) * 100),
        delay:    +(this.seededRandom(i + 2) * 14).toFixed(2),
        duration: 13 + +(this.seededRandom(i + 3) * 10).toFixed(2),
        size:     2 + Math.round(this.seededRandom(i + 4) * 4),
        hue:      hues[i % hues.length]
      });
    }
    return particles;
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }
}
