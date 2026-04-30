import { Router } from 'express';
import StorageController from '../controllers/StorageController';
import upload from '../middlewares/upload.middleware';

const router = Router();

// POST /api/storage/imagen
router.post('/imagen', upload.single('imagen'), StorageController.uploadOne);

// POST /api/storage/imagenes
router.post('/imagenes', upload.array('imagenes', 10), StorageController.uploadMany);

export default router;
