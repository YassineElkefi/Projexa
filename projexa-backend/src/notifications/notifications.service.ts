import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { AppGateway } from '../gateway/app.gateway';

export interface CreateNotificationOpts {
  userId: number;
  message: string;
  type: string;
  payload?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly gateway: AppGateway,
  ) {}

  /** Persist + push via WebSocket in one call */
  async notify(opts: CreateNotificationOpts): Promise<void> {
    const notif = await this.notifRepo.save(
      this.notifRepo.create({
        userId: opts.userId,
        message: opts.message,
        type: opts.type,
        payload: opts.payload ?? null,
      }),
    );

    this.gateway.sendToUser(opts.userId, 'notification', {
      id: notif.id,
      message: notif.message,
      type: notif.type,
      payload: notif.payload,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
    });
  }

  async listForUser(userId: number): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(userId: number, notifId: number): Promise<void> {
    await this.notifRepo.update({ id: notifId, userId }, { isRead: true });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId: number): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }
}
