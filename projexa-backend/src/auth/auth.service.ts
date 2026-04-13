import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationToken = uuidv4();

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
    });

    await this.mailService.sendVerificationEmail(user.email, verificationToken);
    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.updateLastActive(user.id);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.usersService.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.usersService.saveRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.validateRefreshToken(userId, refreshToken);
    await this.usersService.touchLastActiveIfStale(user.id);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.usersService.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid verification token');
    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const generic = {
      message:
        'If an account exists for that email, you will receive password reset instructions shortly.',
    };
    const user = await this.usersService.findByEmail(email.trim());
    if (!user) return generic;

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.setPasswordReset(user.id, token, expiresAt);
    await this.mailService.sendPasswordResetEmail(user.email, token);
    return generic;
  }

  async resetPassword(dto: { token: string; password: string }) {
    const token = dto.token.trim();
    const user = await this.usersService.findByPasswordResetToken(token);
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.usersService.completePasswordReset(user.id, hashedPassword);
    await this.usersService.saveRefreshToken(user.id, null);
    return { message: 'Your password was updated. You can sign in with your new password.' };
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }
}