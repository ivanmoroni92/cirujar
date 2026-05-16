import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import upload from '../middlewares/upload.middleware';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/products 
router.post('/', requireAuth, upload.array('fotos', 4), ProductController.create);

// GET /api/products
router.get('/', ProductController.getAll);

//GET /api/products/:id
router.get('/:id', ProductController.getById);

//PATCH /api/products
router.patch('/:id', requireAuth, upload.array('fotosNuevas', 4), ProductController.update);

//DELETE /api/products/:id
router.delete('/:id', requireAuth, ProductController.delete);

export default router;
