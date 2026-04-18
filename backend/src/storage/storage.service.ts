import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export interface UploadResult {
    key: string;
    url: string;
    size: number;
    contentType: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly client: S3Client | null = null;
    private readonly bucket: string;
    private readonly endpoint: string;
    private readonly publicBaseUrl: string;
    private readonly initialized: boolean;

    constructor(private readonly config: ConfigService) {
        const accessKeyId = config.get<string>('YC_ACCESS_KEY_ID');
        const secretAccessKey = config.get<string>('YC_SECRET_ACCESS_KEY');
        this.bucket = config.get<string>('YC_BUCKET', '');
        this.endpoint = config.get<string>('YC_ENDPOINT', 'https://storage.yandexcloud.net');
        const region = config.get<string>('YC_REGION', 'ru-central1');

        if (!accessKeyId || !secretAccessKey || !this.bucket) {
            this.logger.warn(
                'Yandex Object Storage не настроен — загрузка файлов в S3 недоступна. ' +
                'Задайте YC_ACCESS_KEY_ID, YC_SECRET_ACCESS_KEY, YC_BUCKET в .env',
            );
            this.initialized = false;
            return;
        }

        this.client = new S3Client({
            endpoint: this.endpoint,
            region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: false,
        });
        this.publicBaseUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`;
        this.initialized = true;
        this.logger.log(`Storage initialized. Bucket: ${this.bucket}, endpoint: ${this.endpoint}`);
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async upload(
        buffer: Buffer,
        originalName: string,
        contentType: string,
        prefix = 'objects',
    ): Promise<UploadResult> {
        if (!this.initialized || !this.client) {
            throw new ServiceUnavailableException('Object storage is not configured');
        }

        const ext = this.extractExtension(originalName);
        const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                ACL: 'public-read',
            }),
        );

        return {
            key,
            url: `${this.publicBaseUrl}/${key}`,
            size: buffer.length,
            contentType,
        };
    }

    async delete(key: string): Promise<void> {
        if (!this.initialized || !this.client) return;
        await this.client.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        );
    }

    async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        if (!this.initialized || !this.client) {
            throw new ServiceUnavailableException('Object storage is not configured');
        }
        return getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: this.bucket, Key: key }),
            { expiresIn: expiresInSeconds },
        );
    }

    private extractExtension(filename: string): string {
        const dot = filename.lastIndexOf('.');
        if (dot <= 0) return '';
        const ext = filename.slice(dot).toLowerCase();
        if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return '';
        return ext;
    }
}
