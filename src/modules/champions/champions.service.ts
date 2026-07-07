import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../supabase/supabase.service';
import { FandomAdapter } from '../../scraper/adapters/fandom.adapter';
import { RawChampionData } from '../../scraper/adapters/scraper-adapter.interface';
import { ChampionQueryDto } from './dto/champion-query.dto';

@Injectable()
export class ChampionsService {
  private readonly logger = new Logger(ChampionsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly fandomAdapter: FandomAdapter,
  ) {}

  async findAll(query: ChampionQueryDto) {
    const db = this.requireDb();
    let q = db.from('champions').select('*').order('name').neq('role', '{}');

    if (query.role) q = q.contains('role', [query.role]);
    if (query.specialty) q = q.contains('specialty', [query.specialty]);

    const limit = query.limit ?? 20;
    const offset = ((query.page ?? 1) - 1) * limit;
    q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw new InternalServerErrorException('Failed to fetch champions');
    return data ?? [];
  }

  async findOne(slug: string) {
    const db = this.requireDb();
    const { data, error } = await db
      .from('champions')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Failed to fetch champion');
    if (!data) throw new NotFoundException(`Champion '${slug}' not found`);
    return data;
  }

  async runScrape(): Promise<void> {
    const db = this.requireDb();
    const startedAt = new Date().toISOString();
    const sourceUrl = 'https://mobile-legends.fandom.com/wiki/List_of_heroes';

    const { data: run, error: runError } = await db
      .from('scrape_runs')
      .insert({ resource_type: 'champions', source_url: sourceUrl, status: 'running', started_at: startedAt })
      .select()
      .single();

    if (runError) {
      this.logger.error(`Failed to create scrape run: ${runError.message}`);
      throw new InternalServerErrorException('Failed to create scrape run');
    }

    const scrapeRunId: string = run.id;
    let recordsScraped = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let errors = 0;

    this.logger.log(`Scrape run ${scrapeRunId} started`);

    try {
      const slugs = await this.fandomAdapter.scrapeChampionList();
      this.logger.log(`Found ${slugs.length} champions`);

      for (const slug of slugs) {
        try {
          const raw = await this.fandomAdapter.scrapeChampion(slug);
          if (raw.role.length === 0) {
            this.logger.warn(`Skipping non-hero page: ${slug}`);
            continue;
          }
          const result = await this.upsertChampion(db, raw, scrapeRunId);
          if (result === 'created') recordsCreated++;
          if (result === 'updated') recordsUpdated++;
          recordsScraped++;
        } catch (err) {
          this.logger.error(`Champion '${slug}': ${(err as Error).message}`);
          errors++;
        }
        await this.delay(500);
      }
    } catch (err) {
      this.logger.error(`Scrape run ${scrapeRunId} fatal: ${(err as Error).message}`);
      await db
        .from('scrape_runs')
        .update({ status: 'failed', error_message: (err as Error).message, completed_at: new Date().toISOString() })
        .eq('id', scrapeRunId);
      return;
    }

    const finalStatus =
      recordsScraped === 0 ? 'failed' : errors === 0 ? 'success' : 'partial';

    await db
      .from('scrape_runs')
      .update({
        status: finalStatus,
        records_scraped: recordsScraped,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scrapeRunId);

    this.logger.log(
      `Run ${scrapeRunId} done: ${finalStatus} | scraped=${recordsScraped} created=${recordsCreated} updated=${recordsUpdated} errors=${errors}`,
    );
  }

  private async upsertChampion(
    db: SupabaseClient,
    raw: RawChampionData,
    scrapeRunId: string,
  ): Promise<'created' | 'updated' | 'unchanged'> {
    const row = {
      slug: raw.slug,
      name: raw.name,
      role: raw.role,
      specialty: raw.specialty,
      lore: raw.lore,
      release_date: raw.releaseDate,
      portrait_url: raw.portraitUrl,
      base_stats: raw.baseStats,
      abilities: raw.abilities,
      skins: raw.skins,
      spotlight_video_id: raw.spotlightVideoId,
    };

    const { data: existing } = await db
      .from('champions')
      .select('*')
      .eq('slug', raw.slug)
      .maybeSingle();

    if (!existing) {
      const { data: inserted, error } = await db
        .from('champions')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Insert failed: ${error.message}`);

      await db.from('change_history').insert({
        scrape_run_id: scrapeRunId,
        resource_type: 'champions',
        resource_id: inserted.id,
        resource_slug: raw.slug,
        change_type: 'created',
        new_data: row,
      });
      return 'created';
    }

    const changedFields = this.diffFields(existing, row);
    if (changedFields.length === 0) return 'unchanged';

    const { error } = await db
      .from('champions')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('slug', raw.slug);
    if (error) throw new Error(`Update failed: ${error.message}`);

    await db.from('change_history').insert({
      scrape_run_id: scrapeRunId,
      resource_type: 'champions',
      resource_id: existing.id,
      resource_slug: raw.slug,
      change_type: 'updated',
      previous_data: existing,
      new_data: row,
      changed_fields: changedFields,
    });
    return 'updated';
  }

  private diffFields(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
    return Object.keys(next).filter(
      (key) => JSON.stringify(prev[key]) !== JSON.stringify(next[key]),
    );
  }

  private requireDb(): SupabaseClient {
    const db = this.supabaseService.db;
    if (!db) throw new InternalServerErrorException('Database not configured');
    return db;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
