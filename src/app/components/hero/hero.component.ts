import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, OnDestroy {

  /* ── Entrance animation state ────────────────────────── */
  ready = false;

  /* ── Parallax state (mouse-move light effect) ────────── */
  parallaxX = 0;
  parallaxY = 0;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private parallaxEnabled = true;

  /* ── Static data ─────────────────────────────────────── */
  readonly stats = [
    { value: '18+',  label: 'Years of expertise'       },
    { value: '6',    label: 'Certified manufacturers'  },
    { value: '100%', label: 'Ethical standards'        },
  ];

  readonly previewProducts = [
    { name: 'Mimoza Baby Soap',    division: 'Baby Care',      status: 'Active' },
    { name: 'Mimoza Shampoo',      division: 'Baby Care',      status: 'Active' },
    { name: 'Dailysolo Syrup',     division: 'Nutraceuticals', status: 'Active' },
  ];

  readonly certBadges = ['WHO-GMP', 'ISO Certified', 'FSSAI', 'Doctor-First'];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    /* Slight delay so CSS transition fires after first paint */
    requestAnimationFrame(() => {
      setTimeout(() => { this.ready = true; }, 80);
    });

    /* Disable parallax on reduced-motion preference */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.parallaxEnabled = false;
    }

    this.startParallaxLoop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  /* ── Mouse move → smooth parallax via lerp ───────────── */
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.parallaxEnabled) return;
    const rect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    /* Normalise to -1 … +1 relative to section centre */
    this.targetX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    this.targetY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.targetX = 0;
    this.targetY = 0;
  }

  private startParallaxLoop(): void {
    const tick = () => {
      /* Linear interpolation — smooth, never janky */
      this.currentX += (this.targetX - this.currentX) * 0.06;
      this.currentY += (this.targetY - this.currentY) * 0.06;
      this.parallaxX = this.currentX;
      this.parallaxY = this.currentY;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}