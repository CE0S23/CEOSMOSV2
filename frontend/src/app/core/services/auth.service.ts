import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserProfile, AuthState } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly state = this._state.asReadonly();
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);

  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, isLoading: loading }));
  }

  setUser(user: UserProfile | null): void {
    if (user) {
      this._state.set({ user, isAuthenticated: true, isLoading: false });
    } else {
      this._state.set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }

  setAuthenticated(isAuth: boolean) {
    this._state.update(s => ({ ...s, isAuthenticated: isAuth }));
    if (!isAuth) {
      this.setUser(null);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/auth/logout`, {}));
    } finally {
      this.setUser(null);
      this.router.navigate(['/login']);
    }
  }

  async checkAuth(): Promise<boolean> {
    if (this.isAuthenticated()) return true;
    try {
      await this.getMe();
      return true;
    } catch {
      return false;
    }
  }

  // --- API Authentication Methods ---

  async getMe(): Promise<UserProfile> {
    const user = await firstValueFrom(this.http.get<UserProfile>(`${this.apiUrl}/users/me`));
    this.setUser(user);
    return user;
  }

  async register(data: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/register`, data));
  }

  async verifyEmail(email: string, code: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/verify-email`, { email, code }));
  }

  async resendVerification(email: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/resend-verification`, { email }));
  }

  async login(data: any): Promise<any> {
    const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/login`, data));
    // Cookie is set automatically by the backend response
    await this.getMe();
    return response;
  }

  async webAuthnRegisterOptions(email: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/webauthn/register/options`, { email }));
  }

  async webAuthnRegisterVerify(data: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/webauthn/register/verify`, data));
  }

  async webAuthnLoginOptions(email: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/webauthn/login/options`, { email }));
  }

  async webAuthnLoginVerify(data: any): Promise<any> {
    const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/webauthn/login/verify`, data));
    // Cookie is set automatically by the backend response
    await this.getMe();
    return response;
  }

  async forgotPassword(email: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }));
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword }));
  }

  isPasskeySupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );
  }

  async checkPlatformAuthenticator(): Promise<boolean> {
    if (!this.isPasskeySupported()) return false;
    return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  handleGoogleCredential(credentialJwt: string): void {
    try {
      const parts = credentialJwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const user: UserProfile = {
        id: payload['sub'] ?? '',
        name: payload['name'] ?? '',
        email: payload['email'] ?? '',
        picture: payload['picture'],
        provider: 'google',
      };
      this.setUser(user);
    } catch {
      this.setLoading(false);
    }
  }
}
