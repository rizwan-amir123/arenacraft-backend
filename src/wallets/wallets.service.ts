import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletLedger, TransactionType } from './entities/wallet-ledger.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WalletsService {
  constructor(
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  async debitWallet(userId: string, amount: number, purpose: string, referenceId: string) {
    // 1. Acquire Redis Lock based on User ID to prevent rapid duplicate clicks
    const lockKey = `wallet:debit:${userId}`;
    const isLockAcquired = await this.redisService.acquireLock(lockKey, 3000); // 3 second lock

    if (!isLockAcquired) {
      throw new ConflictException('Transaction is already in progress. Please wait.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Fetch the wallet inside the SQL transaction
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' }, // Prevents other DB queries from modifying this row simultaneously
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found.');
      }

      // Convert balances safely to float numbers
      const currentBalance = Number(wallet.balance);
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient balance for this purchase.');
      }

      // 3. Deduct funds and save
      wallet.balance = currentBalance - amount;
      await queryRunner.manager.save(Wallet, wallet);

      // 4. Create Audit Ledger
      const ledgerEntry = queryRunner.manager.create(WalletLedger, {
        wallet,
        amount,
        type: TransactionType.DEBIT,
        purpose,
        referenceId,
      });
      await queryRunner.manager.save(WalletLedger, ledgerEntry);

      await queryRunner.commitTransaction();
      return { message: 'Purchase processed successfully.', newBalance: wallet.balance };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      // 5. Always release the Redis lock when done
      await this.redisService.releaseLock(lockKey);
    }
  }
}
