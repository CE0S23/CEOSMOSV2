import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isApiUrl = req.url.startsWith(environment.apiUrl) || !req.url.startsWith('http');
  const targetUrl = req.url;

  let headers = req.headers;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
    if (csrfMatch) {
      headers = headers.set('x-csrf-token', csrfMatch[1]);
    }
  }

  const authReq = req.clone({
    url: targetUrl,
    withCredentials: true,
    headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/users/me')) {
        authService.setAuthenticated(false);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
