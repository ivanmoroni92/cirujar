import { Request, Response } from 'express';
import ProductService from '../services/ProductService';

class ProductController {
  /**
   * Crea un nuevo producto (y la colección si no existe)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Obtiene todos los productos
   */
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
