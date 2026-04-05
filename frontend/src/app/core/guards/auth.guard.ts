import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.checkAuth();
  return authenticated ? true : router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.checkAuth();
  return authenticated ? router.parseUrl('/') : true;
};
