import { Module } from '@nestjs/common';
import { ScrapeScheduler } from './scrape.scheduler';
import { ChampionsModule } from '../modules/champions/champions.module';
import { ItemsModule } from '../modules/items/items.module';

@Module({
  imports: [ChampionsModule, ItemsModule],
  providers: [ScrapeScheduler],
})
export class SchedulerModule {}
