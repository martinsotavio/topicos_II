import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/permitir.js';
import * as usuarioController from '../controllers/usuarioController.js';
import * as pontoController from '../controllers/pontoController.js';
import * as folhaController from '../controllers/folhaController.js';
import * as feriasController from '../controllers/feriasController.js';
import * as bonusController from '../controllers/bonusController.js';
import ApiError from '../errors/apiError.js';

const router = Router();

router.use(auth); // toda rota abaixo exige token válido

router.get('/', permitir('ADMIN'), usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId); // regra fina fica no controller

router.get('/:id/remuneracao', usuarioController.buscarRemuneracao);
router.patch('/:id/remuneracao', permitir('ADMIN'), asyncHandler(usuarioController.atualizarRemuneracao));

router.get('/:id/ponto/historico', permitir('ADMIN'), asyncHandler(pontoController.historicoAdmin));
router.get('/:id/ponto/resumo-horas', permitir('ADMIN'), asyncHandler(pontoController.resumoHorasAdmin));

router.get('/:id/folha/pre-calculo', permitir('ADMIN'), asyncHandler(folhaController.preCalculo));
router.post('/:id/folha/gerar', permitir('ADMIN'), asyncHandler(folhaController.gerar));

function podeVerFolhasDe(req, usuarioId) {
  return req.usuario.role === 'ADMIN' || req.usuario.sub === usuarioId;
}

router.get('/:id/folhas', (req, res, next) => {
  if (!podeVerFolhasDe(req, Number(req.params.id))) {
    return next(new ApiError(403, 'FORBIDDEN', 'Você só pode consultar as próprias folhas.'));
  }
  next();
}, asyncHandler(folhaController.listar));

router.get('/:id/folhas/:folhaId', (req, res, next) => {
  if (!podeVerFolhasDe(req, Number(req.params.id))) {
    return next(new ApiError(403, 'FORBIDDEN', 'Você só pode consultar as próprias folhas.'));
  }
  next();
}, asyncHandler(folhaController.detalhe));

router.get('/:id/dsr', asyncHandler(folhaController.dsr));

router.post('/:id/ferias/calcular', permitir('ADMIN'), asyncHandler(feriasController.calcular));

router.post('/:id/bonus', permitir('ADMIN'), asyncHandler(bonusController.criar));
router.get('/:id/bonus', asyncHandler(bonusController.listar));

router.put('/:id', permitir('ADMIN'), asyncHandler(usuarioController.substituir));
router.patch('/:id', asyncHandler(usuarioController.atualizarParcial)); // ADMIN ou próprio, validado no controller
router.delete('/:id', permitir('ADMIN'), usuarioController.remover);

export default router;
