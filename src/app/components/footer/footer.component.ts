import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  // Defaults double as fallback if CMS settings are missing.
  contactEmail = 'info@vnhpharma.com';
  contactPhoneDisplay = '+91 92872 87287';
  contactPhoneTel = '+919287287287';
  contactWhatsapp = 'https://wa.me/919287287287';
  socialLinkedin = '#';
  socialInstagram = '#';
  socialTwitter = '#';
  socialYoutube = '#';

  constructor(private content: ContentService) {}

  async ngOnInit(): Promise<void> {
    const s = await this.content.getSettings();
    const pick = (v: any, fb: string) =>
      v === undefined || v === null || v === '' ? fb : String(v);

    this.contactEmail = pick(s['contact_email'], this.contactEmail);
    this.contactPhoneDisplay = pick(s['contact_phone_display'], this.contactPhoneDisplay);
    this.contactPhoneTel = pick(s['contact_phone_tel'], this.contactPhoneTel);
    this.contactWhatsapp = pick(s['contact_whatsapp'], this.contactWhatsapp);
    this.socialLinkedin = pick(s['social_linkedin'], this.socialLinkedin);
    this.socialInstagram = pick(s['social_instagram'], this.socialInstagram);
    this.socialTwitter = pick(s['social_twitter'], this.socialTwitter);
    this.socialYoutube = pick(s['social_youtube'], this.socialYoutube);
  }
}
