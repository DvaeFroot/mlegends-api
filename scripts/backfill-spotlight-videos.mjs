import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://mobile-legends.fandom.com/api.php';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchJson(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'mlegends-scraper/1.0' } });
  return data;
}

async function getSpotlightVideoId(slug) {
  try {
    // Fetch parsed page HTML to find the video key in the spotlight infobox field
    const parseParams = new URLSearchParams({ action: 'parse', page: slug.replace(/_/g, ' '), prop: 'text', format: 'json' });
    const parseData = await fetchJson(`${API_URL}?${parseParams}`);
    const html = parseData.parse?.text?.['*'] ?? '';

    // Extract data-video-key from spotlight anchor or any video thumbnail
    const keyMatch = html.match(/data-source="spotlight"[^>]*>[\s\S]*?data-video-key="([^"]+)"/);
    const fallbackMatch = html.match(/class="[^"]*video[^"]*"[^>]*data-video-key="([^"]+)"/);
    const videoKey = keyMatch?.[1] ?? fallbackMatch?.[1] ?? null;
    if (!videoKey) return null;

    // Resolve YouTube ID from imageinfo API
    const imgParams = new URLSearchParams({ action: 'query', titles: `File:${videoKey.replace(/_/g, ' ')}`, prop: 'imageinfo', iiprop: 'url|metadata', format: 'json' });
    const imgData = await fetchJson(`${API_URL}?${imgParams}`);
    const pages = imgData.query?.pages ?? {};
    const pageData = Object.values(pages)[0];
    const metadata = pageData?.imageinfo?.[0]?.metadata ?? [];
    const entry = metadata.find(m => m.name === 'videoId');
    return entry ? String(entry.value) : null;
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return null;
  }
}

async function main() {
  const { data: champions, error } = await db.from('champions').select('slug').order('name');
  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log(`Backfilling spotlight videos for ${champions.length} champions...`);

  for (const { slug } of champions) {
    process.stdout.write(`  ${slug} ... `);
    const videoId = await getSpotlightVideoId(slug);
    if (videoId) {
      await db.from('champions').update({ spotlight_video_id: videoId }).eq('slug', slug);
      console.log(`✓ ${videoId}`);
    } else {
      console.log('no video found');
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('Done.');
}

main();
