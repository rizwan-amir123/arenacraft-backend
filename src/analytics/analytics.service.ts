import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AnalyticsService {
  // Inject the queue we registered in the module
  constructor(@InjectQueue('match-processing') private matchQueue: Queue) {}

  async submitMatchData(matchId: string, data: any) {
    // Add the match processing job into our Redis-backed queue
    const job = await this.matchQueue.add('analyze-telemetry', {
      matchId,
      ...data,
    }, {
      attempts: 3, // Automatically retry 3 times if the job fails
      backoff: 5000, // Wait 5 seconds before retrying
    });

    return {
      message: 'Match data accepted for asynchronous validation and processing.',
      jobId: job.id,
      status: 'QUEUED',
    };
  }
}
