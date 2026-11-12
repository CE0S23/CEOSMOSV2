import {
  Controller,
  Get,
  Post,
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
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMediaDto, GetMediaQueryDto } from './dto/media.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getMedia(
    @Req() req: RequestWithUser,
    @Query() query: GetMediaQueryDto,
  ) {
    return this.mediaService.getUserMedia(req.user.id, query);
  }

  @Post()
  async addMedia(@Req() req: RequestWithUser, @Body() data: CreateMediaDto) {
    return this.mediaService.addMedia(req.user.id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // igual que /devices (P11-D05)
  async deleteMedia(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.mediaService.deleteMedia(req.user.id, id);
  }
}
