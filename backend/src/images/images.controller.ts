import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import sharp from 'sharp';
import { R2Service } from '../group-buys/r2.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly r2: R2Service) {}

  @Get()
  async transform(
    @Query('url') url: string,
    @Query('w') wParam: string,
    @Res() res: Response,
  ) {
    if (!url || !this.r2.isR2Url(url)) {
      throw new BadRequestException('url must be an R2 image URL');
    }

    const width = Math.min(Math.max(parseInt(wParam) || 800, 1), 1200);

    const response = await fetch(url);
    if (!response.ok) {
      res.status(502).send('Failed to fetch source image');
      return;
    }

    const source = Buffer.from(await response.arrayBuffer()) as Buffer;
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';

    let output = source;
    try {
      output = await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .toBuffer();
    } catch {
      // unsupported format — serve original
    }

    res
      .set('Content-Type', contentType)
      .set('Cache-Control', 'public, max-age=31536000, immutable')
      .send(output);
  }
}
