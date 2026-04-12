import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersService } from '../users/users.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepo: Repository<SystemSettings>,

    @InjectRepository(ActivityLog)
    private activityRepo: Repository<ActivityLog>,

    private usersService: UsersService,
  ) {}

  // Seed a single settings row on startup if none exists
  async onModuleInit(): Promise<void> {
    const count = await this.settingsRepo.count();
    if (count === 0) {
      await this.settingsRepo.save(this.settingsRepo.create({}));
    }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<SystemSettings> {
    const settings = await this.settingsRepo.findOne({ where: {} });
    return settings!;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<SystemSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats() {
    const [totalUsers, bannedUsers, thisMonth, lastMonth] = await Promise.all([
      this.usersService.countAll(),
      this.usersService.countBanned(),
      this.usersService.countRegisteredThisMonth(),
      this.usersService.countRegisteredLastMonth(),
    ]);

    // Growth % vs last month (avoid div/0)
    const userGrowth =
      lastMonth === 0
        ? thisMonth > 0 ? 100 : 0
        : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    // Placeholders — wire these up once Project/Task entities exist
    const activeProjects = 0;
    const openTasks      = 0;
    const projectGrowth  = 0;
    const taskGrowth     = 0;

    const activity = await this.getRecentActivity(10);

    return {
      stats: {
        totalUsers,
        bannedUsers,
        activeProjects,
        openTasks,
        userGrowth,
        projectGrowth,
        taskGrowth,
      },
      activity,
    };
  }

  // ─── Activity log ─────────────────────────────────────────────────────────

  async logActivity(data: {
    type: ActivityLog['type'];
    message: string;
    actor: string;
  }): Promise<void> {
    await this.activityRepo.save(this.activityRepo.create(data));
  }

  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    return this.activityRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}