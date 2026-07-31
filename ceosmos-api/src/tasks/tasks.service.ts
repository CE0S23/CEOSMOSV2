import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, GetTasksQueryDto } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(userId: string, query: GetTasksQueryDto) {
    return this.prisma.task.findMany({
      where: {
        userId,
        ...(query.status && { status: query.status }),
        ...(query.priority && { priority: query.priority }),
      },
      orderBy: [{ completedAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createTask(userId: string, data: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        status: data.status ?? 'PENDIENTE',
        priority: data.priority ?? 'MEDIA',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completedAt: data.status === 'COMPLETADA' ? new Date() : null,
      },
    });
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('Cannot modify a task that does not belong to you');
    }

    const status = data.status ?? task.status;
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        completedAt: status === 'COMPLETADA' ? task.completedAt ?? new Date() : null,
      },
    });
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('Cannot delete a task that does not belong to you');
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully' };
  }
}
