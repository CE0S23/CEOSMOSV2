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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/audit/audit.decorator';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateUserStatusDto,
  UpdateUserPasswordDto,
  ChangeUserRoleDto,
  AuditLogQueryDto,
} from './dto/admin-users.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Post()
  @Audit('USER_CREATE')
  async createUser(
    @Body() dto: CreateAdminUserDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.createUser(dto, req.user.id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') targetId: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(targetId, dto);
  }

  @Patch(':id/role')
  @Audit('ROLE_CHANGE')
  async changeRole(
    @Param('id') targetId: string,
    @Body() dto: ChangeUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.changeUserRole(targetId, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Audit('USER_DELETE')
  async deleteUser(
    @Param('id') targetId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.softDeleteUser(targetId, req.user.id);
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') targetId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.setUserStatus(targetId, dto);
  }

  @Patch(':id/password')
  @Audit('PASSWORD_CHANGE')
  async changePassword(
    @Param('id') targetId: string,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.adminService.changeUserPassword(targetId, dto);
  }
}

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminRolesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getRolesPermissions() {
    return this.adminService.getRolesPermissions();
  }
}

@Controller('admin/audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAuditLogController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query as any);
  }
}
