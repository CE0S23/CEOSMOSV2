import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTasks(filters?: { status?: TaskStatus; priority?: TaskPriority }): Promise<Task[]> {
    return firstValueFrom(
      this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params: { ...filters } }),
    );
  }

  createTask(data: CreateTaskInput): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(`${this.apiUrl}/tasks`, data));
  }

  updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    return firstValueFrom(this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, data));
  }

  deleteTask(id: string): Promise<{ message: string }> {
    return firstValueFrom(this.http.delete<{ message: string }>(`${this.apiUrl}/tasks/${id}`));
  }
}
