function horasEntre(horarioInicio, horarioFim) {
  const [h1, m1, s1] = horarioInicio.split(':').map(Number);
  const [h2, m2, s2] = horarioFim.split(':').map(Number);
  const segundos = (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1);
  return segundos / 3600;
}

export function calcularHorasDoDia(registro, cargaHorariaDiaria) {
  const completo = Boolean(registro?.entrada && registro?.saidaAlmoco && registro?.retornoAlmoco && registro?.saida);
  if (!completo) {
    return { data: registro?.data, horasTrabalhadas: null, horasNormais: 0, horasExtras: 0, completo: false };
  }

  const horasManha = horasEntre(registro.entrada, registro.saidaAlmoco);
  const horasTarde = horasEntre(registro.retornoAlmoco, registro.saida);
  const horasTrabalhadas = horasManha + horasTarde;

  const horasNormais = Math.min(horasTrabalhadas, cargaHorariaDiaria);
  const horasExtras = Math.max(horasTrabalhadas - cargaHorariaDiaria, 0);

  return { data: registro.data, horasTrabalhadas, horasNormais, horasExtras, completo: true };
}

export function calcularResumoPeriodo(registros, cargaHorariaDiaria) {
  const detalhePorDia = registros.map((r) => calcularHorasDoDia(r, cargaHorariaDiaria));

  const arredondar = (n) => Math.round(n * 100) / 100;

  return {
    diasComRegistroCompleto: detalhePorDia.filter((d) => d.completo).length,
    diasIncompletos: detalhePorDia.filter((d) => !d.completo).length,
    totalHorasNormais: arredondar(detalhePorDia.reduce((soma, d) => soma + d.horasNormais, 0)),
    totalHorasExtras: arredondar(detalhePorDia.reduce((soma, d) => soma + d.horasExtras, 0)),
    detalhePorDia: detalhePorDia.map((d) => ({
      ...d,
      horasTrabalhadas: d.horasTrabalhadas === null ? null : arredondar(d.horasTrabalhadas),
      horasNormais: arredondar(d.horasNormais),
      horasExtras: arredondar(d.horasExtras),
    })),
  };
}
