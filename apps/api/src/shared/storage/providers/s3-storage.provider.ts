import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  IStorageProvider,
  UploadResult,
} from '../interfaces/storage-provider.interface';
import { ConfigService } from '@nestjs/config';
import { buildKey } from '../../../common/utils/build-key.util';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('storage.s3.bucket') || '';
    this.region = config.get<string>('storage.s3.region') || 'us-east-1';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('storage.s3.accessKeyId') || '',
        secretAccessKey: config.get<string>('storage.s3.secretAccessKey') || '',
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    const key = buildKey(file.originalname, folder);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return {
      key,
      url: await this.getUrl(key),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }

  // Permanent, unsigned URL — only valid for keys under a prefix the bucket
  // policy grants public read to (e.g. company-logos/, job-images/). Never
  // use this for private documents; use getUrl() for those instead.
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
