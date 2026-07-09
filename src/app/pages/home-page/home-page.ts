import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
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

  private observer: IntersectionObserver | null = null;

  divisions = [
    {
      icon: '💊',
      title: 'Pediatrics',
      description: 'Premium child healthcare products with quality-first formulation and trusted presentation.'
    },
    {
      icon: '🧬',
      title: 'Nutraceuticals',
      description: 'Daily wellness solutions designed for modern healthcare needs and better patient acceptance.'
    },
    {
      icon: '🩺',
      title: 'General Care',
      description: 'Essential pharmaceutical products built around affordability, trust, and consistent quality.'
    },
    {
      icon: '🏥',
      title: 'Institutional Supply',
      description: 'Structured product support for hospitals, clinics, distributors, and healthcare organizations.'
    }
  ];

  cataloguePreview = [
    {
      title: 'Mimoza Baby Care',
      subtitle: 'Pediatric Range',
      note: 'Gentle baby care products with premium presentation and trusted quality.',
      image: 'assets/products/mimozasoap.jpeg',
      hasVideo: false,
      video: ''
    },
    {
      title: 'Mimoza Shampoo',
      subtitle: 'No Tears Formula',
      note: 'A soft, mild, baby-friendly shampoo with clean and professional product identity.',
      image: 'assets/products/mimozashampoo.png',
      hasVideo: true,
      video: 'assets/products/mimoza-shampoo.mp4'
    },
    {
      title: 'Dailysolo',
      subtitle: 'Daily Wellness',
      note: 'Affordable care with premium quality for modern daily healthcare support.',
      image: 'assets/products/dailysolo-syrup.jpg',
      hasVideo: false,
      video: ''
    }
  ];

  ngAfterViewInit(): void {
    this.initRevealObserver();
    this.revealEls.changes.subscribe((): void => {
      this.observeRevealElements();
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private initRevealObserver(): void {
    this.observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        entries.forEach((entry: IntersectionObserverEntry): void => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      }
    );
    this.observeRevealElements();
  }

  private observeRevealElements(): void {
    setTimeout((): void => {
      this.revealEls.forEach(
        (el: ElementRef<HTMLElement>, index: number): void => {
          el.nativeElement.style.setProperty('--reveal-delay', `${index * 80}ms`);
          this.observer?.observe(el.nativeElement);
        }
      );
    });
  }
}
