import { Component, inject, signal, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser } from '../../../core/models/user.model';

interface ModalState {
  type: 'create' | 'edit' | 'password';
  userId?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);

  modal = signal<ModalState | null>(null);

  createForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
    role: ['USER', [Validators.required]],
  });

  editForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
  });

  async ngOnInit() {
    await this.loadUsers();
  }

  private async loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const all = await this.adminService.getUsers();
      const myId = this.auth.user()?.id;
      this.users.set(all.filter(u => u.id !== myId));
    } catch {
      this.error.set('Error al cargar usuarios');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.createForm.reset({ role: 'USER' });
    this.modal.set({ type: 'create' });
  }

  openEdit(user: AdminUser) {
    this.editForm.setValue({ email: user.email, username: user.username });
    this.modal.set({ type: 'edit', userId: user.id });
  }

  openPassword(user: AdminUser) {
    this.passwordForm.reset();
    this.modal.set({ type: 'password', userId: user.id });
  }

  closeModal() {
    this.modal.set(null);
  }

  async submitCreate() {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const created = await this.adminService.createUser(this.createForm.value);
      this.users.update(list => [created, ...list]);
      this.closeModal();
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al crear usuario');
    } finally {
      this.saving.set(false);
    }
  }

  async submitEdit() {
    if (this.editForm.invalid || !this.modal()?.userId) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const userId = this.modal()!.userId!;
      const updated = await this.adminService.updateUser(userId, this.editForm.value);
      this.users.update(list =>
        list.map(u => u.id === userId ? { ...u, email: updated.email, username: updated.username } : u),
      );
      this.closeModal();
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al guardar cambios');
    } finally {
      this.saving.set(false);
    }
  }

  async submitPassword() {
    if (this.passwordForm.invalid || !this.modal()?.userId) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.adminService.changeUserPassword(this.modal()!.userId!, this.passwordForm.value.newPassword);
      this.closeModal();
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cambiar contraseña');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStatus(user: AdminUser) {
    const next = !user.active;
    try {
      await this.adminService.setUserStatus(user.id, next);
      this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, active: next } : u),
      );
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cambiar estado');
    }
  }

  async deleteUser(user: AdminUser) {
    if (!confirm(`¿Eliminar usuario ${user.username}? Esta acción es lógica y desactiva su cuenta.`)) return;
    try {
      await this.adminService.deleteUser(user.id);
      this.users.update(list => list.filter(u => u.id !== user.id));
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al eliminar usuario');
    }
  }
}
