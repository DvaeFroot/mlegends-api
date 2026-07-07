import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemComponentDto {
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
}

export class ItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() type: string | null;
  @ApiPropertyOptional() tier: number | null;
  @ApiPropertyOptional() cost: number | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() passiveName: string | null;
  @ApiPropertyOptional() passiveDescription: string | null;
  @ApiProperty({ type: Object }) stats: Record<string, string | number>;
  @ApiProperty({ type: [ItemComponentDto] }) components: ItemComponentDto[];
  @ApiPropertyOptional() imageUrl: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
