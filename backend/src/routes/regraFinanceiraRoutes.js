import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/permitir.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import * as regraFinanceiraController from '../controllers/regraFinanceiraController.js';

const router = Router();
router.use(auth);

router.post('/', permitir('ADMIN'), asyncHandler(regraFinanceiraController.criar));
router.get('/', regraFinanceiraController.listar); // ADMIN e EMPLOYEE — visibilidade tratada no controller
router.patch('/:id', permitir('ADMIN'), asyncHandler(regraFinanceiraController.atualizarParcial));
router.delete('/:id', permitir('ADMIN'), asyncHandler(regraFinanceiraController.remover));

export default router;
