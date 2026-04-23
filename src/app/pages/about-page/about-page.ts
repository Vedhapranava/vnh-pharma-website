import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css'
})
export class AboutPage {
  readonly highlights = [
    {
      title: 'MNC Standards',
      text: 'Quality-driven products built through reputed manufacturing systems.'
    },
    {
      title: 'Franchise Pricing',
      text: 'Better value and lower MRP positioning without compromising presentation.'
    },
    {
      title: '18 Years of Experience',
      text: 'Built on deep pharmaceutical marketing experience and long-term market understanding.'
    }
  ];

  readonly differentiators = [
    {
      title: 'Doctor-First Ethos',
      text: 'Respect for doctors, trust in healing, and ethical brand thinking.'
    },
    {
      title: '360° Market Understanding',
      text: 'Strong alignment across doctors, hospitals, chemists, and operations.'
    },
    {
      title: 'Trusted Manufacturing',
      text: 'Reputed partners with recognized quality and compliance systems.'
    }
  ];

  readonly partners = [
    'Akums',
    'Pure & Cure',
    'Unique Biotech',
    'Tirupati Life Sciences',
    'Jain Soap Works',
    'WHO-GMP / ISO / FSSAI'
  ];
}