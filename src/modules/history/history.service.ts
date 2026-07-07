import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../supabase/supabase.service';
import { HistoryQueryDto } from './dto/history-query.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllRuns(query: HistoryQueryDto) {
    const db = this.requireDb();
    let q = db.from('scrape_runs').select('*').order('created_at', { ascending: false });

    if (query.resource_type) q = q.eq('resource_type', query.resource_type);
    if (query.status) q = q.eq('status', query.status);

    const limit = query.limit ?? 20;
    const offset = ((query.page ?? 1) - 1) * limit;
    q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw new InternalServerErrorException('Failed to fetch scrape runs');
    return data ?? [];
  }

  async findOneRun(id: string) {
    const db = this.requireDb();
    const { data, error } = await db
      .from('scrape_runs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Failed to fetch scrape run');
    if (!data) throw new NotFoundException(`Scrape run '${id}' not found`);
    return data;
  }

  async findRunChanges(id: string) {
    const db = this.requireDb();

    const run = await this.findOneRun(id);

    const { data, error } = await db
      .from('change_history')
      .select('*')
      .eq('scrape_run_id', run.id)
      .order('created_at');

    if (error) throw new InternalServerErrorException('Failed to fetch change history');
    return data ?? [];
  }

  private requireDb(): SupabaseClient {
    const db = this.supabaseService.db;
    if (!db) throw new InternalServerErrorException('Database not configured');
    return db;
  }
}
