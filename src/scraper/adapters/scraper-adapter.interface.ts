export interface RawSkin {
  name: string;
  tier: string | null;
  tag: string | null;
  portraitUrl: string | null;
  splashUrl: string | null;
  price: string | null;
}

export interface RawChampionData {
  slug: string;
  name: string;
  role: string[];
  specialty: string[];
  lore: string | null;
  releaseDate: string | null;
  portraitUrl: string | null;
  baseStats: Record<string, string | number>;
  abilities: RawAbility[];
  skins: RawSkin[];
  spotlightVideoId: string | null;
}

export interface RawAbility {
  name: string;
  description: string;
  cooldown: string | null;
  type: string | null;
  iconUrl: string | null;
}

export interface ItemComponent {
  slug: string;
  name: string;
}

export interface RawItemData {
  slug: string;
  name: string;
  type: string | null;
  tier: number | null;
  cost: number | null;
  description: string | null;
  passiveName: string | null;
  passiveDescription: string | null;
  stats: Record<string, string | number>;
  components: ItemComponent[];
  imageUrl: string | null;
}

export interface IScraper {
  scrapeChampionList(): Promise<string[]>;
  scrapeChampion(slug: string): Promise<RawChampionData>;
  scrapeItemList(): Promise<string[]>;
  scrapeItem(slug: string): Promise<RawItemData>;
}
