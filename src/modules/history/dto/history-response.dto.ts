import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScrapeRunResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() resourceType: string;
  @ApiProperty() sourceUrl: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() recordsScraped: number | null;
  @ApiPropertyOptional() recordsCreated: number | null;
  @ApiPropertyOptional() recordsUpdated: number | null;
  @ApiPropertyOptional() errorMessage: string | null;
  @ApiProperty() startedAt: string;
  @ApiPropertyOptional() completedAt: string | null;
  @ApiProperty() createdAt: string;
}

export class ChangeHistoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() scrapeRunId: string;
  @ApiProperty() resourceType: string;
  @ApiProperty() resourceId: string;
  @ApiProperty() resourceSlug: string;
  @ApiProperty() changeType: string;
  @ApiPropertyOptional({ type: Object }) previousData: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: Object }) newData: Record<string, unknown> | null;
  @ApiPropertyOptional({ type: [String] }) changedFields: string[] | null;
  @ApiProperty() createdAt: string;
}
