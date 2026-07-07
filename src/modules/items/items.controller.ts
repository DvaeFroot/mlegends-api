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
import { ItemsService } from './items.service';
import { ItemQueryDto } from './dto/item-query.dto';
import { ItemResponseDto } from './dto/item-response.dto';

@ApiTags('Items')
@ApiSecurity('x-rapidapi-proxy-secret')
@UseGuards(RapidApiGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all items' })
  @ApiOkResponse({ type: [ItemResponseDto] })
  findAll(@Query() query: ItemQueryDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get item by slug' })
  @ApiParam({ name: 'slug', example: 'Blade_of_Despair' })
  @ApiOkResponse({ type: ItemResponseDto })
  @ApiNotFoundResponse({ description: 'Item not found' })
  findOne(@Param('slug') slug: string) {
    return this.itemsService.findOne(slug);
  }

  @Post('scrape')
  @HttpCode(202)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Trigger item scrape (admin)' })
  @ApiSecurity('x-api')
  @ApiAcceptedResponse({ description: 'Scrape started' })
  triggerScrape() {
    void this.itemsService.runScrape();
    return { message: 'Item scrape started' };
  }
}
