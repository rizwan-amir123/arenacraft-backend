import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MatchProcessor } from './match.processor'; // We will create this next

@Module({
  imports: [
    // Register the specific queue queue name
    BullModule.registerQueue({
      name: 'match-processing',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, MatchProcessor],
})
export class AnalyticsModule {}
