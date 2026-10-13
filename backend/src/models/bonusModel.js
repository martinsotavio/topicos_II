import db from '../db.js';

const CAMPOS = `
  id, usuario_id AS usuarioId, descricao, tipo, percentual,
  salario_base_calculo AS salarioBaseCalculo, valor_calculado AS valorCalculado,
  concedido_em AS concedidoEm
`;

export function criar({ usuarioId, descricao, tipo, valorFixo, percentual, salarioBaseCalculo }) {
  const valorCalculado = tipo === 'FIXO' ? valorFixo : percentual * salarioBaseCalculo;

  const info = db.prepare(`
    INSERT INTO bonus (usuario_id, descricao, tipo, percentual, salario_base_calculo, valor_calculado)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuarioId, descricao, tipo, percentual ?? null, salarioBaseCalculo ?? null, Math.round(valorCalculado * 100) / 100);

  return buscarPorId(info.lastInsertRowid);
}

export function buscarPorId(id) {
  return db.prepare(`SELECT ${CAMPOS} FROM bonus WHERE id = ?`).get(id);
}

export function listarPorUsuario(usuarioId) {
  return db.prepare(`SELECT ${CAMPOS} FROM bonus WHERE usuario_id = ? ORDER BY concedido_em DESC`).all(usuarioId);
}
