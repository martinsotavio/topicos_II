import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import * as pontoController from '../controllers/pontoController.js';

const router = Router();
router.use(auth);

router.post('/marcar', asyncHandler(pontoController.marcar));
router.get('/hoje', pontoController.hoje);
router.get('/historico', asyncHandler(pontoController.historico));
router.get('/resumo-horas', asyncHandler(pontoController.resumoHoras));

export default router;
