import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtomicTransferStrategy } from './strategies/atomic.strategy';
import { TransferStrategy } from './strategies/transfer.strategy';
import { PessimisticTransferStrategy } from './strategies/pessimistic.strategy';
import { OptimisticTransferStrategy } from './strategies/optimistic.strategy';
import { IsolationTransferStrategy } from './strategies/isolation.strategy';
import { NoTxTransferStrategy } from './strategies/no-transaction.strategy';
import { TransactionStrategy } from './transaction-strategy.enum';
import { TransactionController } from './transaction.controller';

const strategyProvider: Provider = {
  provide: 'TransferStrategy',
  useFactory: (
    config: ConfigService,
    atomic: AtomicTransferStrategy,
    pess: PessimisticTransferStrategy,
    opt: OptimisticTransferStrategy,
    iso: IsolationTransferStrategy,
    noTx: NoTxTransferStrategy,
  ): TransferStrategy => {
    const selected = (config.get<string>('TRANSACTION_STRATEGY') || TransactionStrategy.ATOMIC) as TransactionStrategy;
    switch (selected) {
      case TransactionStrategy.PESSIMISTIC:
        return pess;
      case TransactionStrategy.OPTIMISTIC:
        return opt;
      case TransactionStrategy.ISOLATION:
        return iso;
      case TransactionStrategy.NO_TRANSACTION:
        return noTx;
      case TransactionStrategy.ATOMIC:
      default:
        return atomic;
    }
  },
  inject: [ConfigService, AtomicTransferStrategy, PessimisticTransferStrategy, OptimisticTransferStrategy, IsolationTransferStrategy, NoTxTransferStrategy],
};

@Module({
  providers: [
    PrismaService,
    TransactionService,
    AtomicTransferStrategy,
    PessimisticTransferStrategy,
    OptimisticTransferStrategy,
    IsolationTransferStrategy,
    NoTxTransferStrategy,
    strategyProvider,
  ],
  controllers: [TransactionController],
})
export class TransactionModule {}
