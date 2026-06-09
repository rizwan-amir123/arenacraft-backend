import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6380);

    this.redisClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: null, // Required by BullMQ later
    });

    this.redisClient.on('connect', () => {
      console.log(`🚀 Redis connected successfully on port ${port}`);
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  // Exposed getter to give other services access to raw Redis commands (for Sorted Sets later)
  getClient(): Redis {
    return this.redisClient;
  }

	/**
   * Acquires a distributed lock for a specific key
   * @param key The lock identifier (e.g., wallet:lock:id)
   * @param ttl Duration in milliseconds for the lock to remain active
   * @returns boolean true if lock acquired, false if already locked
   */
  async acquireLock(key: string, ttl: number): Promise<boolean> {
    // Using .call() sends raw commands to Redis, bypassing the broken TypeScript .set() overloads
    const result = await this.redisClient.call(
      'SET',
      `lock:${key}`,
      'LOCKED',
      'NX',
      'PX',
      ttl,
    );
    
    return result === 'OK';
  }

  /**
   * Releases a distributed lock
   * @param key The lock identifier
   */
  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(`lock:${key}`);
  }
}
