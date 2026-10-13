import db from '../db.js';

export function existeSobreposicao(usuarioId, periodoInicio, periodoFim) {
  const { total } = db.prepare(`
    SELECT COUNT(*) AS total FROM folhas_pagamento
    WHERE usuario_id = ?
      AND NOT (periodo_fim < ? OR periodo_inicio > ?)
  `).get(usuarioId, periodoInicio, periodoFim);
  return total > 0;
}

export function criar(usuarioId, periodoInicio, periodoFim, resultadoCalculo) {
  const inserirFolha = db.prepare(`
    INSERT INTO folhas_pagamento
      (usuario_id, periodo_inicio, periodo_fim, total_horas_normais, total_horas_extras,
       salario_bruto, total_descontos, total_adicionais, salario_liquido)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const inserirItem = db.prepare(`
    INSERT INTO folha_itens (folha_id, regra_id, tipo, descricao, natureza, valor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Transação: ou grava a folha + todos os itens, ou não grava nada.
  const transacao = db.transaction(() => {
    const info = inserirFolha.run(
      usuarioId, periodoInicio, periodoFim,
      resultadoCalculo.totalHorasNormais, resultadoCalculo.totalHorasExtras,
      resultadoCalculo.salarioBruto, resultadoCalculo.totalDescontos,
      resultadoCalculo.totalAdicionais, resultadoCalculo.salarioLiquido
    );
    const folhaId = info.lastInsertRowid;

    for (const item of resultadoCalculo.descontos) {
      inserirItem.run(folhaId, item.regraId, item.tipo, item.descricao, 'DESCONTO', item.valor);
    }
    for (const item of resultadoCalculo.adicionais) {
      inserirItem.run(folhaId, item.regraId, item.tipo, item.descricao, 'ADICIONAL', item.valor);
    }
    return folhaId;
  });

  const folhaId = transacao();
  return buscarPorId(folhaId);
}

export function buscarPorId(id) {
  return db.prepare(`
    SELECT id, usuario_id AS usuarioId, periodo_inicio AS periodoInicio, periodo_fim AS periodoFim,
           total_horas_normais AS totalHorasNormais, total_horas_extras AS totalHorasExtras,
           salario_bruto AS salarioBruto, total_descontos AS totalDescontos,
           total_adicionais AS totalAdicionais, salario_liquido AS salarioLiquido, gerado_em AS geradoEm
    FROM folhas_pagamento WHERE id = ?
  `).get(id);
}

export function listarPorUsuario(usuarioId) {
  return db.prepare(`
    SELECT id, usuario_id AS usuarioId, periodo_inicio AS periodoInicio, periodo_fim AS periodoFim,
           salario_bruto AS salarioBruto, total_descontos AS totalDescontos,
           total_adicionais AS totalAdicionais, salario_liquido AS salarioLiquido
    FROM folhas_pagamento
    WHERE usuario_id = ?
    ORDER BY periodo_inicio DESC
  `).all(usuarioId);
}

export function buscarItens(folhaId) {
  return db.prepare(`
    SELECT tipo, descricao, natureza, valor
    FROM folha_itens WHERE folha_id = ?
  `).all(folhaId);
}

export function buscarDetalhe(usuarioId, folhaId) {
  const folha = buscarPorId(folhaId);
  if (!folha || folha.usuarioId !== usuarioId) return null;

  const itens = buscarItens(folhaId);
  return {
    ...folha,
    descontos: itens.filter((i) => i.natureza === 'DESCONTO'),
    adicionais: itens.filter((i) => i.natureza === 'ADICIONAL'),
  };
}
