import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  CREDIT = 'CREDIT', // Money coming in (rewards, deposits)
  DEBIT = 'DEBIT',   // Money going out (purchases, entries)
}

@Entity('wallet_ledgers')
export class WalletLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  purpose: string; // e.g., 'MATCH_REWARD', 'ITEM_PURCHASE', 'SIGNUP_BONUS'

  @Column({ unique: true, nullable: true })
  referenceId: string; // To prevent processing the same transaction id twice (Idempotency)

  @CreateDateColumn()
  createdAt: Date;
}
