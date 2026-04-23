import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../../components/hero/hero.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  readonly divisions = [
    {
      icon: '🏭',
      title: 'MNC Manufacturers',
      description:
        'Products developed through reputed manufacturing partners with dependable process standards and professional credibility.'
    },
    {
      icon: '🛡️',
      title: 'Assured Quality',
      description:
        'A strong focus on consistency, trust, and product confidence across every brand we bring to market.'
    },
    {
      icon: '📦',
      title: 'Attractive Packing',
      description:
        'Premium presentation designed to create stronger shelf appeal, recall, and professional brand value.'
    },
    {
      icon: '✦',
      title: 'Market-Ready Portfolio',
      description:
        'Well-positioned healthcare brands built for doctors, distributors, pharmacies, and growing market reach.'
    }
  ];

  readonly promiseCards = [
    {
      icon: '🏭',
      title: 'Manufacturing Strength',
      text:
        'We work with reputed manufacturers to deliver products that reflect trust, process strength, and professional credibility.'
    },
    {
      icon: '🛡️',
      title: 'Quality Confidence',
      text:
        'VNH is built around dependable product quality, consistent presentation, and long-term brand confidence.'
    },
    {
      icon: '📦',
      title: 'Premium Presentation',
      text:
        'Thoughtful packing and attractive visual identity help our products stand out with stronger shelf impact.'
    },
    {
      icon: '🤝',
      title: 'Built For Market Acceptance',
      text:
        'Our approach supports doctors, distributors, pharmacies, and end users with practical and trust-led brand positioning.'
    }
  ];

  readonly cataloguePreview = [
    {
      title: 'Mimoza Soap',
      subtitle: 'Baby Care Range',
      note:
        'A gentle baby cleansing bar presented with a clean, soft, and premium shelf-friendly identity.',
      image: 'assets/products/mimozasoap.jpeg',
      hasVideo: false,
      video: ''
    },
    {
      title: 'Mimoza Shampoo',
      subtitle: 'Baby Care Range',
      note:
        'A mild and tear-free baby shampoo designed for soft cleansing with modern and attractive product presentation.',
      image: 'assets/products/mimozashampoo.png',
      hasVideo: true,
      video: 'assets/products/mimoza-shampoo.mp4'
    },
    {
      title: 'Dailysolo Syrup',
      subtitle: 'Nutraceutical Portfolio',
      note:
        'A daily wellness syrup positioned with quality-focused communication and professional market appeal.',
      image: 'assets/products/dailysolo-syrup.jpg',
      hasVideo: false,
      video: ''
    }
  ];

  readonly contactNumber = '7995936524';

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    setTimeout(() => {
      this.revealEls.forEach((el, i) => {
        el.nativeElement.style.setProperty('--reveal-delay', `${i * 90}ms`);
        this.observer?.observe(el.nativeElement);
      });
    }, 60);

    this.revealEls.changes.subscribe(() => {
      setTimeout(() => {
        this.revealEls.forEach((el, i) => {
          el.nativeElement.style.setProperty('--reveal-delay', `${i * 90}ms`);
          this.observer?.observe(el.nativeElement);
        });
      }, 60);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}