export function calcularFerias({ valorHora, cargaHorariaDiaria, diasFerias }) {
  const arredondar = (n) => Math.round(n * 100) / 100;

  const salarioBase = valorHora * cargaHorariaDiaria * diasFerias;
  const adicionalUmTerco = salarioBase / 3;
  const valorFerias = salarioBase + adicionalUmTerco;

  return {
    valorHora,
    salarioBase: arredondar(salarioBase),
    adicionalUmTerco: arredondar(adicionalUmTerco),
    valorFerias: arredondar(valorFerias),
  };
}
