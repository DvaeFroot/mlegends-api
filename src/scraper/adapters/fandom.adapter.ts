import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { ScraperService } from '../scraper.service';
import {
  IScraper,
  RawChampionData,
  RawAbility,
  RawItemData,
  ItemComponent,
} from './scraper-adapter.interface';

const BASE_URL = 'https://mobile-legends.fandom.com';
const API_URL = `${BASE_URL}/api.php`;

const CATEGORIES = {
  heroes: 'Category:Heroes',
  equipment: 'Category:Equipment',
};

interface MwCategoryMember {
  pageid: number;
  ns: number;
  title: string;
}

interface MwCategoryResponse {
  query: { categorymembers: MwCategoryMember[] };
  continue?: { cmcontinue: string };
}

interface MwParseResponse {
  parse: { text: { '*': string } };
}

@Injectable()
export class FandomAdapter implements IScraper {
  private readonly logger = new Logger(FandomAdapter.name);

  constructor(private readonly scraperService: ScraperService) {}

  async scrapeChampionList(): Promise<string[]> {
    const titles = await this.fetchCategoryMembers(CATEGORIES.heroes);
    this.logger.log(`Champion list: found ${titles.length} slugs`);
    return titles;
  }

  async scrapeChampion(slug: string): Promise<RawChampionData> {
    const $ = await this.fetchParsedPage(slug);

    // Name: first text node of pi-title (strip subtitle in quotes)
    const rawTitle = $('.portable-infobox .pi-title').first().text().trim();
    const name = rawTitle.replace(/[""][^""]+[""].*$/, '').trim() || slug.replace(/_/g, ' ');

    const portraitUrl = this.extractImageUrl($, '.portable-infobox .pi-image img');

    // Infobox map — some fields are duplicated; collect all occurrences
    const infoboxEntries = this.parseInfoboxAll($);

    const role = this.parseList(infoboxEntries['role']?.[0] ?? '');
    const specialty = this.parseList(infoboxEntries['specialty']?.[0] ?? '');
    const lore = infoboxEntries['lore']?.[0] ?? null;

    // Release date is stored under data-source="name" (first occurrence on ML wiki)
    const firstNameVal = infoboxEntries['name']?.[0] ?? null;
    const releaseDate = firstNameVal && this.looksLikeDate(firstNameVal) ? firstNameVal : null;

    const baseStats = this.extractHeroStats($);
    const abilities = this.extractAbilities($);
    const splashMap = this.extractSplashArts($);
    const skins = await this.scrapeChampionSkins(slug, splashMap);
    const spotlightVideoId = await this.scrapeSpotlightVideoId($);

    return { slug, name, role, specialty, lore, releaseDate, portraitUrl, baseStats, abilities, skins, spotlightVideoId };
  }

  async scrapeChampionSkins(slug: string, splashMap: Map<string, string>): Promise<import('./scraper-adapter.interface').RawSkin[]> {
    try {
      const $ = await this.fetchParsedPage(`${slug}/Cosmetics`);
      return this.extractSkins($, splashMap);
    } catch {
      return [];
    }
  }

  private async scrapeSpotlightVideoId($: CheerioAPI): Promise<string | null> {
    try {
      const videoKey = $('[data-source="spotlight"] a[data-video-key]').first().attr('data-video-key')
        ?? $('a.video[data-video-key]').first().attr('data-video-key')
        ?? null;
      if (!videoKey) return null;

      const params = new URLSearchParams({
        action: 'query',
        titles: `File:${videoKey.replace(/_/g, ' ')}`,
        prop: 'imageinfo',
        iiprop: 'url|metadata',
        format: 'json',
      });
      const data = await this.scraperService.fetchJson<Record<string, unknown>>(
        `${API_URL}?${params.toString()}`,
      );
      const pages = (data as any).query?.pages ?? {};
      const pageData = Object.values(pages)[0] as any;
      const metadata: { name: string; value: unknown }[] = pageData?.imageinfo?.[0]?.metadata ?? [];
      const entry = metadata.find((m) => m.name === 'videoId');
      return entry ? String(entry.value) : null;
    } catch {
      return null;
    }
  }

  private extractSplashArts($: CheerioAPI): Map<string, string> {
    const map = new Map<string, string>();
    $('.wikia-gallery-item img').each((_, img) => {
      const alt = $(img).attr('alt')?.trim();
      const src = $(img).attr('data-src') ?? $(img).attr('src') ?? null;
      const imageName = $(img).attr('data-image-name') ?? '';
      if (alt && src && !src.startsWith('data:') && imageName.toLowerCase().endsWith('.jpg')) {
        map.set(alt, this.cleanImageUrl(src));
      }
    });
    return map;
  }

  private extractSkins($: CheerioAPI, splashMap: Map<string, string>): import('./scraper-adapter.interface').RawSkin[] {
    const skins: import('./scraper-adapter.interface').RawSkin[] = [];

    $('.skin-box').each((_, box) => {
      const name = $(box).find('.skin-box-name').text().trim();
      if (!name) return;

      const imgEl = $(box).find('.skin-box-image img').first();
      const rawSrc = imgEl.attr('data-src') ?? imgEl.attr('src') ?? null;
      const portraitUrl = rawSrc ? this.cleanImageUrl(rawSrc) : null;

      const price = $(box).find('.skin-box-price').text().trim() || null;

      const borderAlt = $(box).find('.skin-box-border img').first().attr('alt') ?? '';
      const tierMatch = borderAlt.match(/Skin border \(([^)]+)\)/i);
      const tier = tierMatch ? tierMatch[1] : null;

      const tagAlt = $(box).find('.skin-box-tag img').first().attr('alt') ?? '';
      const tag = tagAlt.replace(/\s*skin\s*tag\s*/i, '').trim() || null;

      const splashUrl = splashMap.get(name) ?? null;

      skins.push({ name, tier, tag, portraitUrl, splashUrl, price });
    });

    return skins;
  }

  async scrapeItemList(): Promise<string[]> {
    const titles = await this.fetchCategoryMembers(CATEGORIES.equipment);
    this.logger.log(`Item list: found ${titles.length} slugs`);
    return titles;
  }

  async scrapeItem(slug: string): Promise<RawItemData> {
    const $ = await this.fetchParsedPage(slug);

    if ($('.portable-infobox').length === 0) {
      return this.scrapeItemLegacy($, slug);
    }

    const rawTitle = $('.portable-infobox .pi-title').first().text().trim();
    const name = rawTitle || slug.replace(/_/g, ' ');
    const imageUrl = this.extractImageUrl($, '.portable-infobox .pi-image img');

    // type: data-source="type"
    const type = $('.pi-data[data-source="type"] .pi-data-value').text().trim() || null;

    // cost: in horizontal group, data-source is on the <td> directly
    const rawPrice = $('td[data-source="total_price"]').text().trim() ||
      $('.pi-data[data-source="total_price"] .pi-data-value').text().trim();
    const priceMatch = rawPrice.match(/\d+/);
    const cost = priceMatch ? Number(priceMatch[0]) : null;

    // stats: data-source="bonus" — parse "+160 Physical Attack +5% Movement Speed"
    const bonusText = $('.pi-data[data-source="bonus"] .pi-data-value').text().trim();
    const stats = this.parseBonusStats(bonusText);

    // passive: data-source="unique" — "Unique Passive - NAME: description"
    const uniqueText = $('.pi-data[data-source="unique"] .pi-data-value').text().trim();
    const { passiveName, passiveDescription } = this.parsePassive(uniqueText);

    // description: item quote or title1 subtitle
    const description = bonusText || null;

    const components = this.extractItemComponents($);
    const tier = this.deriveTier(cost, components.length);

    return { slug, name, type, tier, cost, description, passiveName, passiveDescription, stats, components, imageUrl };
  }

  private scrapeItemLegacy($: CheerioAPI, slug: string): RawItemData {
    const infobox = $('table.infobox');

    const rawTitle = infobox.find('th').first().text().trim();
    const name = rawTitle || slug.replace(/_/g, ' ');

    const imgEl = infobox.find('img.mw-file-element').first();
    const rawSrc = imgEl.attr('src') ?? null;
    const imageUrl = rawSrc ? this.cleanImageUrl(rawSrc) : null;

    // Collect all label→value rows
    const rows: { label: string; value: string }[] = [];
    infobox.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        rows.push({
          label: $(cells.get(0)).text().trim().toLowerCase(),
          value: $(cells.get(1)).text().trim(),
        });
      } else if (cells.length === 1) {
        rows.push({ label: '', value: $(cells.get(0)).text().trim() });
      }
    });

    const findRow = (labelText: string) =>
      rows.find((r) => r.label === labelText)?.value ?? null;

    const typeVal = findRow('category');
    const type = typeVal || null;

    const costVal = findRow('cost');
    const costMatch = costVal?.match(/\d+/);
    const cost = costMatch ? Number(costMatch[0]) : null;

    const tierVal = findRow('tier');
    const tierFromPage = tierVal ? Number(tierVal.match(/\d/)?.[0] ?? null) || null : null;
    const tier = tierFromPage ?? this.deriveTier(cost, 0);

    // Stats: any row whose value starts with "+"
    const stats: Record<string, string | number> = {};
    for (const row of rows) {
      const m = row.value.match(/^\+(\d+(?:\.\d+)?%?)\s+(.+)$/);
      if (m) {
        const key = m[2].trim().toLowerCase().replace(/\s+/g, '_');
        stats[key] = m[1];
      }
    }

    // Passive: first row labeled "unique passive"
    const passiveVal = rows.find((r) => r.label.includes('passive'))?.value ?? null;
    const { passiveName, passiveDescription } = this.parsePassive(passiveVal ?? '');

    return { slug, name, type, tier, cost, description: null, passiveName, passiveDescription, stats, components: [], imageUrl };
  }

  // --- MediaWiki API helpers ---

  private async fetchCategoryMembers(category: string): Promise<string[]> {
    const slugs: string[] = [];
    let continueToken: string | undefined;

    do {
      const params = new URLSearchParams({
        action: 'query',
        list: 'categorymembers',
        cmtitle: category,
        cmlimit: '500',
        cmnamespace: '0',
        format: 'json',
        ...(continueToken ? { cmcontinue: continueToken } : {}),
      });

      const data = await this.scraperService.fetchJson<MwCategoryResponse>(
        `${API_URL}?${params.toString()}`,
      );

      for (const member of data.query?.categorymembers ?? []) {
        const slug = member.title.replace(/\s+/g, '_');
        if (slug) slugs.push(slug);
      }

      continueToken = data.continue?.cmcontinue;
    } while (continueToken);

    return slugs;
  }

  private async fetchParsedPage(slug: string): Promise<CheerioAPI> {
    const params = new URLSearchParams({
      action: 'parse',
      page: slug.replace(/_/g, ' '),
      prop: 'text',
      format: 'json',
    });

    const data = await this.scraperService.fetchJson<MwParseResponse>(
      `${API_URL}?${params.toString()}`,
    );

    return cheerio.load(data.parse?.text?.['*'] ?? '');
  }

  // --- Parsers ---

  // Returns all values for each data-source key (handles duplicates)
  private parseInfoboxAll($: CheerioAPI): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    $('.portable-infobox .pi-data').each((_, el) => {
      const source = $(el).attr('data-source')?.toLowerCase().replace(/\s+/g, '_') ?? '';
      const value = $(el).find('.pi-data-value').text().trim();
      if (source) {
        if (!map[source]) map[source] = [];
        if (value) map[source].push(value);
      }
    });
    return map;
  }

  // Parse "Hero stats" table → Level 1 values
  private extractHeroStats($: CheerioAPI): Record<string, string | number> {
    const stats: Record<string, string | number> = {};

    $('table').each((_, table) => {
      const headerText = $(table).find('td[colspan], th[colspan]').first().text().toLowerCase();
      if (!headerText.includes('hero stats') && !headerText.includes('attribute')) return;

      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;

        const rawName = $(cells.get(0)).text().trim();
        const statName = rawName
          .replace(/\(.*?\)/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_');

        // Level 1 = first data column; strip percentage/parenthetical
        const rawVal = $(cells.get(1)).text().trim();
        const val = rawVal.split(/[\s(]/)[0];

        if (statName && val && /^[\d.]+$/.test(val)) {
          stats[statName] = val;
        }
      });
    });

    return stats;
  }

  // Parse ability tables (each skill is a 2-column table row)
  private extractAbilities($: CheerioAPI): RawAbility[] {
    const abilities: RawAbility[] = [];
    const seen = new Set<string>();

    $('table').each((_, table) => {
      const boldName = $(table).find('b').filter((_, el) => {
        const style = $(el).attr('style') ?? '';
        return style.includes('font-size:120') || style.includes('font-size: 120');
      }).first().text().trim();

      if (!boldName || seen.has(boldName)) return;
      seen.add(boldName);

      const typeTag = $(table).find('span[style*="background-color"]').first().text().trim();
      const iconImg = $(table).find('img').first();
      const iconUrl = iconImg.attr('data-src') ?? iconImg.attr('src') ?? null;

      // Description: text in second cell after stripping name + type
      const secondCell = $(table).find('tr').first().find('td').last();
      const rawDesc = secondCell.clone()
        .find('b, span[style*="background-color"], .mw-collapsible, i').remove().end()
        .text().trim()
        .replace(/\s+/g, ' ')
        .slice(0, 600);

      if (boldName && rawDesc) {
        abilities.push({
          name: boldName,
          description: rawDesc,
          cooldown: null,
          type: typeTag || null,
          iconUrl: iconUrl ? this.cleanImageUrl(iconUrl) : null,
        });
      }
    });

    return abilities;
  }

  // Parse "+160 Physical Attack +5% Movement Speed" → {physical_attack: "160", movement_speed: "5%"}
  private parseBonusStats(bonus: string): Record<string, string | number> {
    const stats: Record<string, string | number> = {};
    if (!bonus) return stats;
    const matches = bonus.matchAll(/\+(\d+(?:\.\d+)?%?)\s+([A-Za-z][A-Za-z ]+?)(?=\s+\+|\s*$)/g);
    for (const m of matches) {
      const key = m[2].trim().toLowerCase().replace(/\s+/g, '_');
      stats[key] = m[1];
    }
    return stats;
  }

  // Parse "Unique Passive - NAME: description" → {passiveName, passiveDescription}
  private parsePassive(text: string): { passiveName: string | null; passiveDescription: string | null } {
    if (!text) return { passiveName: null, passiveDescription: null };
    const match = text.match(/passive\s*[-–]\s*([^:]+):\s*(.+)/i);
    if (match) {
      return { passiveName: match[1].trim(), passiveDescription: match[2].trim() };
    }
    return { passiveName: null, passiveDescription: text };
  }

  // Recipe: links inside data-source="recipe" infobox section (skip item itself = first link)
  private extractItemComponents($: CheerioAPI): ItemComponent[] {
    const components: ItemComponent[] = [];
    const seen = new Set<string>();

    const recipeEl = $('.pi-data[data-source="recipe"]');
    let isFirst = true;

    recipeEl.find('a[href^="/wiki/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const slug = href.replace('/wiki/', '').split('?')[0];
      const name =
        $(el).attr('title') ??
        $(el).find('img').attr('alt') ??
        $(el).text().trim();

      if (isFirst) { isFirst = false; return; } // skip item itself
      if (slug && name && !this.isMetaPage(slug) && !seen.has(slug)) {
        seen.add(slug);
        components.push({ slug, name });
      }
    });

    return components;
  }

  private extractImageUrl($: CheerioAPI, selector: string): string | null {
    const el = $(selector).first();
    const src = el.attr('data-src') ?? el.attr('src') ?? null;
    return src ? this.cleanImageUrl(src) : null;
  }

  private deriveTier(cost: number | null, numComponents: number): number | null {
    if (!cost || cost === 0) return null;
    if (numComponents === 0 && cost <= 800) return 1;
    if (cost >= 1500) return 3;
    return 2;
  }

  private cleanImageUrl(url: string): string {
    return url.split('/revision/')[0];
  }

  private isMetaPage(slug: string): boolean {
    const meta = ['Special:', 'Category:', 'File:', 'Template:', 'Help:', 'User:'];
    return meta.some((prefix) => slug.startsWith(prefix));
  }

  private looksLikeDate(val: string): boolean {
    return /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
      val,
    );
  }

  private parseList(value: string): string[] {
    if (!value) return [];
    return value.split(/[,/\n]/).map((s) => s.trim()).filter(Boolean);
  }
}
