import { Router } from 'express';
import productRoutes from './product.routes';
import storageRoutes from './storage.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/storage', storageRoutes);

export default router;
