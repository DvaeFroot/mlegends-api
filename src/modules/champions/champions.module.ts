import { Module } from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { ChampionsController } from './champions.controller';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ScraperModule } from '../../scraper/scraper.module';

@Module({
  imports: [SupabaseModule, ScraperModule],
  controllers: [ChampionsController],
  providers: [ChampionsService],
  exports: [ChampionsService],
})
export class ChampionsModule {}
