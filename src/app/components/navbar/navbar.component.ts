import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {

  isScrolled     = false;
  mobileMenuOpen = false;

  /* ── Marquee text (doubled array for seamless CSS loop) ── */
  private readonly marqueeItems: readonly string[] = [
    'WHO-GMP Certified Manufacturing',
    'Doctor-First Brand Values',
    '18+ Years of Pharmaceutical Excellence',
    'Premium MNC Quality Standards',
    'Assured Product Confidence',
    'Trusted by Physicians Across India',
    'ISO Certified Supply Chain',
    'Ethical Healthcare Positioning'
  ];

  readonly marqueeTrack: readonly string[] = [
    ...this.marqueeItems,
    ...this.marqueeItems
  ];

  private readonly routerSub: Subscription;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    /* Auto-close mobile menu on every route change */
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 20;
    }
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
    this.unlockBodyScroll();
  }

  /* ── Scroll handler ─────────────────────────────────── */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const scrolled = window.scrollY > 20;
    if (scrolled !== this.isScrolled) {
      this.isScrolled = scrolled;
      this.cdr.markForCheck();
    }
  }

  /* ── Keyboard: Escape closes menu ──────────────────── */
  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  /* ── Mobile menu ──────────────────────────────────── */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.mobileMenuOpen ? this.lockBodyScroll() : this.unlockBodyScroll();
    this.cdr.markForCheck();
  }

  closeMobileMenu(): void {
    if (!this.mobileMenuOpen) return;
    this.mobileMenuOpen = false;
    this.unlockBodyScroll();
    this.cdr.markForCheck();
  }

  /* ── Body scroll lock helpers ─────────────────────── */
  private lockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }
}
