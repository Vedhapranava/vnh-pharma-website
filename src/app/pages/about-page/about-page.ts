import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { AboutCmsService, AboutPartner } from '../../core/about-cms.service';

export interface EventSlide {
  type: 'image' | 'video' | 'featured';
  badgeLabel: string;
  badgeVariant: 'teal' | 'blue' | 'orange';
  title: string;
  description: string;
  mediaSrc?: string;
  posterSrc?: string;
  placeholder: boolean;
}

export interface LeaderCard {
  role: string;
  name: string;
  description: string;
  initials: string;
  featured?: boolean;
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css'
})
export class AboutPage implements OnInit {

  /* ── CMS-overridable about copy (defaults double as fallback) ── */
  aboutLine1 = 'Built on Trust.';
  aboutAccent = 'Powered by Quality.';
  aboutSub = '';
  aboutSubFromDb = false;

  /* ── CMS strategic partners (empty = use hardcoded fallback) ── */
  supportPartners: AboutPartner[] = [];
  partnersFromDb = false;

  readonly highlights = [
    {
      title: 'MNC Standards',
      text: 'Quality-driven products built through reputed certified manufacturing systems trusted across India.'
    },
    {
      title: '20+ Years of Experience',
      text: 'Built on two decades of continuous pharmaceutical marketing experience and deep market understanding.'
    },
    {
      title: 'Doctor-First Values',
      text: 'Physician trust, ethical relationships, and a healthcare-first approach at the core of everything we do.'
    }
  ];

  readonly differentiators = [
    {
      title: 'Doctor-First Ethos',
      text: 'Respect for doctors, trust in healing, and ethical brand thinking drive every decision at VNH.'
    },
    {
      title: '360° Market Understanding',
      text: 'Strong alignment across doctors, hospitals, chemists, and healthcare operations across Telangana.'
    },
    {
      title: 'Trusted Manufacturing',
      text: 'Reputed partners with recognized quality certifications and strict compliance systems.'
    }
  ];

  readonly visionMission = [
    {
      label: 'Our Vision',
      icon: 'vision',
      title: 'Healthcare for Every Home',
      text: 'To be a trusted pharmaceutical company that delivers premium-quality healthcare products to doctors and patients with scientific confidence and ethical values.'
    },
    {
      label: 'Our Mission',
      icon: 'mission',
      title: 'Science. Quality. Trust.',
      text: 'To develop and distribute MNC-standard pharmaceutical products through certified manufacturing, doctor-first relationships, and long-term healthcare partnerships across India.'
    }
  ];

  readonly leadership: LeaderCard[] = [
    {
      role: 'CEO & Managing Director',
      name: 'Mr. Srinivas Mateti',
      description: '20+ years of pharmaceutical marketing expertise. Built VNH on deep physician trust, ethical brand values, and quality-first thinking across Telangana and Andhra Pradesh.',
      initials: 'SM',
      featured: true
    },
    {
      role: 'Director',
      name: 'Director',
      description: 'Strategic governance and leadership, ensuring VNH upholds its commitment to quality, compliance, and ethical healthcare across all operations.',
      initials: 'DIR',
      featured: false
    },
    {
      role: 'Operations & Business Development',
      name: 'Operations Head',
      description: 'Driving operational excellence and expanding VNH\'s market reach through strategic partnerships and field engagement programs.',
      initials: 'OPS',
      featured: false
    },
    {
      role: 'Quality & Product Strategy',
      name: 'Quality Head',
      description: 'Ensuring every product meets MNC-grade standards through rigorous quality systems, scientific oversight, and certified manufacturing alignment.',
      initials: 'QPS',
      featured: false
    }
  ];

  // Mutable so DB flagship events can override; defaults double as fallback.
  eventSlides: EventSlide[] = [
    {
      type: 'featured',
      badgeLabel: 'Doctor CME · Flagship',
      badgeVariant: 'teal',
      title: 'Scientific Engagement Program',
      description: 'A premier continuing medical education event bringing together healthcare professionals and VNH\'s product portfolio.',
      mediaSrc: '',
      placeholder: true
    },
    {
      type: 'image',
      badgeLabel: 'Product Launch',
      badgeVariant: 'orange',
      title: 'New Product Introduction',
      description: 'Celebrating VNH\'s latest addition to its premium pharmaceutical portfolio with industry practitioners.',
      mediaSrc: '',
      placeholder: true
    },
    {
      type: 'video',
      badgeLabel: 'Event Reel · Video',
      badgeVariant: 'blue',
      title: 'VNH at Work',
      description: 'A behind-the-scenes look at VNH\'s scientific engagements and field programs across Telangana.',
      mediaSrc: '',
      posterSrc: '',
      placeholder: true
    },
    {
      type: 'image',
      badgeLabel: 'Doctor Meet',
      badgeVariant: 'teal',
      title: 'Physician Outreach Program',
      description: 'Building lasting relationships with healthcare professionals across Telangana and Andhra Pradesh.',
      mediaSrc: '',
      placeholder: true
    }
  ];

  currentSlide = 0;
  isAnimating = false;
  slideDirection: 'left' | 'right' = 'right';

  constructor(
    private content: ContentService,
    private aboutCms: AboutCmsService
  ) {}

  ngOnInit(): void {
    void this.loadAboutContent();
    void this.loadPartners();
    void this.loadEvents();
  }

  /**
   * Overlay CMS about_main content. Fallback-safe: keeps hardcoded defaults
   * if the section is missing/inactive.
   */
  private async loadAboutContent(): Promise<void> {
    const sec = await this.content.getSection('about_main');
    if (!sec) return;

    if (sec.title) {
      const parts = String(sec.title).split('|');
      this.aboutLine1 = (parts[0] || '').trim() || this.aboutLine1;
      this.aboutAccent = parts.length > 1 ? (parts[1] || '').trim() : '';
    }

    const c = sec.content || {};
    if (c.description) {
      this.aboutSub = String(c.description);
      this.aboutSubFromDb = true;
    }
    if (c.vision) this.visionMission[0].text = String(c.vision);
    if (c.mission) this.visionMission[1].text = String(c.mission);
  }

  /** Load strategic partner cards; keeps hardcoded fallback if none. */
  private async loadPartners(): Promise<void> {
    const rows = await this.aboutCms.getActivePartners();
    if (rows.length > 0) {
      this.supportPartners = rows;
      this.partnersFromDb = true;
    }
  }

  /** Load flagship events; keeps hardcoded fallback if none. */
  private async loadEvents(): Promise<void> {
    const rows = await this.aboutCms.getActiveEvents();
    if (rows.length === 0) return;

    const variants: Array<'teal' | 'blue' | 'orange'> = ['teal', 'blue', 'orange'];
    this.eventSlides = rows.map((e, i) => ({
      type: (e.image_url ? 'image' : 'featured') as EventSlide['type'],
      badgeLabel: e.event_type || 'Event',
      badgeVariant: variants[i % variants.length],
      title: e.title,
      description: e.subtitle || '',
      mediaSrc: e.image_url || '',
      posterSrc: '',
      placeholder: !e.image_url
    }));
    this.currentSlide = 0;
  }

  get totalSlides(): number {
    return this.eventSlides.length;
  }

  goToSlide(index: number): void {
    if (this.isAnimating || index === this.currentSlide) return;
    this.slideDirection = index > this.currentSlide ? 'right' : 'left';
    this.isAnimating = true;
    this.currentSlide = index;
    setTimeout(() => { this.isAnimating = false; }, 500);
  }

  prevSlide(): void {
    const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.goToSlide(prev);
  }

  nextSlide(): void {
    const next = (this.currentSlide + 1) % this.totalSlides;
    this.goToSlide(next);
  }

  getSlideClass(index: number): string {
    if (index === this.currentSlide) return 'slide--active';
    return 'slide--hidden';
  }
}
