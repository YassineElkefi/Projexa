import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: Request) {
    const user = req.user as any;
    return this.notificationsService.listForUser(user.id);
  }

  @Patch(':id/read')
  markRead(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as any;
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: Request) {
    const user = req.user as any;
    return this.notificationsService.markAllRead(user.id);
  }
}
