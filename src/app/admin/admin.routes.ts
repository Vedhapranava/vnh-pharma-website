import { Routes } from '@angular/router';
import { AdminLoginComponent } from './login/admin-login.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminProductsListComponent } from './products/admin-products-list.component';
import { AdminProductFormComponent } from './products/admin-product-form.component';
import { AdminProductMediaComponent } from './product-media/admin-product-media.component';
import { AdminHomeContentComponent } from './content/admin-home-content.component';
import { AdminAboutContentComponent } from './content/admin-about-content.component';
import { AdminContactContentComponent } from './content/admin-contact-content.component';
import { AdminSettingsComponent } from './settings/admin-settings.component';
import { AdminJobsComponent } from './careers/admin-jobs.component';
import { AdminApplicationsComponent } from './careers/admin-applications.component';
import { AdminEnquiriesComponent } from './enquiries/admin-enquiries.component';
import { AdminOrdersComponent } from './orders/admin-orders.component';
import { AdminPartnersComponent } from './partners/admin-partners.component';
import { AdminDistributorsComponent } from './distributors/admin-distributors.component';
import { AdminAboutPartnersComponent } from './about-cms/admin-about-partners.component';
import { AdminEventsComponent } from './about-cms/admin-events.component';
import { adminGuard } from '../core/admin.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'products', component: AdminProductsListComponent },
      { path: 'products/new', component: AdminProductFormComponent },
      { path: 'products/:id/edit', component: AdminProductFormComponent },
      { path: 'products/:id/media', component: AdminProductMediaComponent },
      { path: 'content/home', component: AdminHomeContentComponent },
      { path: 'content/about', component: AdminAboutContentComponent },
      { path: 'content/contact', component: AdminContactContentComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'careers/jobs', component: AdminJobsComponent },
      { path: 'careers/applications', component: AdminApplicationsComponent },
      { path: 'enquiries', component: AdminEnquiriesComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'partners', component: AdminPartnersComponent },
      { path: 'distributors', component: AdminDistributorsComponent },
      { path: 'about/partners', component: AdminAboutPartnersComponent },
      { path: 'events', component: AdminEventsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
