import { Request, Response, NextFunction } from 'express';

// Ruta que emiten la cookie de sesión y el token CSRF (públicas, pre-autenticación).
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/webauthn/login/options',
  '/api/auth/webauthn/login/verify',
  '/api/auth/webauthn/register/options',
  '/api/auth/webauthn/register/verify',
];

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const CSRF_COOKIE = 'csrfToken';
export const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  const method = (req.method ?? '').toUpperCase();

  if (!MUTATING_METHODS.includes(method)) {
    return next();
  }

  if (CSRF_EXEMPT_ROUTES.includes(req.path)) {
    return next();
  }

  const cookieToken = (req.cookies ?? {})[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      statusCode: 403,
      message: 'CSRF token mismatch or missing',
      error: 'Forbidden',
    });
  }

  return next();
}
