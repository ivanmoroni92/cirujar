import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cliente S3 configurado para conectarse al storage de Supabase.
 * Supabase expone una API compatible con S3, por eso usamos el SDK de AWS.
 */
export const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  region: process.env.SUPABASE_REGION ?? 'us-west-2',
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY ?? '',
    secretAccessKey: process.env.SUPABASE_SECRET_KEY ?? '',
  },
  forcePathStyle: true, // Requerido para endpoints custom como Supabase
});

export const BUCKET_NAME = process.env.SUPABASE_BUCKET ?? 'Cirujear';
export const PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL ?? '';
