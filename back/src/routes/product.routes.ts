import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import upload from '../middlewares/upload.middleware';

const router = Router();

// POST /api/products 
router.post('/', upload.array('fotos', 4), ProductController.create);

// GET /api/products
router.get('/', ProductController.getAll);

//GET /api/products/:id
router.get('/:id', ProductController.getById);

export default router;
