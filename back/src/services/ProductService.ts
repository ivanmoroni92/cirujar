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
      usuario: string;
    },
    imageFiles: Express.Multer.File[] = []
  ) {
    // 1. Subir imágenes y obtener URLs públicas
    const fotos = imageFiles.length > 0
      ? await StorageService.uploadImages(imageFiles)
      : [];

    // 2. Persistir el producto con las URLs ya resueltas
    const created = await ProductDAO.create({ ...productData, fotos });
    const populated = await ProductDAO.findById(String(created._id));
    if (!populated) {
      throw new Error('No se pudo cargar la publicación creada.');
    }
    return populated;
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
      if (data.detalles !== undefined) {
        updatePayload.detalles = data.detalles;
      }

      return await ProductDAO.update(id, updatePayload);
    }

  async deleteProduct(id: string) {
      const deletedProduct = await ProductDAO.delete(id);
      if (!deletedProduct) {
          throw new Error('El producto no existe.');
      }
      return deletedProduct;
  }

  async retirarProduct(id: string, userId: string) {
    const product = await ProductDAO.findById(id);
    if (!product) {
      throw new Error('El producto no existe.');
    }

    const ownerId = String(
      typeof product.usuario === 'object' && product.usuario !== null && '_id' in product.usuario
        ? (product.usuario as any)._id
        : product.usuario
    );

    if (ownerId === userId) {
      const err: any = new Error('No podés retirar tu propia publicación.');
      err.statusCode = 403;
      throw err;
    }

    if (product.estado === 'retirado') {
      const err: any = new Error('La publicación ya fue retirada.');
      err.statusCode = 400;
      throw err;
    }

    return await ProductDAO.markAsRetirado(id);
  }

}

export default new ProductService();
