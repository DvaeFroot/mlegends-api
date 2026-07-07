-- Champions
CREATE TABLE IF NOT EXISTS champions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT[],
  specialty     TEXT[],
  lore          TEXT,
  release_date  DATE,
  portrait_url  TEXT,
  base_stats    JSONB,
  abilities     JSONB,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  type                 TEXT,
  tier                 INTEGER,
  cost                 INTEGER,
  description          TEXT,
  passive_name         TEXT,
  passive_description  TEXT,
  stats                JSONB,
  image_url            TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Scrape run log
CREATE TABLE IF NOT EXISTS scrape_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type    TEXT NOT NULL,
  source_url       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'running',
  records_scraped  INTEGER,
  records_created  INTEGER,
  records_updated  INTEGER,
  error_message    TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Per-record change log
CREATE TABLE IF NOT EXISTS change_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_run_id    UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  resource_type    TEXT NOT NULL,
  resource_id      UUID NOT NULL,
  resource_slug    TEXT NOT NULL,
  change_type      TEXT NOT NULL,
  previous_data    JSONB,
  new_data         JSONB,
  changed_fields   TEXT[],
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_champions_slug ON champions(slug);
CREATE INDEX IF NOT EXISTS idx_champions_role ON champions USING GIN(role);
CREATE INDEX IF NOT EXISTS idx_champions_specialty ON champions USING GIN(specialty);
CREATE INDEX IF NOT EXISTS idx_items_slug ON items(slug);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_resource_type ON scrape_runs(resource_type);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX IF NOT EXISTS idx_change_history_scrape_run ON change_history(scrape_run_id);
CREATE INDEX IF NOT EXISTS idx_change_history_resource ON change_history(resource_type, resource_id);
