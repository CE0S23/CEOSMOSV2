export type TaskStatus = 'PENDIENTE' | 'COMPLETADA';
export type TaskPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
