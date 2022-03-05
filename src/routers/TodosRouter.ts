import { Router } from 'express';
import TodosController from '../controllers/TodosController';

const router = Router();
const todosController = new TodosController();

router.get('/', todosController.get);
router.get('/coverage', todosController.coverage);
router.get('/ocbc', todosController.ocbc);
router.get('/dbs', todosController.dbs);
router.get('/uob', todosController.uob);
router.get('/hsbc', todosController.hsbc);

export default router;