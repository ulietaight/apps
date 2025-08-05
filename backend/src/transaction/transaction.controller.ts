import { Body, Controller, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async transfer(@Body() dto: CreateTransactionDto) {
    const { senderId, receiverId, amount } = dto;
    return this.transactionService.transfer(senderId, receiverId, amount);
  }
}