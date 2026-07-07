import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'https://mobile-legends.fandom.com';
const API_URL = `${BASE_URL}/api.php`;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchJson(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'mlegends-scraper/1.0' } });
  return data;
}

async function fetchPage(slug) {
  const params = new URLSearchParams({ action: 'parse', page: slug.replace(/_/g, ' '), prop: 'text', format: 'json' });
  const data = await fetchJson(`${API_URL}?${params}`);
  return cheerio.load(data.parse?.text?.['*'] ?? '');
}

async function fetchCategoryMembers(category) {
  const slugs = [];
  let continueToken;
  do {
    const params = new URLSearchParams({ action: 'query', list: 'categorymembers', cmtitle: category, cmlimit: '500', cmnamespace: '0', format: 'json', ...(continueToken ? { cmcontinue: continueToken } : {}) });
    const data = await fetchJson(`${API_URL}?${params}`);
    for (const m of data.query?.categorymembers ?? []) slugs.push(m.title.replace(/\s+/g, '_'));
    continueToken = data.continue?.cmcontinue;
  } while (continueToken);
  return slugs;
}

function cleanImageUrl(url) { return url.split('/revision/')[0]; }

function parseList(value) {
  if (!value) return [];
  return value.split(/[,/\n]/).map(s => s.trim()).filter(Boolean);
}

function looksLikeDate(val) {
  return /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(val);
}

function parseInfoboxAll($) {
  const map = {};
  $('.portable-infobox .pi-data').each((_, el) => {
    const source = $(el).attr('data-source')?.toLowerCase().replace(/\s+/g, '_') ?? '';
    const value = $(el).find('.pi-data-value').text().trim();
    if (source) { if (!map[source]) map[source] = []; if (value) map[source].push(value); }
  });
  return map;
}

function extractHeroStats($) {
  const stats = {};
  $('table').each((_, table) => {
    const headerText = $(table).find('td[colspan], th[colspan]').first().text().toLowerCase();
    if (!headerText.includes('hero stats') && !headerText.includes('attribute')) return;
    $(table).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;
      const rawName = $(cells.get(0)).text().trim();
      const statName = rawName.replace(/\(.*?\)/g, '').trim().toLowerCase().replace(/\s+/g, '_');
      const rawVal = $(cells.get(1)).text().trim();
      const val = rawVal.split(/[\s(]/)[0];
      if (statName && val && /^[\d.]+$/.test(val)) stats[statName] = val;
    });
  });
  return stats;
}

function extractAbilities($) {
  const abilities = [];
  const seen = new Set();
  $('table').each((_, table) => {
    const boldName = $(table).find('b').filter((_, el) => {
      const style = $(el).attr('style') ?? '';
      return style.includes('font-size:120') || style.includes('font-size: 120');
    }).first().text().trim();
    if (!boldName || seen.has(boldName)) return;
    seen.add(boldName);
    const typeTag = $(table).find('span[style*="background-color"]').first().text().trim();
    const iconImg = $(table).find('img').first();
    const iconUrl = iconImg.attr('data-src') ?? iconImg.attr('src') ?? null;
    const secondCell = $(table).find('tr').first().find('td').last();
    const rawDesc = secondCell.clone()
      .find('b, span[style*="background-color"], .mw-collapsible, i').remove().end()
      .text().trim().replace(/\s+/g, ' ').slice(0, 600);
    if (boldName && rawDesc) {
      abilities.push({ name: boldName, description: rawDesc, cooldown: null, type: typeTag || null, iconUrl: iconUrl ? cleanImageUrl(iconUrl) : null });
    }
  });
  return abilities;
}

function extractSplashArts($) {
  const map = new Map();
  $('.wikia-gallery-item img').each((_, img) => {
    const alt = $(img).attr('alt')?.trim();
    const src = $(img).attr('data-src') ?? $(img).attr('src') ?? null;
    const imageName = $(img).attr('data-image-name') ?? '';
    if (alt && src && !src.startsWith('data:') && imageName.toLowerCase().endsWith('.jpg')) {
      map.set(alt, cleanImageUrl(src));
    }
  });
  return map;
}

function extractSkins($, splashMap) {
  const skins = [];
  $('.skin-box').each((_, box) => {
    const name = $(box).find('.skin-box-name').text().trim();
    if (!name) return;
    const imgEl = $(box).find('.skin-box-image img').first();
    const rawSrc = imgEl.attr('data-src') ?? imgEl.attr('src') ?? null;
    const portraitUrl = rawSrc ? cleanImageUrl(rawSrc) : null;
    const price = $(box).find('.skin-box-price').text().trim() || null;
    const borderAlt = $(box).find('.skin-box-border img').first().attr('alt') ?? '';
    const tierMatch = borderAlt.match(/Skin border \(([^)]+)\)/i);
    const tier = tierMatch ? tierMatch[1] : null;
    const tagAlt = $(box).find('.skin-box-tag img').first().attr('alt') ?? '';
    const tag = tagAlt.replace(/\s*skin\s*tag\s*/i, '').trim() || null;
    const splashUrl = splashMap.get(name) ?? null;
    skins.push({ name, tier, tag, portraitUrl, splashUrl, price });
  });
  return skins;
}

async function scrapeChampionSkins(slug, splashMap) {
  try {
    const $ = await fetchPage(`${slug}/Cosmetics`);
    return extractSkins($, splashMap);
  } catch {
    return [];
  }
}

async function scrapeChampion(slug) {
  const $ = await fetchPage(slug);
  const rawTitle = $('.portable-infobox .pi-title').first().text().trim();
  const name = rawTitle.replace(/[""][^""]+[""].*$/, '').trim() || slug.replace(/_/g, ' ');
  const imgEl = $('.portable-infobox .pi-image img').first();
  const rawSrc = imgEl.attr('data-src') ?? imgEl.attr('src') ?? null;
  const portraitUrl = rawSrc ? cleanImageUrl(rawSrc) : null;
  const infoboxEntries = parseInfoboxAll($);
  const role = parseList(infoboxEntries['role']?.[0] ?? '');
  const specialty = parseList(infoboxEntries['specialty']?.[0] ?? '');
  const lore = infoboxEntries['lore']?.[0] ?? null;
  const firstNameVal = infoboxEntries['name']?.[0] ?? null;
  const releaseDate = firstNameVal && looksLikeDate(firstNameVal) ? firstNameVal : null;
  const baseStats = extractHeroStats($);
  const abilities = extractAbilities($);
  const splashMap = extractSplashArts($);
  const skins = await scrapeChampionSkins(slug, splashMap);
  return { slug, name, role, specialty, lore, releaseDate, portraitUrl, baseStats, abilities, skins };
}

function diff(prev, next) {
  return Object.keys(next).filter(k => JSON.stringify(prev[k]) !== JSON.stringify(next[k]));
}

async function main() {
  console.log('Fetching champion list from wiki...');
  const slugs = await fetchCategoryMembers('Category:Heroes');
  console.log(`Found ${slugs.length} slugs`);

  let scraped = 0, created = 0, updated = 0, skipped = 0, errors = 0;

  for (const slug of slugs) {
    try {
      const raw = await scrapeChampion(slug);

      if (raw.role.length === 0) {
        skipped++;
        continue;
      }

      const row = {
        slug: raw.slug,
        name: raw.name,
        role: raw.role,
        specialty: raw.specialty,
        lore: raw.lore,
        release_date: raw.releaseDate,
        portrait_url: raw.portraitUrl,
        base_stats: raw.baseStats,
        abilities: raw.abilities,
        skins: raw.skins,
      };

      const { data: existing } = await db.from('champions').select('*').eq('slug', slug).maybeSingle();

      if (!existing) {
        const { error } = await db.from('champions').insert(row);
        if (error) throw new Error(error.message);
        console.log(`  + ${slug}`);
        created++;
      } else {
        const changed = diff(existing, row);
        if (changed.length > 0) {
          const { error } = await db.from('champions').update({ ...row, updated_at: new Date().toISOString() }).eq('slug', slug);
          if (error) throw new Error(error.message);
          console.log(`  ~ ${slug} [${changed.join(', ')}]`);
          updated++;
        }
      }
      scraped++;
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`);
      errors++;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nDone. scraped=${scraped} created=${created} updated=${updated} skipped=${skipped} errors=${errors}`);
}

main().catch(console.error);
