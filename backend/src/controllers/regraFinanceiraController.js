import * as regraFinanceiraModel from '../models/regraFinanceiraModel.js';
import ApiError from '../errors/apiError.js';

const TIPOS_VALIDOS = ['FALTA', 'ATRASO', 'VALE_TRANSPORTE', 'VALE_REFEICAO', 'IMPOSTO', 'OUTRO'];
const NATUREZAS_VALIDAS = ['DESCONTO', 'ADICIONAL'];

export function criar(req, res) {
  const { tipo, descricao, natureza, percentual, valorFixo } = req.body;

  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `'tipo' deve ser um de: ${TIPOS_VALIDOS.join(', ')}.`);
  }
  if (!NATUREZAS_VALIDAS.includes(natureza)) {
    throw new ApiError(400, 'VALIDATION_ERROR', "'natureza' deve ser 'DESCONTO' ou 'ADICIONAL'.");
  }
  if (!descricao) {
    throw new ApiError(400, 'VALIDATION_ERROR', "'descricao' é obrigatória.");
  }
  const temPercentual = percentual !== undefined && percentual !== null;
  const temValorFixo = valorFixo !== undefined && valorFixo !== null;
  if (temPercentual === temValorFixo) {
    throw new ApiError(400, 'VALIDATION_ERROR', "Informe 'percentual' OU 'valorFixo', nunca os dois nem nenhum.");
  }

  const regra = regraFinanceiraModel.criar({ tipo, descricao, natureza, percentual, valorFixo });
  res.status(201).json(regra);
}

export function listar(req, res) {
  const { natureza, tipo } = req.query;
  const souAdmin = req.usuario.role === 'ADMIN';

  // EMPLOYEE só vê regras ativas, mesmo que tente forçar ?ativo=false na query.
  const ativo = souAdmin
    ? (req.query.ativo === undefined ? undefined : req.query.ativo === 'true')
    : true;

  res.json(regraFinanceiraModel.listar({ natureza, tipo, ativo }));
}

export function atualizarParcial(req, res) {
  const id = Number(req.params.id);
  const { percentual, valorFixo } = req.body;

  if (!regraFinanceiraModel.buscarPorId(id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Regra financeira não encontrada.');
  }
  const temPercentual = percentual !== undefined;
  const temValorFixo = valorFixo !== undefined;
  if (temPercentual && temValorFixo) {
    throw new ApiError(400, 'VALIDATION_ERROR', "Não envie 'percentual' e 'valorFixo' no mesmo PATCH.");
  }

  res.json(regraFinanceiraModel.atualizarParcial(id, req.body));
}

export function remover(req, res) {
  const id = Number(req.params.id);
  if (!regraFinanceiraModel.buscarPorId(id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Regra financeira não encontrada.');
  }
  if (regraFinanceiraModel.estaUsadaEmAlgumaFolha(id)) {
    throw new ApiError(409, 'RULE_IN_USE', 'Esta regra já foi usada em alguma folha gerada. Desative-a em vez de remover.');
  }
  regraFinanceiraModel.remover(id);
  res.status(204).send();
}
