import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

const MAX_DIMENSION = 2048; // longest side, px — only ever downscales
const WEBP_QUALITY = 85; // visually near-lossless, still shrinks well

@Injectable()
export class ImageCompressionService {
  private readonly logger = new Logger(ImageCompressionService.name);

  async compress(file: Express.Multer.File): Promise<Express.Multer.File> {
    try {
      const buffer = await sharp(file.buffer)
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      // Guarantee: never store something bigger than what was uploaded.
      if (buffer.length >= file.size) return file;

      const nameWithoutExt = file.originalname.replace(/\.[^./]+$/, '');
      return {
        ...file,
        buffer,
        size: buffer.length,
        mimetype: 'image/webp',
        originalname: `${nameWithoutExt}.webp`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Image compression failed, storing original: ${message}`,
      );
      return file;
    }
  }
}
