import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../core/services/tasks.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';

interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

type FilterStatus = TaskStatus | 'TODAS';

const EMPTY_FORM: TaskForm = {
  title: '',
  description: '',
  status: 'PENDIENTE',
  priority: 'MEDIA',
  dueDate: '',
};

@Component({
  selector: 'app-task-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-manager.component.html',
  styleUrl: './task-manager.component.scss',
})
export class TaskManagerComponent implements OnInit {
  private readonly tasksService = inject(TasksService);

  readonly tasks = signal<Task[]>([]);
  readonly filter = signal<FilterStatus>('TODAS');
  readonly filters: FilterStatus[] = ['TODAS', 'PENDIENTE', 'COMPLETADA'];
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  readonly form = signal<TaskForm>({ ...EMPTY_FORM });

  readonly filteredTasks = computed(() => {
    const f = this.filter();
    return this.tasks().filter(t => f === 'TODAS' || t.status === f);
  });

  readonly pendingCount = computed(() => this.tasks().filter(t => t.status === 'PENDIENTE').length);

  ngOnInit(): void {
    void this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.tasks.set(await this.tasksService.getTasks());
    } catch {
      this.error.set('No se pudieron cargar las tareas. Verifica la conexión con la API.');
    } finally {
      this.loading.set(false);
    }
  }

  async createTask(): Promise<void> {
    const f = this.form();
    if (!f.title.trim()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const created = await this.tasksService.createTask({
        title: f.title.trim(),
        description: f.description.trim() || undefined,
        status: f.status,
        priority: f.priority,
        dueDate: f.dueDate || undefined,
      });
      this.tasks.update(list => [created, ...list]);
      this.form.set({ ...EMPTY_FORM });
    } catch {
      this.error.set('No se pudo crear la tarea.');
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.form.set({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
  }

  async saveEdit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const f = this.form();
    if (!f.title.trim()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await this.tasksService.updateTask(id, {
        title: f.title.trim(),
        description: f.description.trim() || null,
        status: f.status,
        priority: f.priority,
        dueDate: f.dueDate || null,
      });
      this.tasks.update(list => list.map(t => (t.id === id ? updated : t)));
      this.cancelEdit();
    } catch {
      this.error.set('No se pudo actualizar la tarea.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleStatus(task: Task): Promise<void> {
    const next: TaskStatus = task.status === 'PENDIENTE' ? 'COMPLETADA' : 'PENDIENTE';
    try {
      const updated = await this.tasksService.updateTask(task.id, { status: next });
      this.tasks.update(list => list.map(t => (t.id === task.id ? updated : t)));
    } catch {
      this.error.set('No se pudo cambiar el estado de la tarea.');
    }
  }

  async deleteTask(task: Task): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.tasksService.deleteTask(task.id);
      this.tasks.update(list => list.filter(t => t.id !== task.id));
    } catch {
      this.error.set('No se pudo eliminar la tarea.');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(filter: FilterStatus): void {
    this.filter.set(filter);
  }

  isEditing(task: Task): boolean {
    return this.editingId() === task.id;
  }

  priorityLabel(priority: TaskPriority): string {
    const map: Record<TaskPriority, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
    return map[priority];
  }
}
