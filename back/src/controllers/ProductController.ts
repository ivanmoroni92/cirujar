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
}

export default new ProductController();
