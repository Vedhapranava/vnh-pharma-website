import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trust',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust.component.html',
  styleUrl: './trust.component.css'
})
export class TrustComponent implements AfterViewInit {
  @ViewChild('trustSection', { static: true }) trustSection!: ElementRef<HTMLElement>;
  visible = false;

  features = [
    {
      title: 'Premium Brand Trust',
      desc: 'A refined visual identity that strengthens doctor and distributor confidence.'
    },
    {
      title: 'Scalable Portfolio',
      desc: 'Built to support multiple divisions with a consistent premium presentation.'
    },
    {
      title: 'Modern Market Positioning',
      desc: 'Designed for a world-class impression without losing commercial practicality.'
    }
  ];

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.visible = true;
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    observer.observe(this.trustSection.nativeElement);
  }
}