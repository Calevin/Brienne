import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

// RNF-02: todo acceso a la API de categorias exige identidad autenticada
router.use(requireAuth);

router.get('/', getCategories);
router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
