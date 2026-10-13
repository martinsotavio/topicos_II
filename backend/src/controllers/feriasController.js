import { calcularFerias } from '../services/calculoFeriasService.js';
import * as usuarioModel from '../models/usuarioModel.js';
import ApiError from '../errors/apiError.js';

export function calcular(req, res) {
  const usuarioId = Number(req.params.id);
  const usuario = usuarioModel.buscarPorId(usuarioId);
  if (!usuario) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  const { diasFerias } = req.body;
  if (!Number.isInteger(diasFerias) || diasFerias < 1 || diasFerias > 30) {
    throw new ApiError(400, 'VALIDATION_ERROR', "'diasFerias' deve ser um inteiro entre 1 e 30.");
  }

  const resultado = calcularFerias({
    valorHora: usuario.valorHora,
    cargaHorariaDiaria: usuario.cargaHorariaDiaria,
    diasFerias,
  });

  res.json({ usuarioId, diasFerias, ...resultado });
}
