import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';

type ProductItem = {
  name: string;
  sku: string;
  category: string;
};

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements AfterViewInit {
  filters = ['All', 'General', 'Gynac', 'Neuroshine', 'Ortho', 'Pedia Pro', 'Pediatrics', 'Surgeon', 'Uro'];
  selectedFilter = 'All';

  products: ProductItem[] = [
    { name: 'Mimoza Baby Shampoo', sku: 'VNH-PED-001', category: 'Pediatrics' },
    { name: 'Dailysolo Adult Syrup', sku: 'VNH-GEN-014', category: 'General' },
    { name: 'Dailysolo 9M', sku: 'VNH-GYN-008', category: 'Gynac' },
    { name: 'Neuro Care Plus', sku: 'VNH-NEU-012', category: 'Neuroshine' },
    { name: 'Ortho Flex Support', sku: 'VNH-ORT-005', category: 'Ortho' },
    { name: 'Pedia Pro Drops', sku: 'VNH-PPR-002', category: 'Pedia Pro' },
    { name: 'Surgi Heal Range', sku: 'VNH-SUR-006', category: 'Surgeon' },
    { name: 'Uro Relief Formula', sku: 'VNH-URO-004', category: 'Uro' }
  ];

  @ViewChildren('revealCard') revealCards!: QueryList<ElementRef<HTMLElement>>;

  get filteredProducts(): ProductItem[] {
    if (this.selectedFilter === 'All') return this.products;
    return this.products.filter(product => product.category === this.selectedFilter);
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    setTimeout(() => this.initCardObserver());
  }

  ngAfterViewInit(): void {
    this.initCardObserver();
  }

  private initCardObserver(): void {
    const cards = this.revealCards?.toArray() ?? [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    cards.forEach((card, index) => {
      card.nativeElement.style.setProperty('--delay', `${index * 90}ms`);
      observer.observe(card.nativeElement);
    });
  }
}