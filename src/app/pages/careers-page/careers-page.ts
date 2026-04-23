import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-careers-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './careers-page.html',
  styleUrl: './careers-page.css'
})
export class CareersPage implements OnInit {
  animated = false;

  readonly roles = [
    {
      title: 'Medical Representative',
      location: 'Field · Andhra Pradesh / Telangana',
      type: 'Full-Time',
      description:
        'Drive product awareness and adoption across doctors, clinics, and hospitals within your assigned territory.',
      responsibilities: [
        'Build and maintain relationships with doctors and chemists',
        'Present VNH product portfolio with confidence',
        'Achieve monthly territory targets'
      ]
    },
    {
      title: 'Product Executive',
      location: 'Office · Hyderabad',
      type: 'Full-Time',
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
      description:
        'Keep dispatch, coordination, and logistics flowing smoothly across the supply chain.',
      responsibilities: [
        'Manage stock dispatch and tracking',
        'Coordinate with distributor network',
        'Maintain structured operations workflow'
      ]
    }
  ];

  readonly values = [
    {
      icon: '✦',
      title: 'Growth Culture',
      text: 'We invest in people who want to grow alongside the brand.'
    },
    {
      icon: '✚',
      title: 'Ethical Practice',
      text: 'Doctor-first thinking and transparency define how we work.'
    },
    {
      icon: '◈',
      title: 'Market Impact',
      text: 'Every role contributes to meaningful healthcare reach.'
    },
    {
      icon: '⬡',
      title: 'Professional Trust',
      text: 'We build careers the same way we build brands — with credibility.'
    }
  ];

  ngOnInit(): void {
    requestAnimationFrame(() => {
      setTimeout(() => { this.animated = true; }, 60);
    });
  }
}