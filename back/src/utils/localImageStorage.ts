import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { resolveBaseUrl } from '../config/readDevConfig';

const UPLOAD_SUBDIR = 'productos';

export function getLocalUploadsDir(): string {
  return path.join(process.cwd(), 'uploads', UPLOAD_SUBDIR);
}

export function buildLocalImageUrl(fileName: string): string {
  const safeName = path.basename(fileName);
  return `${resolveBaseUrl()}/uploads/${UPLOAD_SUBDIR}/${safeName}`;
}

export function saveBufferToLocalUploads(buffer: Buffer, fileName: string): string {
  const dir = getLocalUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  const safeName = path.basename(fileName);
  fs.writeFileSync(path.join(dir, safeName), buffer);
  return buildLocalImageUrl(safeName);
}

export function saveUploadedFileToLocalUploads(
  buffer: Buffer,
  originalName: string
): string {
  const extension = originalName.split('.').pop() ?? 'jpg';
  const fileName = `${uuidv4()}.${extension}`;
  return saveBufferToLocalUploads(buffer, fileName);
}

export function clearLocalUploadsDir(): void {
  const dir = getLocalUploadsDir();
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function isRemoteImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  if (isLocalImageUrl(trimmed)) {
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function isLocalImageUrl(url: string): boolean {
  try {
    return new URL(url).pathname.includes('/uploads/');
  } catch {
    return false;
  }
}

export function resolveLocalUploadPath(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const marker = '/uploads/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const relative = pathname.slice(markerIndex + marker.length);
    if (!relative || relative.includes('..')) {
      return null;
    }

    return path.join(process.cwd(), 'uploads', ...relative.split('/'));
  } catch {
    return null;
  }
}

export function fileNameFromUrl(url: string): string {
  try {
    const base = path.basename(new URL(url).pathname);
    return base.split('?')[0].split('#')[0] || `${uuidv4()}.jpg`;
  } catch {
    return `${uuidv4()}.jpg`;
  }
}
