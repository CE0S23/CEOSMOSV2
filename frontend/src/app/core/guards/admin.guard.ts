import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.checkAuth();
  if (!authenticated) return router.parseUrl('/login');

  const user = authService.user();
  if (user?.role !== 'ADMIN') return router.parseUrl('/feed');

  return true;
};
