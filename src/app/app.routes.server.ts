import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    // Rutas protegidas: se renderizan en el servidor por petición (no prerenderizadas)
    path: '**',
    renderMode: RenderMode.Server
  }
];
