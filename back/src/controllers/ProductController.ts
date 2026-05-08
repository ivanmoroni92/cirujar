import { Request, Response } from 'express';
import ProductService from '../services/ProductService';

/**
 * multipart/form-data:
 * - `ubicacion` JSON → GeoJSON Point: {"type":"Point","coordinates":[lng,lat]}
 * - `ubicacion` plain text → stored as ubicacionTexto
 * - `ubicacionTexto` → optional explicit text field (can combine with Geo JSON in ubicacion)
 */
function parseUbicacionFields(body: Record<string, string | undefined>): {
  ubicacion?: { type: 'Point'; coordinates: [number, number] };
  ubicacionTexto?: string;
} {
  const explicitText =
    typeof body.ubicacionTexto === 'string' ? body.ubicacionTexto.trim() : '';

  //parseo de latitud y longitud
  if (body.latitud && body.longitud) {
    const lat = parseFloat(body.latitud);
    const lng = parseFloat(body.longitud);

    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        ubicacion: { type: 'Point', coordinates: [lng, lat] },
        ...(explicitText ? { ubicacionTexto: explicitText } : {}),
      };
    }
  }

  const raw = body.ubicacion;
  if (raw === undefined || raw === '') {
    return explicitText ? { ubicacionTexto: explicitText } : {};
  }

  const trimmed = typeof raw === 'string' ? raw.trim() : String(raw);

  if (trimmed.startsWith('{')) {
    const ubicacion = JSON.parse(trimmed) as {
      type: 'Point';
      coordinates: [number, number];
    };
    return {
      ubicacion,
      ...(explicitText ? { ubicacionTexto: explicitText } : {}),
    };
  }

  const text = explicitText || trimmed;
  return text ? { ubicacionTexto: text } : {};
}

class ProductController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { titulo, detalles } = req.body;

      const { ubicacion, ubicacionTexto } = parseUbicacionFields(
        req.body as Record<string, string | undefined>
      );

      const imageFiles = req.files as Express.Multer.File[] ?? [];

      const product = await ProductService.createProduct(
        { titulo, ubicacion, ubicacionTexto, detalles },
        imageFiles
      );

      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const products = await ProductService.getAllProducts();
      res.status(200).json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const product = await ProductService.getProductById(id);

      if (!product) {
        res.status(404).json({ error: 'Producto no encontrado' });
        return;
      }

      res.status(200).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { titulo, detalles, fotosMantenidas } = req.body;
      const newFiles = req.files as Express.Multer.File[] ?? [];

      // Como viene de FormData, fotosMantenidas puede llegar como string JSON
      let arrayFotosMantenidas: string[] = [];
      if (fotosMantenidas) {
        try {
          arrayFotosMantenidas = JSON.parse(fotosMantenidas);
        } catch (e) {
          arrayFotosMantenidas = Array.isArray(fotosMantenidas) ? fotosMantenidas : [fotosMantenidas];
        }
      }


      const updatedProduct = await ProductService.updateProduct(
          id,
          { titulo, detalles },
          arrayFotosMantenidas,
          newFiles
      );

      if (!updatedProduct) {
        res.status(404).json({ error: 'Producto no encontrado' });
        return;
      }

      res.status(200).json(updatedProduct);

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await ProductService.deleteProduct(id);

      res.status(200).json({ message: 'Publicación eliminada correctamente.' });
    } catch (error: any) {
      const statusCode = error.message === 'El producto no existe.' ? 404 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  }
}

export default new ProductController();
