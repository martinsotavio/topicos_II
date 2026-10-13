export const obrigatorio = (campo) => (dados) => {
  if (!dados[campo]) return `O campo '${campo}' é obrigatório.`;
};

export function validar(dados, regras) {
  for (const regra of regras) {
    const erro = regra(dados);
    if (erro) return erro;
  }
  return null;
}
