import * as usuarioModel from '../models/usuarioModel.js';
import * as registroPontoModel from '../models/registroPontoModel.js';
import * as regraFinanceiraModel from '../models/regraFinanceiraModel.js';
import { calcularResumoPeriodo } from './calculoHorasService.js';

const arredondar = (n) => Math.round(n * 100) / 100;

export function calcularFolha(usuarioId, dataInicio, dataFim) {
  const usuario = usuarioModel.buscarPorId(usuarioId);
  if (!usuario) return null;

  const registros = registroPontoModel.buscarPorPeriodo(usuarioId, dataInicio, dataFim);
  const { totalHorasNormais, totalHorasExtras } = calcularResumoPeriodo(registros, usuario.cargaHorariaDiaria);

  const salarioBrutoNormal = totalHorasNormais * usuario.valorHora;
  const salarioBrutoExtra = totalHorasExtras * usuario.valorHora * 1.5;
  const salarioBruto = salarioBrutoNormal + salarioBrutoExtra;

  const regrasAtivas = regraFinanceiraModel.listar({ ativo: true });
  const descontos = [];
  const adicionais = [];

  for (const regra of regrasAtivas) {
    const valor = regra.valorFixo !== null ? regra.valorFixo : salarioBruto * regra.percentual;
    const item = { regraId: regra.id, tipo: regra.tipo, descricao: regra.descricao, valor: arredondar(valor) };
    if (regra.natureza === 'DESCONTO') descontos.push(item);
    else adicionais.push(item);
  }

  const totalDescontos = arredondar(descontos.reduce((s, d) => s + d.valor, 0));
  const totalAdicionais = arredondar(adicionais.reduce((s, a) => s + a.valor, 0));
  const salarioLiquido = arredondar(salarioBruto - totalDescontos + totalAdicionais);

  return {
    usuarioId,
    valorHora: usuario.valorHora,
    totalHorasNormais,
    totalHorasExtras,
    salarioBrutoNormal: arredondar(salarioBrutoNormal),
    salarioBrutoExtra: arredondar(salarioBrutoExtra),
    salarioBruto: arredondar(salarioBruto),
    descontos,
    adicionais,
    totalDescontos,
    totalAdicionais,
    salarioLiquido,
  };
}
