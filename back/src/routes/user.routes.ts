import { Router } from 'express';
import UserController from '../controllers/UserController';
import { requireAuthSelf } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', UserController.create);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.patch('/:id', requireAuthSelf, UserController.update);

export default router;
