function contarDiasPorTipo(dataInicioStr, dataFimStr) {
  let diasUteis = 0;
  let diasDescanso = 0;

  const atual = new Date(`${dataInicioStr}T00:00:00`);
  const fim = new Date(`${dataFimStr}T00:00:00`);

  while (atual <= fim) {
    const diaDaSemana = atual.getDay(); // 0 = domingo
    if (diaDaSemana === 0) diasDescanso += 1;
    else diasUteis += 1;
    atual.setDate(atual.getDate() + 1);
  }

  return { diasUteis, diasDescanso };
}

export function calcularDsr(salarioBrutoExtra, dataInicio, dataFim) {
  const { diasUteis, diasDescanso } = contarDiasPorTipo(dataInicio, dataFim);

  if (salarioBrutoExtra === 0 || diasUteis === 0) {
    return { diasUteis, diasDescanso, valorDsr: 0 };
  }

  const valorDsr = Math.round(((salarioBrutoExtra / diasUteis) * diasDescanso) * 100) / 100;
  return { diasUteis, diasDescanso, valorDsr };
}
