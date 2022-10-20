import { Router } from 'express';
import MainController from '../controllers/MainController';

const router = Router();
const mainController = new MainController();

router.get('/', mainController.get);
router.get('/coverage', mainController.coverage);

router.get('/ner', mainController.nerCoverage);
router.post('/ner-batch', mainController.nerBatch);
router.get('/ner-compare', mainController.nerCompare);

router.get('/banks/ocbc', mainController.ocbc);
router.get('/banks/dbs', mainController.dbs);
router.get('/banks/uob', mainController.uob);
router.get('/banks/hsbc', mainController.hsbc);
router.get('/banks/paypal', mainController.paypal);
router.get('/banks/wise', mainController.transferwise);
router.get('/banks/aspire', mainController.aspire);
router.get('/banks/starling', mainController.starling);
router.get('/banks/neat', mainController.neat);

router.get('/global-contacts', mainController.globalContacts);

router.get('/knapsack', mainController.knapsack);

router.get('/references', mainController.references);

export default router;