import { Router } from 'express';
import StorageController from '../controllers/StorageController';
import upload from '../middlewares/upload.middleware';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/storage/imagen
router.post('/imagen', requireAuth, upload.single('imagen'), StorageController.uploadOne);

// POST /api/storage/imagenes
router.post('/imagenes', requireAuth, upload.array('imagenes', 10), StorageController.uploadMany);

export default router;
