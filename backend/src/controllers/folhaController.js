import { calcularFolha } from '../services/calculoFolhaService.js';
import { calcularDsr } from '../services/calculoDsrService.js';
import { validarPeriodo } from '../utils/periodo.js';
import * as usuarioModel from '../models/usuarioModel.js';
import * as folhaPagamentoModel from '../models/folhaPagamentoModel.js';
import ApiError from '../errors/apiError.js';

export function preCalculo(req, res) {
  const usuarioId = Number(req.params.id);
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }
  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);

  const resultado = calcularFolha(usuarioId, inicio, fim);
  res.json({ ...resultado, periodo: { inicio, fim } });
}

export function gerar(req, res) {
  const usuarioId = Number(req.params.id);
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  const { periodoInicio, periodoFim } = req.body;
  const { inicio, fim } = validarPeriodo(periodoInicio, periodoFim);

  if (folhaPagamentoModel.existeSobreposicao(usuarioId, inicio, fim)) {
    throw new ApiError(409, 'PERIOD_OVERLAP', 'Já existe uma folha gerada com período sobreposto para este colaborador.');
  }

  const resultado = calcularFolha(usuarioId, inicio, fim);
  const folha = folhaPagamentoModel.criar(usuarioId, inicio, fim, resultado);
  res.status(201).json(folha);
}

export function listar(req, res) {
  const usuarioId = Number(req.params.id);
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }
  res.json(folhaPagamentoModel.listarPorUsuario(usuarioId));
}

export function detalhe(req, res) {
  const usuarioId = Number(req.params.id);
  const folhaId = Number(req.params.folhaId);

  const folha = folhaPagamentoModel.buscarDetalhe(usuarioId, folhaId);
  if (!folha) {
    throw new ApiError(404, 'NOT_FOUND', 'Folha de pagamento não encontrada.');
  }
  res.json(folha);
}

export function dsr(req, res) {
  const usuarioId = Number(req.params.id);
  const solicitanteEhAdmin = req.usuario.role === 'ADMIN';
  if (!solicitanteEhAdmin && req.usuario.sub !== usuarioId) {
    throw new ApiError(403, 'FORBIDDEN', 'Você só pode consultar o seu próprio DSR.');
  }
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);
  const { salarioBrutoExtra } = calcularFolha(usuarioId, inicio, fim);
  const { diasUteis, diasDescanso, valorDsr } = calcularDsr(salarioBrutoExtra, inicio, fim);

  res.json({
    usuarioId,
    periodo: { inicio, fim },
    salarioBrutoExtra,
    diasUteis,
    diasDescanso,
    valorDsr,
  });
}
