import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm'; // <-- Add 'In' here
import { RedisService } from '../redis/redis.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MatchmakingService {
  private readonly QUEUE_KEY = 'game:matchmaking:pool';

  constructor(
    private redisService: RedisService,
    private dataSource: DataSource,
  ) {}

  /**
   * Adds a player to the matchmaking queue using their real MMR from Postgres
   */
  async enterQueue(userId: string) {
    // 1. Verify the user exists in PostgreSQL to fetch their true MMR
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('Player does not exist.');
    }

    const redis = this.redisService.getClient();

    // 2. Add player to the Redis Sorted Set (ZSET)
    // ZADD key score member
    await redis.zadd(this.QUEUE_KEY, user.mmr, user.id);

    return {
      message: 'Entered matchmaking pool successfully.',
      playerId: user.id,
      mmr: user.mmr,
    };
  }

  /**
   * Attempts to find a match for a specific player based on MMR threshold
   * @param userId The player looking for a match
   * @param range The acceptable variance in MMR (e.g., +/- 50 points)
   */
  async findMatchForPlayer(userId: string, range = 50) {
    const redis = this.redisService.getClient();

    // 1. Get the player's MMR from the Redis queue
    const playerMmr = await redis.zscore(this.QUEUE_KEY, userId);
    if (!playerMmr) {
      throw new BadRequestException('Player is not actively in the matchmaking queue.');
    }

    const targetMmr = Number(playerMmr);
    const minMmr = targetMmr - range;
    const maxMmr = targetMmr + range;

    // 2. Query Redis for players within the MMR range [targetMmr - range, targetMmr + range]
    // ZRANGEBYSCORE key min max LIMIT offset count
    const potentialMatches = await redis.zrangebyscore(
      this.QUEUE_KEY,
      minMmr,
      maxMmr,
    );

    // Filter out the requesting player themselves
    const opponents = potentialMatches.filter((id) => id !== userId);

    if (opponents.length === 0) {
      return {
        status: 'SEARCHING',
        message: 'No suitable opponents found within your MMR range yet.',
      };
    }

    // 3. Match found! Take the closest opponent
    const opponentId = opponents[0];

    // 4. Atomically remove both players from the matchmaking pool so they aren't matched again
    await redis.zrem(this.QUEUE_KEY, userId, opponentId);

    // Fetch details from DB to return clean names (In a production system, you'd use a WebSocket event here)
    const players = await this.dataSource.getRepository(User).findBy({
			id: In([userId, opponentId]),
		});

    return {
      status: 'MATCHED',
      matchId: `MATCH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      player1: players.find((p) => p.id === userId),
      player2: players.find((p) => p.id === opponentId),
    };
  }
}
