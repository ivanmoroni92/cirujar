import { Router } from 'express';
import ProductController from '../controllers/ProductController';

const router = Router();

// POST /api/product
router.post('/', ProductController.create);

// GET /api/product
router.get('/', ProductController.getAll);


export default router;
