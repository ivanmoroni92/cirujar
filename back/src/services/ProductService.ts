import ProductDAO from '../dao/ProductDAO';
import StorageService from './StorageService';

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'CirujaApp/1.0',
      },
    });
    if (!res.ok) return undefined;

    const data = await res.json() as { address?: Record<string, string> };
    const addr = data?.address;
    if (!addr) return undefined;

    const localidad =
      addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.municipality ?? '';
    const provincia = addr.state ?? '';

    if (localidad && provincia) return `${provincia}, ${localidad}`;
    if (provincia) return provincia;
    if (localidad) return localidad;
    return undefined;
  } catch {
    return undefined;
  }
}

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
    const fotos = imageFiles.length > 0
      ? await StorageService.uploadImages(imageFiles)
      : [];

    let ubicacionTexto = productData.ubicacionTexto;
    if (!ubicacionTexto && productData.ubicacion?.coordinates) {
      const [lng, lat] = productData.ubicacion.coordinates;
      ubicacionTexto = await reverseGeocode(lat, lng);
    }

    const created = await ProductDAO.create({ ...productData, ubicacionTexto, fotos });
    const populated = await ProductDAO.findById(String(created._id));
    if (!populated) {
      throw new Error('No se pudo cargar la publicación creada.');
    }
    return populated;
  }

  async getAllProducts(includeRetired = false) {
    return await ProductDAO.findAll(includeRetired);
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

    return await ProductDAO.markAsRetirado(id, userId);
  }

}

export default new ProductService();
