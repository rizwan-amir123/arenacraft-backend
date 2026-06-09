import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('join')
  async joinQueue(@Body() body: { userId: string }) {
    return this.matchmakingService.enterQueue(body.userId);
  }

  @Get('poll')
  async pollMatch(
    @Query('userId') userId: string,
    @Query('range') range?: number,
  ) {
    return this.matchmakingService.findMatchForPlayer(userId, range ? Number(range) : undefined);
  }
}
