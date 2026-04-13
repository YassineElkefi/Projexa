import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';
import { UserStatus } from './enums/user-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  // ─── Existing methods (keep as-is) ───────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.usersRepo.find({
      where: { id: In(ids) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        status: true,
      },
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { emailVerificationToken: token } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    if (!token) return null;
    return this.usersRepo.findOne({ where: { passwordResetToken: token } });
  }

  async setPasswordReset(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.usersRepo.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async completePasswordReset(userId: number, passwordHash: string): Promise<void> {
    await this.usersRepo.update(userId, {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async createByAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }): Promise<User> {
    const email = data.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    await this.create({
      email,
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerificationToken: null as unknown as string,
    });
    const created = await this.findByEmail(email);
    if (!created) throw new BadRequestException('Could not create user');
    return this.findByIdOrThrow(created.id);
  }

  async saveRefreshToken(userId: number, token: string | null): Promise<void> {
    const hashed = token ? await bcrypt.hash(token, 10) : null;
    await this.usersRepo.update(userId, { refreshToken: hashed as string });
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.usersRepo.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null as unknown as string,
      status: UserStatus.ACTIVE, 
    });
  }

  async updateLastActive(userId: number): Promise<void> {
    await this.usersRepo.update(userId, { lastActiveAt: new Date() });
  }

  /**
   * Sets lastActiveAt to now only if it is null or older than staleMs.
   * Used on authenticated requests so the admin UI reflects recent activity without writing every call.
   */
  async touchLastActiveIfStale(userId: number, staleMs = 3 * 60 * 1000): Promise<void> {
    const threshold = new Date(Date.now() - staleMs);
    await this.usersRepo
      .createQueryBuilder()
      .update(User)
      .set({ lastActiveAt: new Date() })
      .where('id = :id', { id: userId })
      .andWhere('(lastActiveAt IS NULL OR lastActiveAt < :threshold)', { threshold })
      .execute();
  }

  // ─── Admin methods ────────────────────────────────────────────────────────

  async findAllPaginated(filters: {
    search?: string;
    role?: Role;
    status?: UserStatus;
    page: number;
    pageSize: number;
  }): Promise<{ data: User[]; total: number }> {
    const { search, role, status, page, pageSize } = filters;

    const where: FindOptionsWhere<User>[] = [];

    const baseCondition: FindOptionsWhere<User> = {};
    if (role)   baseCondition.role   = role;
    if (status) baseCondition.status = status;

    if (search) {
      // Search across firstName, lastName, email
      where.push(
        { ...baseCondition, firstName: Like(`%${search}%`) },
        { ...baseCondition, lastName:  Like(`%${search}%`) },
        { ...baseCondition, email:     Like(`%${search}%`) },
      );
    } else {
      where.push(baseCondition);
    }

    const [data, total] = await this.usersRepo.findAndCount({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        lastActiveAt: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateRole(id: number, role: Role): Promise<User> {
    const user = await this.findByIdOrThrow(id);
    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      // Optional: count remaining admins to prevent locking yourself out
    }
    await this.usersRepo.update(id, { role });
    return this.findByIdOrThrow(id);
  }

  async banUser(id: number): Promise<User> {
    const user = await this.findByIdOrThrow(id);
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot ban an admin user');
    }
    await this.usersRepo.update(id, { status: UserStatus.BANNED });
    return this.findByIdOrThrow(id);
  }

  async unbanUser(id: number): Promise<User> {
    await this.findByIdOrThrow(id);
    await this.usersRepo.update(id, { status: UserStatus.ACTIVE });
    return this.findByIdOrThrow(id);
  }

  /**
   * Approve a pending account (PENDING → ACTIVE).
   * Idempotent: already-active users return `{ changed: false }`.
   */
  async activateUser(id: number): Promise<{ user: User; changed: boolean }> {
    const user = await this.findByIdOrThrow(id);
    if (user.status === UserStatus.ACTIVE) {
      return { user, changed: false };
    }
    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException(
        'Cannot approve a banned account. Unban the user first.',
      );
    }
    await this.usersRepo.update(id, { status: UserStatus.ACTIVE });
    const updated = await this.findByIdOrThrow(id);
    return { user: updated, changed: true };
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findByIdOrThrow(id);
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot delete an admin user');
    }
    await this.usersRepo.delete(id);
  }

  // ─── Stats helpers ────────────────────────────────────────────────────────

  async countAll(): Promise<number> {
    return this.usersRepo.count();
  }

  async countBanned(): Promise<number> {
    return this.usersRepo.count({ where: { status: UserStatus.BANNED } });
  }

  async countRegisteredThisMonth(): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start', { start })
      .getCount();
  }

  async countRegisteredLastMonth(): Promise<number> {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start AND u.createdAt < :end', { start, end })
      .getCount();
  }

  async getRecentUsers(limit = 5): Promise<User[]> {
    return this.usersRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }
  async update(id: number, data: Partial<User>): Promise<User> {
  await this.findByIdOrThrow(id);
  await this.usersRepo.update(id, data);
  return this.findByIdOrThrow(id);
}

async updateAvatar(id: number, avatarUrl: string): Promise<void> {
  await this.usersRepo.update(id, { avatarUrl });
}

async remove(id: number): Promise<void> {
  await this.findByIdOrThrow(id);
  await this.usersRepo.delete(id);
}

async findAll(): Promise<User[]> {
  return this.usersRepo.find({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      lastActiveAt: true,
    },
    order: { createdAt: 'DESC' },
  });
}
}