import * as bonusModel from '../models/bonusModel.js';
import * as usuarioModel from '../models/usuarioModel.js';
import ApiError from '../errors/apiError.js';

export function criar(req, res) {
  const usuarioId = Number(req.params.id);
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  const { descricao, tipo, valorFixo, percentual, salarioBaseCalculo } = req.body;

  if (!descricao) {
    throw new ApiError(400, 'VALIDATION_ERROR', "'descricao' é obrigatória.");
  }
  if (tipo === 'FIXO') {
    if (typeof valorFixo !== 'number' || valorFixo <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', "Bônus 'FIXO' exige 'valorFixo' numérico maior que zero.");
    }
  } else if (tipo === 'PERCENTUAL') {
    if (typeof percentual !== 'number' || percentual <= 0 || typeof salarioBaseCalculo !== 'number' || salarioBaseCalculo <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', "Bônus 'PERCENTUAL' exige 'percentual' e 'salarioBaseCalculo' numéricos maiores que zero.");
    }
  } else {
    throw new ApiError(400, 'VALIDATION_ERROR', "'tipo' deve ser 'FIXO' ou 'PERCENTUAL'.");
  }

  const bonus = bonusModel.criar({ usuarioId, descricao, tipo, valorFixo, percentual, salarioBaseCalculo });
  res.status(201).json(bonus);
}

export function listar(req, res) {
  const usuarioId = Number(req.params.id);
  if (req.usuario.role !== 'ADMIN' && req.usuario.sub !== usuarioId) {
    throw new ApiError(403, 'FORBIDDEN', 'Você só pode consultar os próprios bônus.');
  }
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }
  res.json(bonusModel.listarPorUsuario(usuarioId));
}
