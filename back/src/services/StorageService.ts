import fs from 'fs';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { readDevConfig } from '../config/readDevConfig';
import { BUCKET_NAME, PUBLIC_URL, s3Client } from '../config/storage';
import {
  resolveLocalUploadPath,
  saveUploadedFileToLocalUploads,
} from '../utils/localImageStorage';

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Stores images on local disk when USE_LOCAL_DB is true, otherwise Supabase S3.
 */
class StorageService {
  private useLocalDisk(): boolean {
    return readDevConfig().useLocalDb;
  }

  async uploadImage(file: UploadedImageFile): Promise<string> {
    if (this.useLocalDisk()) {
      return saveUploadedFileToLocalUploads(file.buffer, file.originalname);
    }

    const extension = file.originalname.split('.').pop() ?? 'jpg';
    const fileName = `productos/${uuidv4()}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `${PUBLIC_URL}/${BUCKET_NAME}/${fileName}`;
  }

  async uploadImages(files: UploadedImageFile[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }

  async deleteImage(url: string): Promise<void> {
    try {
      const supabasePrefix = `${PUBLIC_URL}/${BUCKET_NAME}/`;
      if (url.startsWith(supabasePrefix)) {
        const key = url.slice(supabasePrefix.length);
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          })
        );
        return;
      }

      const localPath = resolveLocalUploadPath(url);
      if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch {
      // Do not break the main flow if cleanup fails.
    }
  }
}

export default new StorageService();
