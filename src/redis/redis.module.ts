import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Makes this module available everywhere without re-importing
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
