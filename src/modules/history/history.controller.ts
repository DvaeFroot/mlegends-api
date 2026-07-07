import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RapidApiGuard } from '../../guards/rapidapi.guard';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import {
  ScrapeRunResponseDto,
  ChangeHistoryResponseDto,
} from './dto/history-response.dto';

@ApiTags('History')
@ApiSecurity('x-rapidapi-proxy-secret')
@UseGuards(RapidApiGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'List scrape runs' })
  @ApiOkResponse({ type: [ScrapeRunResponseDto] })
  findAllRuns(@Query() query: HistoryQueryDto) {
    return this.historyService.findAllRuns(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scrape run by ID' })
  @ApiParam({ name: 'id', description: 'Scrape run UUID' })
  @ApiOkResponse({ type: ScrapeRunResponseDto })
  @ApiNotFoundResponse({ description: 'Scrape run not found' })
  findOneRun(@Param('id') id: string) {
    return this.historyService.findOneRun(id);
  }

  @Get(':id/changes')
  @ApiOperation({ summary: 'Get all changes recorded in a scrape run' })
  @ApiParam({ name: 'id', description: 'Scrape run UUID' })
  @ApiOkResponse({ type: [ChangeHistoryResponseDto] })
  @ApiNotFoundResponse({ description: 'Scrape run not found' })
  findRunChanges(@Param('id') id: string) {
    return this.historyService.findRunChanges(id);
  }
}
