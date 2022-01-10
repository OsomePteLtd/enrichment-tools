import { Router } from 'express';
import TodosController from '../controllers/TodosController';

const router = Router();
const todosController = new TodosController();

router.get('/', todosController.get);
router.get('/escape', todosController.escape);

export default router;