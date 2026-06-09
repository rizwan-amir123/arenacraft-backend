import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0.00 })
  balance: number;

  @Column({ default: 'PKR' }) // Local currency placeholder or in-game gold tokens
  currency: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @UpdateDateColumn()
  updatedAt: Date;
}
