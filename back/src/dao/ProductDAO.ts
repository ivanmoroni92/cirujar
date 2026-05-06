import Product, { IProduct } from '../models/Product';

class ProductDAO {
  /**
   * Crea un nuevo producto en la base de datos
   */
  async create(productData: any): Promise<IProduct> {
    const product = new Product(productData);
    return await product.save();
  }

  /**
   * Obtiene todos los productos
   */
  async findAll(): Promise<IProduct[]> {
    return await Product.find();
  }

  /**
   * Obtiene un producto específico por su ID
   */
  async findById(id: string): Promise<IProduct | null> {
    return await Product.findById(id);
  }

}

export default new ProductDAO();
