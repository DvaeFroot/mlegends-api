import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperService } from './scraper.service';
import { FandomAdapter } from './adapters/fandom.adapter';

@Module({
  imports: [HttpModule],
  providers: [ScraperService, FandomAdapter],
  exports: [ScraperService, FandomAdapter],
})
export class ScraperModule {}
