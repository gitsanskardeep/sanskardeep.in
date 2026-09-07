// Cloudflare R2 Storage Helper Utility for Sanskar Deep

type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
type R2Object = import('@cloudflare/workers-types').R2Object;

export interface UploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
}

export class StorageService {
  constructor(private bucket: R2Bucket) {}

  /**
   * Uploads a file buffer or stream to Cloudflare R2 bucket under a given key.
   */
  async uploadFile(key: string, data: ReadableStream | ArrayBuffer | string, options: UploadOptions = {}): Promise<R2Object> {
    const httpMetadata: Record<string, string> = {};
    if (options.contentType) {
      httpMetadata.contentType = options.contentType;
    }

    return await this.bucket.put(key, data, {
      httpMetadata,
      customMetadata: options.customMetadata
    });
  }

  /**
   * Retrieves a file object from Cloudflare R2 bucket by key.
   */
  async getFile(key: string) {
    return await this.bucket.get(key);
  }

  /**
   * Deletes a file object from Cloudflare R2 bucket by key.
   */
  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
