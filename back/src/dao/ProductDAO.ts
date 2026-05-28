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
  async findAll(includeRetired = false): Promise<IProduct[]> {
    const query = includeRetired ? {} : { estado: { $ne: 'retirado' } };
    return await Product.find(query)
      .populate('usuario', 'alias imagenPerfil')
      .populate('retirado.user', 'alias imagenPerfil')
      .sort({ createdAt: -1 });
  }

  /**
   * Obtiene un producto específico por su ID
   */
  async findById(id: string): Promise<IProduct | null> {
    return await Product.findById(id)
      .populate('usuario', 'alias imagenPerfil')
      .populate('retirado.user', 'alias imagenPerfil');
  }

  /**
   * Actualiza parcialmente un producto por su ID
   */
  async update(id: string, updateData: any): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
  }

  async delete(id: string): Promise<IProduct | null> {
    return await Product.findByIdAndDelete(id);
  }

  async markAsRetirado(id: string, userId: string): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(
      id,
      {
        estado: 'retirado',
        retirado: {
          user: userId,
          at: new Date(),
        },
      },
      { new: true }
    )
      .populate('usuario', 'alias imagenPerfil')
      .populate('retirado.user', 'alias imagenPerfil');
  }

}

export default new ProductDAO();
