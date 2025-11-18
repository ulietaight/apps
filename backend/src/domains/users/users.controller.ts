import { Controller, Get, UseGuards, Req, Post, Body  } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from '../../common/db/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    const { id, email, role } = req.user;
    return { id, email, role };
  }

  @Post('create')
  async create(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role?: UserRole,
  ) {
    const user = await this.usersService.createUser({
      email,
      password,
      role,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
