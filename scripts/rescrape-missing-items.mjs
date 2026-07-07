import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://mobile-legends.fandom.com/api.php';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanImageUrl(url) {
  return url.split('/revision/')[0];
}

function parsePassive(text) {
  if (!text) return { passiveName: null, passiveDescription: null };
  const match = text.match(/passive\s*[-–]\s*([^:]+):\s*(.+)/i);
  if (match) return { passiveName: match[1].trim(), passiveDescription: match[2].trim() };
  return { passiveName: null, passiveDescription: text };
}

async function fetchPage(slug) {
  const params = new URLSearchParams({
    action: 'parse',
    page: slug.replace(/_/g, ' '),
    prop: 'text',
    format: 'json',
  });
  const { data } = await axios.get(`${API_URL}?${params}`, {
    headers: { 'User-Agent': 'mlegends-scraper/1.0' },
  });
  return cheerio.load(data.parse?.text?.['*'] ?? '');
}

function scrapePortable($, slug) {
  const rawTitle = $('.portable-infobox .pi-title').first().text().trim();
  const name = rawTitle || slug.replace(/_/g, ' ');
  const imgEl = $('.portable-infobox .pi-image img').first();
  const rawSrc = imgEl.attr('data-src') ?? imgEl.attr('src') ?? null;
  const imageUrl = rawSrc ? cleanImageUrl(rawSrc) : null;

  const type = $('.pi-data[data-source="type"] .pi-data-value').text().trim() || null;
  const rawPrice = $('td[data-source="total_price"]').text().trim() ||
    $('.pi-data[data-source="total_price"] .pi-data-value').text().trim();
  const priceMatch = rawPrice.match(/\d+/);
  const cost = priceMatch ? Number(priceMatch[0]) : null;

  const bonusText = $('.pi-data[data-source="bonus"] .pi-data-value').text().trim();
  const stats = {};
  const matches = bonusText.matchAll(/\+(\d+(?:\.\d+)?%?)\s+([A-Za-z][A-Za-z ]+?)(?=\s+\+|\s*$)/g);
  for (const m of matches) {
    stats[m[2].trim().toLowerCase().replace(/\s+/g, '_')] = m[1];
  }

  const uniqueText = $('.pi-data[data-source="unique"] .pi-data-value').text().trim();
  const { passiveName, passiveDescription } = parsePassive(uniqueText);

  return { name, imageUrl, type, cost, tier: null, stats, passiveName, passiveDescription };
}

function scrapeLegacy($, slug) {
  const infobox = $('table.infobox');
  const rawTitle = infobox.find('th').first().text().trim();
  const name = rawTitle || slug.replace(/_/g, ' ');

  const imgEl = infobox.find('img.mw-file-element').first();
  const rawSrc = imgEl.attr('src') ?? null;
  const imageUrl = rawSrc ? cleanImageUrl(rawSrc) : null;

  const rows = [];
  infobox.find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      rows.push({ label: $(cells.get(0)).text().trim().toLowerCase(), value: $(cells.get(1)).text().trim() });
    } else if (cells.length === 1) {
      rows.push({ label: '', value: $(cells.get(0)).text().trim() });
    }
  });

  const findRow = (lbl) => rows.find((r) => r.label === lbl)?.value ?? null;

  const type = findRow('category');
  const costVal = findRow('cost');
  const cost = costVal ? Number(costVal.match(/\d+/)?.[0] ?? null) || null : null;
  const tierVal = findRow('tier');
  const tier = tierVal ? Number(tierVal.match(/\d/)?.[0] ?? null) || null : null;

  const stats = {};
  for (const row of rows) {
    const m = row.value.match(/^\+(\d+(?:\.\d+)?%?)\s+(.+)$/);
    if (m) stats[m[2].trim().toLowerCase().replace(/\s+/g, '_')] = m[1];
  }

  const passiveVal = rows.find((r) => r.label.includes('passive'))?.value ?? null;
  const { passiveName, passiveDescription } = parsePassive(passiveVal ?? '');

  return { name, imageUrl, type, cost, tier, stats, passiveName, passiveDescription };
}

async function scrapeItem(slug) {
  const $ = await fetchPage(slug);
  if ($('.portable-infobox').length > 0) return scrapePortable($, slug);
  return scrapeLegacy($, slug);
}

async function main() {
  const { data: items } = await db
    .from('items')
    .select('id, slug, name')
    .is('image_url', null);

  const realItems = (items ?? []).filter(
    (i) => !['Defense Items', 'Movement Items', 'Equipment', 'Gold'].includes(i.name),
  );

  console.log(`Re-scraping ${realItems.length} items...`);

  for (const item of realItems) {
    try {
      const data = await scrapeItem(item.slug);
      const { error } = await db
        .from('items')
        .update({
          image_url: data.imageUrl,
          type: data.type,
          cost: data.cost,
          tier: data.tier,
          stats: data.stats,
          passive_name: data.passiveName,
          passive_description: data.passiveDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        console.error(`  ✗ ${item.slug}: ${error.message}`);
      } else {
        console.log(`  ✓ ${item.slug} — image: ${data.imageUrl ? 'found' : 'MISSING'}, type: ${data.type}, cost: ${data.cost}`);
      }
    } catch (err) {
      console.error(`  ✗ ${item.slug}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('Done.');
}

main().catch(console.error);
