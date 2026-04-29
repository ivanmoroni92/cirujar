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

}

export default new ProductDAO();
