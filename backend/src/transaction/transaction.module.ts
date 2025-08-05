import { Module, Provider } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtomicTransferStrategy } from './strategies/atomic.strategy';
import { TransferStrategy } from './strategies/transfer.strategy';

const strategyProvider: Provider = {
  provide: 'TransferStrategy',
  useClass: AtomicTransferStrategy,
};

@Module({
  providers: [
    PrismaService,
    TransactionService,
    AtomicTransferStrategy,
    strategyProvider,
  ],
  controllers: [],
})
export class TransactionModule {}
