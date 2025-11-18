import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from '../../common/db/entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async create(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role?: UserRole,
  ) {
    const user = await this.userService.createUser({
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
