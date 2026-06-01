import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.R2_BUCKET_NAME ?? '';
  private readonly publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(
    /\/$/,
    '',
  );

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID ?? '';
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  isConfigured(): boolean {
    return !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
    );
  }

  isR2Url(url: string): boolean {
    return this.publicUrl.length > 0 && url.startsWith(this.publicUrl);
  }

  isImageUrl(url: string): boolean {
    try {
      const { protocol, hostname } = new URL(url);
      return (
        (protocol === 'http:' || protocol === 'https:') &&
        hostname !== 'undefined' &&
        hostname !== ''
      );
    } catch {
      return false;
    }
  }

  // Deterministic key: same source URL for the same topic always maps to the same key.
  buildKey(topicId: string, sourceUrl: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(sourceUrl)
      .digest('hex')
      .slice(0, 16);
    let ext = 'jpg';
    try {
      const m = new URL(sourceUrl).pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (m) ext = m[1].toLowerCase();
    } catch {
      // unparseable URL — default to jpg
    }
    return `group-buys/${topicId}/${hash}.${ext}`;
  }

  async deleteObject(url: string): Promise<void> {
    const key = url.slice(this.publicUrl.length + 1);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async uploadFromUrl(sourceUrl: string, key: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(sourceUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType =
        response.headers.get('content-type') ?? 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      return `${this.publicUrl}/${key}`;
    } catch (err: any) {
      this.logger.warn(`Upload failed for ${sourceUrl}: ${err.message}`);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
