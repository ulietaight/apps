import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body('name') name: string) {
    const user = await this.userService.createUser(name);
    return {
      id: user.id,
      name: user.name,
      balance: user.balance,
    };
  }

  @Get(':id/balance')
  async getBalance(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getBalance(id);
  }
}