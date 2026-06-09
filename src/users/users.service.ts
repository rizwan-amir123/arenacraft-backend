import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletLedger, TransactionType } from '../wallets/entities/wallet-ledger.entity';

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  async registerPlayer(username: string, email: string) {
    // Create a transaction query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the Player
      const user = queryRunner.manager.create(User, { username, email });
      const savedUser = await queryRunner.manager.save(User, user);

      // 2. Create the Player's Wallet with an initial balance of 500.00
      const welcomeBonus = 500.00;
      const wallet = queryRunner.manager.create(Wallet, {
        user: savedUser,
        balance: welcomeBonus,
        currency: 'PKR',
      });
      const savedWallet = await queryRunner.manager.save(Wallet, wallet);

      // 3. Document the initial deposit into the Ledger for accounting/audit
      const ledgerEntry = queryRunner.manager.create(WalletLedger, {
        wallet: savedWallet,
        amount: welcomeBonus,
        type: TransactionType.CREDIT,
        purpose: 'SIGNUP_BONUS',
        referenceId: `SIGNUP-${savedUser.id}`, // Idempotency key protection
      });
      await queryRunner.manager.save(WalletLedger, ledgerEntry);

      // If everything succeeds, commit the changes permanently to Postgres
      await queryRunner.commitTransaction();

      return {
        message: 'Player registered successfully with active ledger wallet.',
        playerId: savedUser.id,
        username: savedUser.username,
        startingBalance: savedWallet.balance,
      };

    } catch (error) {
      // If anything fails, undo all changes made during this block
      await queryRunner.rollbackTransaction();
      
      if (error.code === '23505') { // Postgres code for unique constraint violation
        throw new ConflictException('Username or Email already exists.');
      }
      throw new InternalServerErrorException('Registration failed. Transaction rolled back safely.');
    } finally {
      // Release the query runner connection back to the pool
      await queryRunner.release();
    }
  }
}
