import { Controller, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('submit-match')
  async submitMatch(
    @Body() body: { matchId: string; winnerId: string; maxSpeedRecorded: number; totalPointsEarned: number },
  ) {
    return this.analyticsService.submitMatchData(body.matchId, body);
  }
}
