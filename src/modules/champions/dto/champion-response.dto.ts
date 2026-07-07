import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AbilityDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() cooldown: string | null;
  @ApiPropertyOptional() type: string | null;
  @ApiPropertyOptional() iconUrl: string | null;
}

export class ChampionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: [String] }) role: string[];
  @ApiProperty({ type: [String] }) specialty: string[];
  @ApiPropertyOptional() lore: string | null;
  @ApiPropertyOptional() releaseDate: string | null;
  @ApiPropertyOptional() portraitUrl: string | null;
  @ApiProperty({ type: Object }) baseStats: Record<string, string | number>;
  @ApiProperty({ type: [AbilityDto] }) abilities: AbilityDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
