import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private authService: AuthService) {
    const options: StrategyOptionsWithRequest = { 
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET as string,
      passReqToCallback: true,
      ignoreExpiration: false,
    };
    super(options);
  }

  async validate(req: Request, payload: { sub: number }) {
    const refreshToken = req.headers.authorization?.split(' ')[1];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const user = await this.authService.validateRefreshToken(payload.sub, refreshToken);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }
}