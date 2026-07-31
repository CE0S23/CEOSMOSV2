export type AuthProvider = 'google' | 'passkey';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  picture?: string;
  provider: AuthProvider;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  createdAt?: string;
  hasPasskey?: boolean;
}

export interface Session {
  id: string;
  createdAt: string;
  ipAddress: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  role: 'USER' | 'ADMIN';
  active?: boolean;
  createdAt: string;
  mediaItemsCount: number;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface PasskeyCredential {
  id: string;
  rawId: ArrayBuffer;
  response: AuthenticatorAssertionResponse;
  type: 'public-key';
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
