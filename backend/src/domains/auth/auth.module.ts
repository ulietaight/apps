import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { JwtAccessStrategy } from './strategies/access-jwt.strategy';
import { JwtRefreshStrategy } from './strategies/refresh-jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, RolesGuard],
})
export class AuthModule {}
