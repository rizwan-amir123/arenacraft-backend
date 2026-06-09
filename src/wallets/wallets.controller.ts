import { Controller, Post, Body } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { DebitWalletDto } from './dto/debit-wallet.dto'; // <-- Import DTO

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('debit')
  async debit(@Body() debitWalletDto: DebitWalletDto) { // <-- Bind DTO here
    return this.walletsService.debitWallet(
      debitWalletDto.userId,
      debitWalletDto.amount,
      debitWalletDto.purpose,
      debitWalletDto.referenceId,
    );
  }
}
