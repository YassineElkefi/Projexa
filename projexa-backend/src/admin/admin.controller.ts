import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  // ─── Stats ────────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Post('users')
  async createUser(@Body() dto: CreateAdminUserDto, @Req() req: Request) {
    const actor = req.user as any;
    const user  = await this.usersService.createByAdmin({
      email:     dto.email,
      password:  dto.password,
      firstName: dto.firstName,
      lastName:  dto.lastName,
      role:      dto.role ?? Role.MEMBER,
    });
    await this.adminService.logActivity({
      type:    'user_registered',
      message: `${user.firstName} ${user.lastName} was added to the platform`,
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
    return user;
  }

  @Get('users')
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAllPaginated({
      search:   query.search,
      role:     query.role,
      status:   query.status,
      page:     query.page     ?? 1,
      pageSize: query.pageSize ?? 10,
    });
  }

  @Get('users/:id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findByIdOrThrow(id);
  }

  @Patch('users/:id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    const actor = req.user as any;
    const user  = await this.usersService.updateRole(id, dto.role);
    await this.adminService.logActivity({
      type:    'role_changed',
      message: `${user.firstName} ${user.lastName}'s role changed to ${dto.role}`,
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
    return user;
  }

  @Patch('users/:id/ban')
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const actor = req.user as any;
    const user  = await this.usersService.banUser(id);
    await this.adminService.logActivity({
      type:    'user_banned',
      message: `${user.firstName} ${user.lastName} was banned`,
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
    return user;
  }

  @Patch('users/:id/unban')
  async unbanUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const actor = req.user as any;
    const user  = await this.usersService.unbanUser(id);
    await this.adminService.logActivity({
      type:    'user_unbanned',  // maps to 'user_banned' icon on frontend, adjust if needed
      message: `${user.firstName} ${user.lastName} was unbanned`,
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
    return user;
  }

  @Patch('users/:id/activate')
  async activateUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const actor   = req.user as any;
    const { user, changed } = await this.usersService.activateUser(id);
    if (changed) {
      await this.adminService.logActivity({
        type:    'user_activated',
        message: `${user.firstName} ${user.lastName}'s account was approved`,
        actor:   `${actor.firstName} ${actor.lastName}`,
      });
    }
    return user;
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const actor = req.user as any;
    const user  = await this.usersService.findByIdOrThrow(id);
    await this.usersService.deleteUser(id);
    await this.adminService.logActivity({
      type:    'user_banned',
      message: `${user.firstName} ${user.lastName}'s account was deleted`,
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @Req() req: Request,
  ) {
    const actor    = req.user as any;
    const settings = await this.adminService.updateSettings(dto);
    await this.adminService.logActivity({
      type:    'settings_changed',
      message: 'System settings were updated',
      actor:   `${actor.firstName} ${actor.lastName}`,
    });
    return settings;
  }
}