/**
 * Recovers deleted R2 images for group buys by re-fetching from the original
 * Geekhack thread and re-uploading to R2 using the same deterministic key.
 * If the original image URLs haven't changed, the dead R2 URLs in MongoDB
 * will resolve again without any DB updates needed.
 *
 * Run from the backend directory:
 *   npm run recover:images
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';
import mongoose from 'mongoose';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { load } from 'cheerio';
import { fetchUrl, parsePosts } from '../src/group-buys/scraper';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const DELAY_MS = 2_000;

function isR2Url(url: string): boolean {
  return R2_PUBLIC_URL.length > 0 && url.startsWith(R2_PUBLIC_URL);
}

// Mirror of r2.service.ts buildKey — must stay in sync.
function buildKey(topicId: string, sourceUrl: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(sourceUrl)
    .digest('hex')
    .slice(0, 16);
  let ext = 'jpg';
  try {
    const m = new URL(sourceUrl).pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (m) ext = m[1].toLowerCase();
  } catch {}
  return `group-buys/${topicId}/${hash}.${ext}`;
}

async function reupload(
  client: S3Client,
  sourceUrl: string,
  key: string,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; keyboard-marketplace-bot/1.0)',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const required = [
    'DB_URL',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.DB_URL!);
  console.log('Connected to MongoDB\n');

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // List all topic folders that actually exist in R2.
  const existingFolders = new Set<string>();
  let continuationToken: string | undefined;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        Prefix: 'group-buys/',
        Delimiter: '/',
        ContinuationToken: continuationToken,
      }),
    );
    for (const { Prefix } of res.CommonPrefixes ?? []) {
      const match = Prefix?.match(/group-buys\/([^/]+)\//);
      if (match) existingFolders.add(match[1]);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`${existingFolders.size} folder(s) found in R2.\n`);

  const col = mongoose.connection.collection('group-buys');
  const all = await col.find({}).toArray();

  // Affected: has a topicId, was migrated to R2 (images contain R2 URLs),
  // but the folder no longer exists in the bucket.
  const affected = all.filter((gb) => {
    if (!gb.topicId) return false;
    const hasR2Images = [
      ...(gb.images ?? []),
      ...(gb.excludedImages ?? []),
    ].some(isR2Url);
    return hasR2Images && !existingFolders.has(gb.topicId);
  });

  console.log(`${affected.length} group buy(s) with R2 images to recover.\n`);

  let restored = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < affected.length; i++) {
    const gb = affected[i];
    const label = gb.name ?? gb.topicId ?? String(gb._id);
    console.log(`[${i + 1}/${affected.length}] ${label}`);

    if (!gb.sourceUrl) {
      console.log('  ✗ No sourceUrl — skipping\n');
      skipped++;
      continue;
    }

    let threadImages: string[];
    try {
      console.log(`  Fetching ${gb.sourceUrl} …`);
      const html = await fetchUrl(gb.sourceUrl);
      const posts = parsePosts(html, 5);
      console.log(`  ${posts.length} post(s) parsed, images per post: [${posts.map((p) => p.images.length).join(', ')}]`);
      posts.forEach((p, i) => {
        if (p.images.length) console.log(`    post ${i + 1} images:`, p.images);
      });
      // Diagnostic: show all raw img src values before parsePosts filtering
      const $d = load(html);
      const rawSrcs: string[] = [];
      $d('.post_wrapper').slice(0, 5).each((_, w) => {
        $d(w).find('div[id^="msg_"] img').each((_, img) => {
          const s = $d(img).attr('src') ?? '';
          if (s) rawSrcs.push(s);
        });
      });
      console.log(`  Raw img srcs found (${rawSrcs.length}):`, rawSrcs.slice(0, 10));
      threadImages = [...new Set(posts.flatMap((p) => p.images))];
    } catch (e: any) {
      console.log(`  ✗ Fetch failed: ${e.message}\n`);
      failed++;
      continue;
    }

    if (!threadImages.length) {
      console.log('  ✗ No images found in thread\n');
      skipped++;
      continue;
    }

    const topicId = gb.topicId ?? String(gb._id);
    const docUrls = new Set<string>([
      ...(gb.images ?? []),
      ...(gb.excludedImages ?? []),
    ]);

    console.log(`  ${threadImages.length} image(s) found — uploading to R2…`);

    for (const imgUrl of threadImages) {
      const key = buildKey(topicId, imgUrl);
      const r2Url = `${R2_PUBLIC_URL}/${key}`;
      if (!docUrls.has(r2Url)) continue;
      try {
        await reupload(r2, imgUrl, key);
        console.log(`  ✓ ${key}`);
        restored++;
      } catch (e: any) {
        console.log(`  ✗ ${imgUrl.slice(0, 80)}: ${e.message}`);
        failed++;
      }
    }
    console.log();

    if (i < affected.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log('─'.repeat(60));
  console.log(
    `Done — Restored: ${restored}  Failed: ${failed}  Skipped: ${skipped}`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
