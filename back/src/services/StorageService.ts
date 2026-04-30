import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME, PUBLIC_URL } from '../config/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio responsable de interactuar con el storage de Supabase (S3).
*/

class StorageService {
  /**
   * Sube un archivo al bucket de Supabase y retorna la URL pública.
   * @param file - El archivo recibido por multer (en memoria)
   * @returns La URL pública del archivo subido
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {

    const extension = file.originalname.split('.').pop();
    const fileName = `productos/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);


    return `${PUBLIC_URL}/${BUCKET_NAME}/${fileName}`;
  }

  /**
   * Sube múltiples archivos en paralelo y retorna todas las URLs.
   * @param files - Array de archivos recibidos por multer
   * @returns Array de URLs públicas
   */
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return await Promise.all(uploadPromises);
  }
}

export default new StorageService();
