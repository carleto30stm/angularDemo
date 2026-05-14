import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/productos-list/productos-list.component').then(
        m => m.ProductosListComponent
      )
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];
