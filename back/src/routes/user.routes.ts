import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();

router.post('/', UserController.create);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.patch('/:id', UserController.update);

export default router;
