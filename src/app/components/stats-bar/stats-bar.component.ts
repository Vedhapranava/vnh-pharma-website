import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-bar.component.html',
  styleUrl: './stats-bar.component.css'
})
export class StatsBarComponent implements AfterViewInit {
  @ViewChild('statsSection', { static: true }) statsSection!: ElementRef<HTMLElement>;
  visible = false;

  stats = [
    { value: '82+', label: 'Products' },
    { value: '8', label: 'Divisions' },
    { value: '500+', label: 'Partners' },
    { value: '10+', label: 'Years' }
  ];

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.visible = true;
        observer.disconnect();
      }
    }, { threshold: 0.25 });

    observer.observe(this.statsSection.nativeElement);
  }
}