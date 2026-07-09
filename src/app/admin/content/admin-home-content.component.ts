import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminContentService } from './admin-content.service';

interface HeroStat { value: string; label: string; }

@Component({
  selector: 'app-admin-home-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-home-content.component.html',
  styleUrl: './admin-content.shared.css',
})
export class AdminHomeContentComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');

  heroTitle = '';
  heroSubtitle = '';
  ctaText = '';
  stats: HeroStat[] = [];

  constructor(private svc: AdminContentService) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const s = await this.svc.getSection('home_hero');
      if (s) {
        this.heroTitle = s.title ?? '';
        this.heroSubtitle = s.subtitle ?? '';
        const c = s.content || {};
        this.ctaText = c.ctaText ?? '';
        this.stats = Array.isArray(c.stats) ? c.stats : [];
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load home content.');
    } finally {
      this.loading.set(false);
    }
  }

  addStat(): void { this.stats.push({ value: '', label: '' }); }
  removeStat(i: number): void { this.stats.splice(i, 1); }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await this.svc.upsertSection({
        section_key: 'home_hero',
        title: this.heroTitle.trim() || null,
        subtitle: this.heroSubtitle.trim() || null,
        content: {
          ctaText: this.ctaText.trim(),
          stats: this.stats
            .filter((s) => s.value.trim() || s.label.trim())
            .map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
        },
        is_active: true,
      });
      this.notice.set('Home content saved.');
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }
}
