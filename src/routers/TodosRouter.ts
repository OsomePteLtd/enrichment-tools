import { Router } from 'express';
import TodosController from '../controllers/TodosController';

const router = Router();
const todosController = new TodosController();

router.get('/', todosController.get);
router.get('/coverage', todosController.coverage);
router.get('/ner', todosController.nerCoverage);
router.post('/ner-batch', todosController.nerBatch);
router.get('/ocbc', todosController.ocbc);
router.get('/dbs', todosController.dbs);
router.get('/uob', todosController.uob);
router.get('/hsbc', todosController.hsbc);
router.get('/paypal', todosController.paypal);
router.get('/wise', todosController.transferwise);
router.get('/aspire', todosController.aspire);
router.get('/starling', todosController.starling);

export default router;