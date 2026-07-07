import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ScraperModule } from '../../scraper/scraper.module';

@Module({
  imports: [SupabaseModule, ScraperModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
