import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CareersService } from '../../core/careers.service';

type AppStatus = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-careers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './careers-page.html',
  styleUrl: './careers-page.css'
})
export class CareersPage implements OnInit, OnDestroy {

  animated = false;
  private observer?: IntersectionObserver;

  // Mutable so DB jobs can override; defaults double as fallback.
  roles: any[] = [
    {
      title: 'Medical Representative',
      location: 'Field · Andhra Pradesh / Telangana',
      type: 'Full-Time',
      icon: 'mr',
      description:
        'Drive product awareness and adoption across doctors, clinics, and hospitals within your assigned territory.',
      responsibilities: [
        'Build and maintain relationships with doctors and chemists',
        'Present VNH product portfolio with confidence',
        'Achieve monthly territory targets'
      ]
    },
    {
      title: 'Area Sales Manager',
      location: 'Field · Telangana / AP Region',
      type: 'Full-Time',
      icon: 'asm',
      description:
        'Lead and mentor a team of medical representatives, driving regional sales performance and market expansion.',
      responsibilities: [
        'Manage and coach a team of 6–10 medical representatives',
        'Set regional targets and monitor performance metrics',
        'Build key doctor and institution relationships at the area level'
      ]
    },
    {
      title: 'Product Executive',
      location: 'Office · Hyderabad',
      type: 'Full-Time',
      icon: 'pe',
      description:
        'Support product strategy, promotional material creation, and brand communication across divisions.',
      responsibilities: [
        'Coordinate between marketing and field teams',
        'Develop product communication tools',
        'Track competitive market intelligence'
      ]
    },
    {
      title: 'Operations Support',
      location: 'Office · Hyderabad',
      type: 'Full-Time',
      icon: 'ops',
      description:
        'Keep dispatch, coordination, and logistics flowing smoothly across the supply chain.',
      responsibilities: [
        'Manage stock dispatch and tracking',
        'Coordinate with distributor network',
        'Maintain structured operations workflow'
      ]
    },
    {
      title: 'Accounts Executive',
      location: 'Office · Hyderabad',
      type: 'Full-Time',
      icon: 'acc',
      description:
        'Handle financial records, vendor accounts, and reconciliation to support smooth business operations.',
      responsibilities: [
        'Maintain day-to-day accounts and ledger entries',
        'Process invoices, payments, and reconciliations',
        'Coordinate with operations and distribution teams on billing'
      ]
    }
  ];

  readonly values = [
    { icon: '✦', title: 'Growth Culture', text: 'We invest in people who want to grow alongside the brand.' },
    { icon: '✚', title: 'Ethical Practice', text: 'Doctor-first thinking and transparency define how we work.' },
    { icon: '◈', title: 'Market Impact', text: 'Every role contributes to meaningful healthcare reach.' },
    { icon: '⬡', title: 'Professional Trust', text: 'We build careers the same way we build brands — with credibility.' }
  ];

  readonly stats = [
    { value: '20+', label: 'Years of Pharma Legacy' },
    { value: '82+', label: 'Products in Portfolio' },
    { value: '5',   label: 'Open Roles Right Now' },
    { value: '2',   label: 'States — AP & Telangana' }
  ];

  private readonly knownIcons = ['mr', 'asm', 'pe', 'ops', 'acc'];

  // ── Application form ──
  appModel = {
    full_name: '', email: '', phone: '', city: '',
    role: '', experience: '', resume_url: '', cover_note: ''
  };
  appStatus: AppStatus = 'idle';
  appError = '';

  constructor(private careers: CareersService) {}

  ngOnInit(): void {
    requestAnimationFrame(() => {
      setTimeout(() => { this.animated = true; }, 60);
    });
    this.initRevealObserver();
    void this.loadJobs();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private async loadJobs(): Promise<void> {
    const jobs = await this.careers.getActiveJobs();
    if (jobs.length === 0) return; // keep hardcoded fallback
    this.roles = jobs.map((j) => ({
      title: j.title,
      location: j.location || '',
      type: j.employment_type || 'Full-Time',
      icon: this.knownIcons.includes(String(j.icon)) ? j.icon : 'mr',
      description: j.description || '',
      responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities : []
    }));
  }

  async submitApplication(): Promise<void> {
    if (this.appStatus === 'sending') return;
    this.appError = '';
    if (!this.appModel.full_name.trim()) {
      this.appError = 'Please enter your name.';
      return;
    }
    this.appStatus = 'sending';
    try {
      await this.careers.submitApplication({
        job_title: this.appModel.role.trim() || 'General Application',
        full_name: this.appModel.full_name.trim(),
        email: this.appModel.email.trim() || null,
        phone: this.appModel.phone.trim() || null,
        city: this.appModel.city.trim() || null,
        experience: this.appModel.experience.trim() || null,
        resume_url: this.appModel.resume_url.trim() || null,
        cover_note: this.appModel.cover_note.trim() || null,
        status: 'new'
      });
      this.appStatus = 'success';
      this.appModel = {
        full_name: '', email: '', phone: '', city: '',
        role: '', experience: '', resume_url: '', cover_note: ''
      };
    } catch (e: any) {
      this.appStatus = 'error';
      this.appError = e?.message || 'Could not submit your application. Please try again.';
    }
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
    }, 80);
  }
}
