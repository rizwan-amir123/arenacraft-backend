import { Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('dev')
export class UsersSeedController {
  constructor(private readonly usersService: UsersService) {}

  @Post('seed')
  async seedPlayers() {
    const players = [
      { username: 'Faker99', email: 'faker@arenacraft.local' },
      { username: 'Shroud77', email: 'shroud@arenacraft.local' },
      { username: 'S1mple_CS', email: 's1mple@arenacraft.local' },
      { username: 'TenZ_Ace', email: 'tenz@arenacraft.local' },
    ];

    const results = [];
    for (const p of players) {
      try {
        const res = await this.usersService.registerPlayer(p.username, p.email);
        results.push({ username: p.username, status: 'CREATED', id: res.playerId });
      } catch (e) {
        results.push({ username: p.username, status: 'SKIPPED/EXISTS' });
      }
    }

    return { message: 'Seeding routine executed.', results };
  }
}
