import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity, UserRole } from '../../common/db/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  // --- FIND BY EMAIL ---
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  // --- FIND BY ID ---
  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  // --- CREATE USER ---
  async createUser(args: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(args.password, 10);

    const user = this.repo.create({
      email: args.email,
      passwordHash,
      role: args.role ?? UserRole.USER,
    });

    return this.repo.save(user);
  }

  // --- INCREMENT TOKEN VERSION ---
  async incrementTokenVersion(id: string): Promise<void> {
    await this.repo.increment({ id }, 'tokenVersion', 1);
  }
}
