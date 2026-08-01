import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUsers(): Promise<AdminUser[]> {
    return firstValueFrom(this.http.get<AdminUser[]>(`${this.apiUrl}/admin/users`));
  }

  createUser(data: { email: string; username: string; password: string; role?: 'USER' | 'ADMIN' }): Promise<AdminUser> {
    return firstValueFrom(this.http.post<AdminUser>(`${this.apiUrl}/admin/users`, data));
  }

  setUserStatus(id: string, active: boolean): Promise<{ id: string; email: string; active: boolean }> {
    return firstValueFrom(
      this.http.patch<{ id: string; email: string; active: boolean }>(`${this.apiUrl}/admin/users/${id}/status`, { active }),
    );
  }

  changeUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.patch<{ message: string }>(`${this.apiUrl}/admin/users/${id}/password`, { newPassword }),
    );
  }

  deleteUser(id: string): Promise<{ message: string }> {
    return firstValueFrom(this.http.delete<{ message: string }>(`${this.apiUrl}/admin/users/${id}`));
  }

  changeRole(id: string, role: 'USER' | 'ADMIN'): Promise<{ id: string; email: string; role: string }> {
    return firstValueFrom(
      this.http.patch<{ id: string; email: string; role: string }>(`${this.apiUrl}/admin/users/${id}/role`, { role }),
    );
  }

  getRolesPermissions(): Promise<{ roles: Record<string, { label: string; permissions: string[] }> }> {
    return firstValueFrom(
      this.http.get<{ roles: Record<string, { label: string; permissions: string[] }> }>(`${this.apiUrl}/admin/roles`),
    );
  }

  updateUser(id: string, data: { email?: string; username?: string }): Promise<{ id: string; email: string; username: string; role: string }> {
    return firstValueFrom(
      this.http.patch<{ id: string; email: string; username: string; role: string }>(`${this.apiUrl}/admin/users/${id}`, data),
    );
  }

  getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  } = {}): Promise<AuditLogPage> {
    const query: Record<string, string> = {};
    if (params.page) query['page'] = String(params.page);
    if (params.pageSize) query['pageSize'] = String(params.pageSize);
    if (params.userId) query['userId'] = params.userId;
    if (params.action) query['action'] = params.action;
    if (params.from) query['from'] = params.from;
    if (params.to) query['to'] = params.to;
    return firstValueFrom(
      this.http.get<AuditLogPage>(`${this.apiUrl}/admin/audit-log`, { params: query }),
    );
  }
}

export interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  metadata: Record<string, any> | null;
  userId: string | null;
  user: { id: string; email: string; username: string } | null;
}

export interface AuditLogPage {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: AuditLogEntry[];
}
