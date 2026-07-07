import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ScraperModule } from './scraper/scraper.module';
import { ChampionsModule } from './modules/champions/champions.module';
import { ItemsModule } from './modules/items/items.module';
import { HistoryModule } from './modules/history/history.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { RapidApiThrottlerGuard } from './guards/throttler.guard';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 86_400_000, limit: 50 }]),
    SupabaseModule,
    ScraperModule,
    ChampionsModule,
    ItemsModule,
    HistoryModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: RapidApiThrottlerGuard },
  ],
})
export class AppModule {}
