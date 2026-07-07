import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChampionsService } from '../modules/champions/champions.service';
import { ItemsService } from '../modules/items/items.service';

@Injectable()
export class ScrapeScheduler {
  private readonly logger = new Logger(ScrapeScheduler.name);

  constructor(
    private readonly championsService: ChampionsService,
    private readonly itemsService: ItemsService,
  ) {}

  @Cron('0 2 * * *', { name: 'scrape-champions' })
  async scrapeChampions(): Promise<void> {
    this.logger.log('Cron: scraping champions');
    await this.championsService.runScrape();
  }

  @Cron('30 2 * * *', { name: 'scrape-items' })
  async scrapeItems(): Promise<void> {
    this.logger.log('Cron: scraping items');
    await this.itemsService.runScrape();
  }
}
