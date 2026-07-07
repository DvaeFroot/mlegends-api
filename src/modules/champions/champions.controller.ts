import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiOkResponse,
  ApiAcceptedResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../guards/api-key.guard';
import { RapidApiGuard } from '../../guards/rapidapi.guard';
import { ChampionsService } from './champions.service';
import { ChampionQueryDto } from './dto/champion-query.dto';
import { ChampionResponseDto } from './dto/champion-response.dto';

@ApiTags('Champions')
@ApiSecurity('x-rapidapi-proxy-secret')
@UseGuards(RapidApiGuard)
@Controller('champions')
export class ChampionsController {
  constructor(private readonly championsService: ChampionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all champions' })
  @ApiOkResponse({ type: [ChampionResponseDto] })
  findAll(@Query() query: ChampionQueryDto) {
    return this.championsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get champion by slug' })
  @ApiParam({ name: 'slug', example: 'Layla' })
  @ApiOkResponse({ type: ChampionResponseDto })
  @ApiNotFoundResponse({ description: 'Champion not found' })
  findOne(@Param('slug') slug: string) {
    return this.championsService.findOne(slug);
  }

  @Post('scrape')
  @HttpCode(202)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Trigger champion scrape (admin)' })
  @ApiSecurity('x-api')
  @ApiAcceptedResponse({ description: 'Scrape started' })
  triggerScrape() {
    void this.championsService.runScrape();
    return { message: 'Champion scrape started' };
  }
}
