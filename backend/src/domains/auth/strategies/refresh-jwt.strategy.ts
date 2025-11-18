// src/auth/strategies/refresh-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { FastifyRequest } from 'fastify';

function cookieExtractor(req: FastifyRequest): string | null {
  const anyReq: any = req;
  return anyReq.cookies?.['refresh_token'] ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
