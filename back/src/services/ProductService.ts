import ProductDAO from '../dao/ProductDAO';

class ProductService {
  async createProduct(productData: any) {
    return await ProductDAO.create(productData);
  }

  async getAllProducts() {
    return await ProductDAO.findAll();
  }

}

export default new ProductService();
