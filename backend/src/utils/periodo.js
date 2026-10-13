import ApiError from '../errors/apiError.js';

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LIMITE_DIAS = 90;

export function validarPeriodo(dataInicio, dataFim) {
  if (!dataInicio || !dataFim || !DATA_REGEX.test(dataInicio) || !DATA_REGEX.test(dataFim)) {
    throw new ApiError(400, 'VALIDATION_ERROR', "Informe 'dataInicio' e 'dataFim' no formato YYYY-MM-DD.");
  }
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (inicio > fim) {
    throw new ApiError(400, 'VALIDATION_ERROR', "'dataInicio' não pode ser depois de 'dataFim'.");
  }
  const diffDias = (fim - inicio) / (1000 * 60 * 60 * 24);
  if (diffDias > LIMITE_DIAS) {
    throw new ApiError(400, 'VALIDATION_ERROR', `O período não pode ser maior que ${LIMITE_DIAS} dias.`);
  }
  return { inicio: dataInicio, fim: dataFim };
}
