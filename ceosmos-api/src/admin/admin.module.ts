import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminUsersController,
  AdminRolesController,
} from './admin.controller';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  controllers: [AdminUsersController, AdminRolesController],
  providers: [AdminService],
})
export class AdminModule {}
