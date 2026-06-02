/**
 * Sets Cache-Control: public, max-age=31536000, immutable on all existing R2 objects
 * by copying each object to itself with updated metadata (no data transfer).
 *
 * Usage (run from the backend/ directory):
 *   npx ts-node --transpile-only scripts/set-cache-headers.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  CopyObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

dotenv.config();

const bucket = process.env.R2_BUCKET_NAME ?? '';
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ''}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
};

async function main() {
  let updated = 0;
  let token: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    );

    for (const obj of list.Contents ?? []) {
      if (!obj.Key) continue;
      const ext = path.extname(obj.Key).slice(1).toLowerCase();
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: obj.Key,
          CopySource: `${bucket}/${obj.Key}`,
          MetadataDirective: 'REPLACE',
          CacheControl: 'public, max-age=31536000, immutable',
          ContentType: CONTENT_TYPES[ext] ?? 'image/jpeg',
        }),
      );
      updated++;
      process.stdout.write(`\r  ${updated} objects updated...`);
    }

    token = list.NextContinuationToken;
  } while (token);

  console.log(`\n✓ Done — ${updated} objects updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
