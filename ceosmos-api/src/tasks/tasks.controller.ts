import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto, GetTasksQueryDto } from './dto/tasks.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(
    @Req() req: RequestWithUser,
    @Query() query: GetTasksQueryDto,
  ) {
    return this.tasksService.getTasks(req.user.id, query);
  }

  @Post()
  async createTask(
    @Req() req: RequestWithUser,
    @Body() data: CreateTaskDto,
  ) {
    return this.tasksService.createTask(req.user.id, data);
  }

  @Patch(':id')
  async updateTask(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(req.user.id, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTask(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.tasksService.deleteTask(req.user.id, id);
  }
}
