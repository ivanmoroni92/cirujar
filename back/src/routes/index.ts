import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import storageRoutes from './storage.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/storage', storageRoutes);
router.use('/users', userRoutes);

export default router;
