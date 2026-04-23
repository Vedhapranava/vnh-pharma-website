import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { AboutPage } from './pages/about-page/about-page';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailPage } from './pages/product-detail-page/product-detail-page';
import { CareersPage } from './pages/careers-page/careers-page';
import { ContactPage } from './pages/contact-page/contact-page';
import { DistributorLocatorComponent } from './pages/distributor-locator/distributor-locator.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:divisionSlug/:productSlug', component: ProductDetailPage },
  { path: 'careers', component: CareersPage },
  { path: 'contact', component: ContactPage },
  { path: 'locate-distributor', component: DistributorLocatorComponent },
  { path: '**', redirectTo: '' }
];