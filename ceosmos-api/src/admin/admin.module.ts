import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminUsersController,
  AdminRolesController,
  AdminAuditLogController,
} from './admin.controller';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  controllers: [AdminUsersController, AdminRolesController, AdminAuditLogController],
  providers: [AdminService],
})
export class AdminModule {}
