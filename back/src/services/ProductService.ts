import ProductDAO from '../dao/ProductDAO';
import StorageService from './StorageService';

class ProductService {
  /**
   * Crea un producto: primero sube las imágenes a Supabase,
   * luego guarda el producto en MongoDB con las URLs resultantes.
   */
  async createProduct(
    productData: {
      titulo: string;
      ubicacion?: { type: 'Point'; coordinates: [number, number] };
      ubicacionTexto?: string;
      detalles?: string;
    },
    imageFiles: Express.Multer.File[] = []
  ) {
    // 1. Subir imágenes y obtener URLs públicas
    const fotos = imageFiles.length > 0
      ? await StorageService.uploadImages(imageFiles)
      : [];

    // 2. Persistir el producto con las URLs ya resueltas
    return await ProductDAO.create({ ...productData, fotos });
  }

  async getAllProducts() {
    return await ProductDAO.findAll();
  }
}

export default new ProductService();
