import { Request, Response } from 'express';
import ProductService from '../services/ProductService';

class ProductController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { titulo, detalles } = req.body;

      // ubicacion llega como string JSON en multipart/form-data → parsear
      const ubicacion = req.body.ubicacion
        ? JSON.parse(req.body.ubicacion)
        : undefined;

      const imageFiles = req.files as Express.Multer.File[] ?? [];

      const product = await ProductService.createProduct(
        { titulo, ubicacion, detalles },
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
