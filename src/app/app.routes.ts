import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },
  {
    path: 'productos',
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
