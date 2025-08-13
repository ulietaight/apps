import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  senderId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  receiverId: number;

  @ApiProperty({ example: 100.5 })
  @IsPositive()
  amount: number;
}