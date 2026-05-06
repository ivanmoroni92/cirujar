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

  async getProductById(id: string) {
      return await ProductDAO.findById(id);
  }

  async updateProduct(
      id: string,
      data: { titulo?: string; detalles?: string },
      fotosExistentes: string[],
      newImageFiles: Express.Multer.File[] = []
  ) {
      // Debe existir al menos una imagen siempre
      if (fotosExistentes.length === 0 && newImageFiles.length === 0) {
          throw new Error('La publicación debe tener al menos una imagen.');
      }

      // Se suben las fotos a supabase
      let nuevasFotosUrls: string[] = [];
      if (newImageFiles.length > 0) {
          nuevasFotosUrls = await StorageService.uploadImages(newImageFiles);
      }

      // Se juntan fotos viejas y nuevas
      const fotosFinales = [...fotosExistentes, ...nuevasFotosUrls];

      // Se arma el paquete para la BD ignorando ubicacion
      const updatePayload: any = {
          fotos: fotosFinales
      };

      if (data.titulo) updatePayload.titulo = data.titulo;
      if (data.detalles) updatePayload.detalles = data.detalles;

      return await ProductDAO.update(id, updatePayload);
    }
}

export default new ProductService();
