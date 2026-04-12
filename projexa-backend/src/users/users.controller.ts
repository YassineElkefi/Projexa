import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /users/me ───────────────────────────────────────────────────────────
  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as any;
    const { password, refreshToken, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }

  // ─── PATCH /users/me ─────────────────────────────────────────────────────────
  @Patch('me')
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const user = req.user as any;
    const updated = await this.usersService.update(user.id, dto);
    const { password, refreshToken, emailVerificationToken, ...safeUser } = updated;
    return safeUser;
  }

  // ─── POST /users/me/avatar ───────────────────────────────────────────────────
  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) =>
          cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateAvatar(user.id, avatarUrl);
    return { avatarUrl };
  }

  // ─── DELETE /users/me ────────────────────────────────────────────────────────
  @Delete('me')
  async deleteMe(@Req() req: Request) {
    const user = req.user as any;
    await this.usersService.remove(user.id);
    return { message: 'Account deleted successfully' };
  }

  // ─── ADMIN: GET /users ───────────────────────────────────────────────────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(({ password, refreshToken, emailVerificationToken, ...u }) => u);
  }

  // ─── ADMIN: GET /users/:id ───────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) throw new BadRequestException('User not found');
    const { password, refreshToken, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }

  // ─── ADMIN: PATCH /users/:id ─────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const requestingUser = req.user as any;
    // Prevent admins from downgrading themselves accidentally
    if (requestingUser.id === id && dto.role && dto.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const updated = await this.usersService.update(id, dto);
    const { password, refreshToken, emailVerificationToken, ...safeUser } = updated;
    return safeUser;
  }

  // ─── ADMIN: DELETE /users/:id ────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const requestingUser = req.user as any;
    if (requestingUser.id === id) {
      throw new ForbiddenException('Use DELETE /users/me to delete your own account');
    }
    await this.usersService.remove(id);
    return { message: `User ${id} deleted successfully` };
  }
}