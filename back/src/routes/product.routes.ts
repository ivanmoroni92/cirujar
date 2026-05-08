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

//PATCH /api/products
router.patch('/:id', upload.array('fotosNuevas', 4), ProductController.update);

//DELETE /api/products/:id
router.delete('/:id', ProductController.delete);

export default router;
