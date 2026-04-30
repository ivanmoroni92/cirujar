import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import upload from '../middlewares/upload.middleware';

const router = Router();

// POST /api/products 
router.post('/', upload.array('fotos', 3), ProductController.create);

// GET /api/products
router.get('/', ProductController.getAll);

export default router;
