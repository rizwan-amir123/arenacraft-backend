import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Processor('match-processing')
export class MatchProcessor extends WorkerHost {
  constructor(private dataSource: DataSource) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { matchId, winnerId, maxSpeedRecorded, totalPointsEarned } = job.data;
    
    console.log(`\n📦 [BullMQ Worker] Processing Job ${job.id} for Match: ${matchId}`);

    // --- ANTI-CHEAT ENGINE VALIDATION ---
    // Rule 1: Flag speed hacks (E.g., maximum baseline character speed is 15.0 m/s)
    if (maxSpeedRecorded > 15.0) {
      console.error(`🚨 [ANTI-CHEAT FLAG] Match ${matchId} rejected! Player ${winnerId} recorded impossible speed: ${maxSpeedRecorded} m/s.`);
      throw new Error(`Anti-cheat violation: Player speed exceeded maximum system allowances.`);
    }

    // Rule 2: Flag anomalous score accumulation points rates
    if (totalPointsEarned > 10000) {
       console.error(`🚨 [ANTI-CHEAT FLAG] Match ${matchId} rejected! Impossible total point generation.`);
       throw new Error(`Anti-cheat violation: Anomalous point metrics detected.`);
    }

    // --- SUCCESS PATH: PERSIST RESULTS ---
    console.log(`✅ [ANTI-CHEAT CLEAN] Match ${matchId} passed security criteria. Rewarding winner.`);
    
    const userRepository = this.dataSource.getRepository(User);
    const winner = await userRepository.findOneBy({ id: winnerId });

    if (winner) {
      winner.mmr += 25; // Boost winner's competitive ranking by +25 points
      await userRepository.save(winner);
      console.log(`🏆 [Database Updated] Player ${winner.username} MMR increased to ${winner.mmr}.\n`);
    }

    return { success: true, matchId };
  }
}
