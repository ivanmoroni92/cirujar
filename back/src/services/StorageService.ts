import fs from 'fs';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { BUCKET_NAME, PUBLIC_URL, s3Client } from '../config/storage';

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Uploads images to Supabase Storage (S3-compatible).
 * Works from Expo Go without depending on the machine's LAN IP.
 */
class StorageService {
  async uploadImage(file: UploadedImageFile): Promise<string> {
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

      const urlPath = new URL(url).pathname;
      const filePath = path.join(process.cwd(), urlPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Do not break the main flow if cleanup fails.
    }
  }
}

export default new StorageService();
