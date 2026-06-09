import { IsUUID, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class DebitWalletDto {
  @IsUUID('4', { message: 'userId must be a valid UUID v4' })
  userId: string;

  @IsPositive({ message: 'Amount must be a positive number greater than zero' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Purpose cannot be left blank' })
  purpose: string;

  @IsString()
  @IsNotEmpty({ message: 'referenceId is required for transaction tracing' })
  referenceId: string;
}
