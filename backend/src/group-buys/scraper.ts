import { load } from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { Model } from 'mongoose';

const GEEKHACK_RSS = 'https://geekhack.org/index.php?action=.xml;type=rss;board=70';
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; keyboard-marketplace-bot/1.0)' };
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
const DELAY_MS = 2000;
const MAX_PAGES = 10;

let _geminiClient: GoogleGenAI | undefined;
function geminiClient(): GoogleGenAI {
  if (!_geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    _geminiClient = new GoogleGenAI({ apiKey });
  }
  return _geminiClient;
}

export interface ScrapedItem {
  topicId?: string;
  name?: string;
  type?: string;
  status?: string;
  gbStart?: string | null;
  gbEnd?: string | null;
  estimatedFulfillment?: string | null;
  basePrice?: { amount: number | null; currency: string | null } | null;
  items?: { name: string; price: number; currency: string }[];
  vendors?: { region: string; name: string; url: string }[];
  discordUrl?: string | null;
  designer?: string;
  overview?: string | null;
  poster?: string;
  sourceUrl?: string;
  images?: string[];
  scrapedAt?: string;
  postDate?: string | null;
  parseError?: string;
}

export interface RunScraperOptions {
  maxTopics?: number;
  onLog?: (msg: string) => void;
  groupBuyModel?: Model<any>;
}

interface RssTopic {
  topic_id: string;
  rss_title: string;
  thread_url: string;
}

interface PostData {
  poster: string;
  post_title: string;
  post_date: string;
  text: string;
  images: string[];
  links: { href: string; text: string }[];
}

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = await res.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: true });
  try {
    return utf8.decode(buf);
  } catch {
    return new TextDecoder('iso-8859-1').decode(buf);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRssPage(xml: string): RssTopic[] {
  const $ = load(xml, { xml: true });
  const items: RssTopic[] = [];
  const seen = new Set<string>();

  $('item').each((_, el) => {
    const link = $(el).find('link').text().trim();
    const match = link.match(/topic=(\d+)/);
    if (!match) return;
    const topic_id = match[1];
    if (seen.has(topic_id)) return;
    seen.add(topic_id);
    items.push({
      topic_id,
      rss_title: $(el).find('title').text().trim(),
      thread_url: `https://geekhack.org/index.php?topic=${topic_id}.0`,
    });
  });

  return items;
}

async function fetchNewTopics(
  existingIds: Set<string>,
  maxTopics: number,
  onLog: (msg: string) => void,
): Promise<RssTopic[]> {
  const newTopics: RssTopic[] = [];
  const newTopicIds = new Set<string>();
  let consecutiveEmpty = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * 10;
    const url = `${GEEKHACK_RSS};limit=${start}`;
    onLog(`  RSS page ${page + 1} (limit=${start}) …`);

    try {
      const xml = await fetchUrl(url);
      const items = parseRssPage(xml);
      if (!items.length) { onLog('empty — stopping'); break; }

      const fresh = items.filter(t => !existingIds.has(t.topic_id) && !newTopicIds.has(t.topic_id));
      onLog(`${fresh.length} new topic(s) found`);

      if (!fresh.length) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 6) {
          onLog('  Two consecutive pages with no new topics — done paginating.');
          break;
        }
      } else {
        consecutiveEmpty = 0;
        for (const t of fresh) newTopicIds.add(t.topic_id);
        newTopics.push(...fresh);
      }

      if (newTopics.length >= maxTopics) {
        onLog(`  Reached maxTopics (${maxTopics}) — stopping pagination.`);
        break;
      }
    } catch (e: any) {
      onLog(`fetch error: ${e.message}`);
      break;
    }

    await delay(DELAY_MS);
  }

  return newTopics.slice(0, maxTopics);
}

function parsePosts(html: string, maxPosts = 2): PostData[] {
  const $ = load(html);
  const results: PostData[] = [];

  $('.post_wrapper').slice(0, maxPosts).each((_, wrapper) => {
    const $w = $(wrapper);

    const poster = $w.find('div.poster h4 a[href*="action=profile"]').first().text().trim();
    const post_title = $w.find('h5[id^="subject_"] a').first().text().trim();

    let post_date = '';
    $w.find('div.smalltext').each((_, el) => {
      if (post_date) return;
      const m = $(el).text().match(/on:\s*(\w+,\s+\d+\s+\w+\s+\d{4})/);
      if (m) post_date = m[1];
    });

    const msgDiv = $w.find('div[id^="msg_"]').first();
    const text = msgDiv.text().replace(/\s+/g, ' ').trim();

    const imageSet = new Set<string>();
    msgDiv.find('img').each((_, img) => {
      const src = $(img).attr('src') ?? '';
      if (src && !src.includes('Smileys') && !src.includes('/post/') && !src.includes('useroff')) {
        imageSet.add(src);
      }
    });

    const links: { href: string; text: string }[] = [];
    msgDiv.find('a').each((_, a) => {
      const href = $(a).attr('href') ?? '';
      const cls = $(a).attr('class') ?? '';
      if (
        href &&
        !href.startsWith('javascript') &&
        !href.includes('PHPSESSID') &&
        !cls.includes('highslide') &&
        !href.includes('action=profile')
      ) {
        links.push({ href, text: $(a).text().trim() });
      }
    });

    results.push({ poster, post_title, post_date, text, images: [...imageSet], links });
  });

  return results;
}

function buildPrompt(post: PostData): string {
  const poster = post.poster;
  const linksFormatted = post.links
    .filter(l => l.href)
    .map(l => `  - ${l.text}: ${l.href}`)
    .join('\n');

  return `You are extracting structured data from a Geekhack mechanical keyboard group buy post.

Post title: ${post.post_title}
Posted by: ${poster}
Post date: ${post.post_date}

Post text:
${post.text}

Links found in post:
${linksFormatted}

IMPORTANT: Respond with only the JSON literal null (nothing else) if this post does not read like an original product announcement — for example, it is primarily a changelog or status log, a reply or quote to another user, a notice that the real content is elsewhere, or administrative content with no product details. A genuine announcement introduces the product and typically includes pricing, vendors, or detailed descriptions.

Otherwise, extract the following and return ONLY valid JSON with no markdown, no backticks, no explanation:

{
  "name": "Name of the keycap set or keyboard — strip any [GB]/[IC] prefix",
  "type": "keyboard | keycaps | switches | accessories",
  "status": "IC | GB | closed",
  "gbStart": "YYYY-MM-DD or null",
  "gbEnd": "YYYY-MM-DD or null",
  "estimatedFulfillment": "free text like 'early Q4 2026' or null",
  "basePrice": {
    "amount": number or null,
    "currency": "EUR | USD | GBP | etc or null",
  },
  "items": [
    {"name": "kit name", "price": number, "currency": "USD"}
  ],
  "vendors": [
    {"region": "US", "name": "NovelKeys", "url": "https://..."}
  ],
  "discordUrl": "discord.gg url or null",
  "designer": "designer username — use '${poster}' if no other designer is mentioned",
  "overview": "one sentence summary of the main product and its style, or null if not enough information"
}

Rules:
- name must not include [GB], [IC], [CLOSED] or similar prefixes
- status: infer from title prefix ([GB] → GB, [IC] → IC) when not stated in the text
- dates in the title or text like "May 15th - June 12th" with no year → use the post date's year as the default; if the date range would fall after the fulfillment date, try the prior year instead
- basePrice: price of the main product only (base kit / case); null if not explicitly stated — do not estimate or infer
- vendors: all regional vendors with their direct store URLs
- discordUrl: only discord.gg links
- designer: prefer an explicitly named designer over the poster; fall back to '${poster}'
- Use null for any field that cannot be determined

items rules — what to INCLUDE vs EXCLUDE:
  For keycaps: include Base, Alphas, Novelties, Spacebars/Minibars, Extensions, Numpad, compatibility kits, regional/language kits, alternate-color alpha sets, and deskmats/deskpads. These are all legitimate purchasable items.
  For keycaps: EXCLUDE cheap single-key extras (e.g. "BAE", "R3 Up Arrow", "10u spacebar" each under ~$15)
  For keyboards/cases: include the main product (base configuration) and any distinct color variants or editions (e.g. Wired vs Wireless, Dolch vs Luna colorway, E-white vs Black Alu).
  For keyboards/cases: EXCLUDE everything sold separately as an extra or add-on: PCBs, plates, foam kits, cables, gaskets, knobs, bumpons, badge sets, OLED screens, and other components.

  Good keycap items examples (INCLUDE these):
    Base Kit, Novelties, Spacebars, Extensions, Alt Alphas, Numpad, NorDEUK Kit, Non-Alert Kit, 40s Mods, Deskmat, Deskpad
  Bad keycap items examples (EXCLUDE these):
    BAE, R3 Up Arrow, 10u spacebar, Novelty BAE, 40s colour fix (tiny single-key fix)

  Good keyboard items examples (INCLUDE these):
    Alta Dolch ($399), Alta Luna ($399), Alta Corde ($399), Alta Labe ($575) — colorway variants of the same board
    Link - Wired Edition ($245), Link - Wireless Edition ($275) — distinct purchasable editions
  Bad keyboard items examples (EXCLUDE these):
    Extra hotswap PCBs, MX Solder PCB, Aluminum plates, Polycarbonate plates, FR4 plates, Foam, Foam kit, DB&Cable, Extra USB-C to USB-C cable, Extra brass knobs, Extra gaskets, Extra 8mm bumpons, Extra OLED screens, Black Ano Alu Full Plate

overview rules — one sentence of card subtext describing the product's aesthetic and design highlights:
  The name is already displayed above this text, so do NOT restate it or begin with it. Write as if continuing from the name — focus on inspiration/theme, colorway, distinctive style, and what makes it unique.
  Do NOT write: the product name, "is a keycap set", shipping updates, trivial specs, kit listings, process notes, or generic filler.

  Good overview examples:
    keycaps: "Vibrant pink legends inspired by early punk rock album aesthetics, with maximum compatibility for small form factors."
    keycaps: "UV-printed Cyrillic sublegends and OG Icon modifiers on a custom grey/white base, with a limited companion keyboard collab."
    keycaps: "Inspired by vintage media and film editing keyboards from the '80s and '90s, rendered in muted earth tones with retro legends."
    keyboard: "Semi-screwless 65% with a swappable badge/extra key slot, offered in four colorways from light cream to translucent."
    keyboard: "Third revision of the wireless-capable 40%, now with a tri-mode hot-swap PCB, full-perimeter RGB, and frosted PC bottom."
    keyboard: "Porsche 911-inspired 65% aluminum case in classic automotive colorways, with gasket mount and an optional hall-effect PCB."
  Bad overview examples (do NOT write these):
    "GMK CYL Thunder God is a keycap set inspired by..."  ← restates the name
    "Deskpad dimensions are 836x380mm."  ← trivial spec
    "International kitting will be available as an in-stock purchase via GMK when fulfillment is starting."  ← process note
    "A GMK keycap set named Ishtar R2, featuring a base kit, alphas, novelties, spaces, and a deskmat."  ← restates name + generic kit listing
    "As of 13th February, all alt alphas kits will be shipping with a free bonus 2.25u shift."  ← shipping update
`;
}

function safeParseDate(dateStr: string): string | null {
  try { return new Date(dateStr).toISOString().split('T')[0]; }
  catch { return null; }
}

async function parseWithGemini(
  post: PostData,
  threadUrl: string,
  onLog: (msg: string) => void,
): Promise<ScrapedItem | null> {
  try {
    const response = await geminiClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(post),
      config: { responseMimeType: 'application/json' },
    });

    const usage = response.usageMetadata;
    if (usage) {
      onLog(`  tokens — in: ${usage.promptTokenCount}, thinking: ${usage.thoughtsTokenCount}, out: ${usage.candidatesTokenCount}, total: ${usage.totalTokenCount}`);
    }

    const parsed = JSON.parse((response.text ?? '').trim()) as ScrapedItem | null;
    if (parsed === null) return null;

    if (!parsed.designer && post.poster) parsed.designer = post.poster;
    parsed.poster = post.poster;
    parsed.sourceUrl = threadUrl;
    parsed.images = post.images;
    parsed.scrapedAt = new Date().toISOString();
    parsed.postDate = post.post_date ? safeParseDate(post.post_date) : null;

    return parsed;
  } catch (e: any) {
    const errorType = e instanceof SyntaxError ? 'JSON parse' : 'Gemini';
    onLog(`  ⚠ ${errorType} error: ${e.message}`);
    return {
      sourceUrl: threadUrl,
      parseError: e.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

export async function runScraper(opts: RunScraperOptions): Promise<ScrapedItem[]> {
  const { maxTopics = 10, onLog = () => {}, groupBuyModel } = opts;

  const existingIds = groupBuyModel
    ? new Set<string>(
        (await groupBuyModel.find({ topicId: { $exists: true } }, { topicId: 1 }).lean().exec() as any[])
          .map((d: any) => d.topicId as string),
      )
    : new Set<string>();
  if (groupBuyModel) onLog(`Loaded ${existingIds.size} topic IDs already in the database — will skip these.`);

  onLog('\nPaginating RSS feed to find new topics…');
  const topics = await fetchNewTopics(existingIds, maxTopics, onLog);

  if (!topics.length) {
    onLog('\nNo new topics found — already up to date.');
    return [];
  }

  onLog(`\nProcessing ${topics.length} new topic(s)…`);
  const results: ScrapedItem[] = [];

  for (const [i, topic] of topics.entries()) {
    onLog(`\n[${i + 1}/${topics.length}] ${topic.rss_title.slice(0, 70)}`);
    onLog(`  URL: ${topic.thread_url}`);

    try {
      const html = await fetchUrl(topic.thread_url);
      const posts = parsePosts(html);
      onLog(`  ✓ Fetched ${posts.length} post(s)`);

      let extracted: ScrapedItem | null = null;
      let hadError = false;

      for (let attempt = 0; attempt < posts.length; attempt++) {
        const post = posts[attempt];
        if (!post.text) {
          onLog(`  ⚠ Post ${attempt + 1}: empty text — skipping`);
          continue;
        }
        onLog(`  Trying post ${attempt + 1} (poster: ${post.poster || '?'}, ${post.text.length} chars)`);
        if (post.post_title) onLog(`  ↳ Title: ${post.post_title}`);

        const result = await parseWithGemini(post, topic.thread_url, onLog);
        if (result === null) {
          onLog(`  ↳ Post ${attempt + 1} rejected by Gemini — trying next`);
          continue;
        }
        if (result.parseError) {
          onLog(`  ↳ Post ${attempt + 1} Gemini error — trying next`);
          hadError = true;
          continue;
        }
        extracted = result;
        break;
      }

      if (!extracted) {
        onLog(hadError
          ? `  ✗ Gemini error on all posts — will retry next run`
          : `  ✗ Could not identify original GB post — skipping`,
        );
        continue;
      }

      extracted.topicId = topic.topic_id;
      results.push(extracted);
      onLog(`  ✓ Parsed: ${extracted.name ?? 'unknown'}`);
    } catch (e: any) {
      onLog(`  ✗ Error: ${e.message}`);
    }

    if (i < topics.length - 1) await delay(DELAY_MS);
  }

  return results;
}
