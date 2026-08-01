import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AuditLogPage } from '../../../core/services/admin.service';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  PASSWORD_CHANGE: 'Cambio de contraseña',
  USER_CREATE: 'Crear usuario',
  USER_UPDATE: 'Editar usuario',
  USER_DELETE: 'Baja lógica',
  USER_STATUS: 'Activar / desactivar',
  ROLE_CHANGE: 'Cambio de rol',
  AUDIT_VIEW: 'Consulta de bitácora',
};

@Component({
  selector: 'app-admin-bitacora',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './admin-bitacora.component.html',
  styleUrl: './admin-bitacora.component.scss',
})
export class AdminBitacoraComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  logs = signal<AuditLogPage | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  filterAction = signal('');
  filterUserId = signal('');
  filterFrom = signal('');
  filterTo = signal('');

  actionOptions = Object.keys(ACTION_LABELS);

  async ngOnInit() {
    await this.load();
  }

  private buildParams() {
    const params: { page: number; pageSize: number; action?: string; userId?: string; from?: string; to?: string } = {
      page: 1,
      pageSize: 20,
    };
    if (this.filterAction()) params.action = this.filterAction();
    if (this.filterUserId()) params.userId = this.filterUserId();
    if (this.filterFrom()) params.from = `${this.filterFrom()}T00:00:00.000Z`;
    if (this.filterTo()) params.to = `${this.filterTo()}T23:59:59.999Z`;
    return params;
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.logs.set(await this.adminService.getAuditLogs(this.buildParams()));
    } catch {
      this.error.set('Error al cargar la bitácora de auditoría');
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number) {
    if (page < 1 || (this.logs() && page > this.logs()!.totalPages)) return;
    const current = this.buildParams();
    current.page = page;
    this.loading.set(true);
    void this.adminService.getAuditLogs(current)
      .then(result => {
        this.logs.set(result);
        this.error.set(null);
      })
      .catch(() => {
        this.error.set('Error al cargar la bitácora de auditoría');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  applyFilters() {
    void this.load();
  }

  clearFilters() {
    this.filterAction.set('');
    this.filterUserId.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    void this.load();
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }
}
