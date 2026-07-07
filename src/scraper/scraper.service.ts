import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchHtml(url: string): Promise<CheerioAPI> {
    this.logger.debug(`Fetching HTML ${url}`);
    const response = await firstValueFrom(
      this.httpService.get<string>(url, {
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        responseType: 'text',
      }),
    );
    return cheerio.load(response.data as string);
  }

  async fetchJson<T>(url: string): Promise<T> {
    this.logger.debug(`Fetching JSON ${url}`);
    const response = await firstValueFrom(
      this.httpService.get<T>(url, {
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'application/json',
        },
      }),
    );
    return response.data;
  }
}
