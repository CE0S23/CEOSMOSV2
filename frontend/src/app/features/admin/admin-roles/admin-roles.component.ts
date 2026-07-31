import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser } from '../../../core/models/user.model';

interface RoleInfo {
  label: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.scss',
})
export class AdminRolesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly auth = inject(AuthService);

  users = signal<AdminUser[]>([]);
  roles = signal<Record<string, RoleInfo>>({});
  loading = signal(true);
  savingRole = signal<string | null>(null);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [all, rolesResp] = await Promise.all([
        this.adminService.getUsers(),
        this.adminService.getRolesPermissions(),
      ]);
      const myId = this.auth.user()?.id;
      this.users.set(all.filter(u => u.id !== myId));
      this.roles.set(rolesResp.roles);
    } catch {
      this.error.set('Error al cargar roles o usuarios');
    } finally {
      this.loading.set(false);
    }
  }

  permissionLabel(permission: string): string {
    const map: Record<string, string> = {
      'admin.users.view': 'Ver usuarios',
      'admin.users.create': 'Crear usuarios',
      'admin.users.edit': 'Editar usuarios',
      'admin.users.deactivate': 'Desactivar usuarios',
      'admin.users.password': 'Cambiar contraseñas',
      'admin.roles.assign': 'Asignar roles',
      'admin.roles.view': 'Ver roles y permisos',
      'admin.audit.view': 'Ver bitácora de auditoría',
      'auth.login': 'Iniciar sesión',
      'profile.edit': 'Editar perfil propio',
      'profile.password': 'Cambiar contraseña propia',
    };
    return map[permission] ?? permission;
  }

  changeRole(user: AdminUser, event: Event) {
    const role = (event.target as HTMLSelectElement).value as 'USER' | 'ADMIN';
    if (user.role === role) return;
    this.savingRole.set(user.id);
    this.error.set(null);
    try {
      void this.adminService.changeRole(user.id, role).then(() => {
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, role } : u),
        );
      }).catch((err: any) => {
        this.error.set(err?.error?.message ?? 'Error al asignar rol');
      }).finally(() => {
        this.savingRole.set(null);
      });
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al asignar rol');
      this.savingRole.set(null);
    }
  }
}
