import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // En SSR no hay cookie disponible — permitir renderizado inicial
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Intentar restaurar sesión desde cookie HttpOnly (defaultValue evita EmptyError)
  await firstValueFrom(authService.restoreSession(), { defaultValue: null });

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
