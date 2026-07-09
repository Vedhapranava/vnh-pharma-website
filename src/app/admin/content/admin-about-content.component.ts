import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminContentService } from './admin-content.service';

@Component({
  selector: 'app-admin-about-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-about-content.component.html',
  styleUrl: './admin-content.shared.css',
})
export class AdminAboutContentComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  notice = signal('');

  title = '';
  tagline = '';
  description = '';
  vision = '';
  mission = '';
  story = '';

  constructor(private svc: AdminContentService) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const s = await this.svc.getSection('about_main');
      if (s) {
        this.title = s.title ?? '';
        this.tagline = s.subtitle ?? '';
        const c = s.content || {};
        this.description = c.description ?? '';
        this.vision = c.vision ?? '';
        this.mission = c.mission ?? '';
        this.story = c.story ?? '';
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load about content.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await this.svc.upsertSection({
        section_key: 'about_main',
        title: this.title.trim() || null,
        subtitle: this.tagline.trim() || null,
        content: {
          description: this.description.trim(),
          vision: this.vision.trim(),
          mission: this.mission.trim(),
          story: this.story.trim(),
        },
        is_active: true,
      });
      this.notice.set('About content saved.');
    } catch (e: any) {
      this.error.set(e?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }
}
