import { Router } from 'express';
import { getTasks, createTask, updateTask } from '../controllers/task.controller';

const router = Router();

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);

export default router;
