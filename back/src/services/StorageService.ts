import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// Crea la carpeta si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class StorageService {
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const extension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return `${BASE_URL}/uploads/${fileName}`;
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return await Promise.all(uploadPromises);
  }

  async deleteImage(url: string): Promise<void> {
  try {
    // Extraer la ruta relativa desde la URL
    // "http://192.168.0.118:3000/uploads/productos/uuid.jpg" → "uploads/productos/uuid.jpg"
    const urlPath = new URL(url).pathname; // "/uploads/productos/uuid.jpg"
    const filePath = path.join(process.cwd(), urlPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Si falla no rompemos el flujo, el producto se elimina igual
  }
}
}


export default new StorageService();