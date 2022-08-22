import { Router } from 'express';
import TodosController from '../controllers/TodosController';

const router = Router();
const todosController = new TodosController();

router.get('/', todosController.get);
router.get('/coverage', todosController.coverage);
router.get('/ner', todosController.nerCoverage);
router.post('/ner-batch', todosController.nerBatch);
router.get('/ner-compare', todosController.nerCompare);
router.get('/ocbc', todosController.ocbc);
router.get('/dbs', todosController.dbs);
router.get('/uob', todosController.uob);
router.get('/hsbc', todosController.hsbc);
router.get('/paypal', todosController.paypal);
router.get('/wise', todosController.transferwise);
router.get('/aspire', todosController.aspire);
router.get('/starling', todosController.starling);
router.get('/neat', todosController.neat);
router.get('/aho', todosController.aho);
router.get('/knapsack', todosController.knapsack);

export default router;