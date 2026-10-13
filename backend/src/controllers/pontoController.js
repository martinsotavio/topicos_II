import * as registroPontoModel from '../models/registroPontoModel.js';
import * as usuarioModel from '../models/usuarioModel.js';
import ApiError from '../errors/apiError.js';
import { validarPeriodo } from '../utils/periodo.js';
import { calcularResumoPeriodo } from '../services/calculoHorasService.js';

const SEQUENCIA = ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA'];
const COLUNA_POR_TIPO = {
  ENTRADA: 'entrada',
  SAIDA_ALMOCO: 'saida_almoco',
  RETORNO_ALMOCO: 'retorno_almoco',
  SAIDA: 'saida',
};

function agora() {
  const now = new Date();
  const data = now.toISOString().slice(0, 10); // YYYY-MM-DD (ajuste de fuso fica a seu critério)
  const horario = now.toTimeString().slice(0, 8); // HH:mm:ss
  return { data, horario };
}

function colunaEmCamelCase(coluna) {
  // 'saida_almoco' -> 'saidaAlmoco', para bater com os aliases do SELECT do model
  return coluna.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
}

export function marcar(req, res) {
  const { tipo } = req.body;
  if (!SEQUENCIA.includes(tipo)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `'tipo' deve ser um de: ${SEQUENCIA.join(', ')}.`);
  }

  const usuarioId = req.usuario.sub;
  const { data, horario } = agora();
  const registroAtual = registroPontoModel.buscarPorUsuarioEData(usuarioId, data);

  const indiceTipo = SEQUENCIA.indexOf(tipo);
  const colunaCorrespondente = COLUNA_POR_TIPO[tipo];

  // já marcado hoje?
  if (registroAtual && registroAtual[colunaEmCamelCase(colunaCorrespondente)]) {
    throw new ApiError(409, 'ALREADY_MARKED', `O tipo '${tipo}' já foi marcado hoje.`);
  }

  // fora de ordem? o tipo anterior da sequência precisa já estar preenchido
  if (indiceTipo > 0) {
    const tipoAnterior = SEQUENCIA[indiceTipo - 1];
    const colunaAnterior = colunaEmCamelCase(COLUNA_POR_TIPO[tipoAnterior]);
    if (!registroAtual || !registroAtual[colunaAnterior]) {
      throw new ApiError(409, 'OUT_OF_ORDER', `É preciso marcar '${tipoAnterior}' antes de '${tipo}'.`);
    }
  }

  const { criado, registro } = registroPontoModel.marcar(usuarioId, data, colunaCorrespondente, horario);
  res.status(criado ? 201 : 200).json(registro);
}

export function hoje(req, res) {
  const usuarioId = req.usuario.sub;
  const dataHoje = new Date().toISOString().slice(0, 10);
  const registro = registroPontoModel.buscarPorUsuarioEData(usuarioId, dataHoje);
  res.json(registro ?? null);
}

export function historico(req, res) {
  const usuarioId = req.usuario.sub;
  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);

  res.json({
    usuarioId,
    periodo: { inicio, fim },
    registros: registroPontoModel.buscarPorPeriodo(usuarioId, inicio, fim),
  });
}

export function historicoAdmin(req, res) {
  const usuarioId = Number(req.params.id);
  if (!usuarioModel.buscarPorId(usuarioId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);

  res.json({
    usuarioId,
    periodo: { inicio, fim },
    registros: registroPontoModel.buscarPorPeriodo(usuarioId, inicio, fim),
  });
}

export function resumoHoras(req, res) {
  const usuarioId = req.usuario.sub;
  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);
  const usuario = usuarioModel.buscarPorId(usuarioId);
  const registros = registroPontoModel.buscarPorPeriodo(usuarioId, inicio, fim);

  res.json({
    usuarioId,
    periodo: { inicio, fim },
    ...calcularResumoPeriodo(registros, usuario.cargaHorariaDiaria),
  });
}

export function resumoHorasAdmin(req, res) {
  const usuarioId = Number(req.params.id);
  const usuario = usuarioModel.buscarPorId(usuarioId);
  if (!usuario) throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado.');

  const { inicio, fim } = validarPeriodo(req.query.dataInicio, req.query.dataFim);
  const registros = registroPontoModel.buscarPorPeriodo(usuarioId, inicio, fim);

  res.json({
    usuarioId,
    periodo: { inicio, fim },
    ...calcularResumoPeriodo(registros, usuario.cargaHorariaDiaria),
  });
}
