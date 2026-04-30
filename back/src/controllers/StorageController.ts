import { Request, Response } from 'express';
import StorageService from '../services/StorageService';

class StorageController {
  /**
   * Sube una sola imagen y devuelve su URL pública.
   * Espera un campo de formulario llamado "imagen"
   */
  async uploadOne(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se recibió ningún archivo' });
        return;
      }

      const url = await StorageService.uploadImage(req.file);
      res.status(201).json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Sube múltiples imágenes y devuelve un array con las URLs públicas.
   * Espera un campo de formulario llamado "imagenes" (hasta 10 archivos)
   */
  async uploadMany(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No se recibieron archivos' });
        return;
      }

      const urls = await StorageService.uploadImages(files);
      res.status(201).json({ urls });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new StorageController();
