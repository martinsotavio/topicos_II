import db from '../db.js';

const CAMPOS = `
  id, usuario_id AS usuarioId, data, entrada,
  saida_almoco AS saidaAlmoco, retorno_almoco AS retornoAlmoco, saida
`;

const CAMPOS_HISTORICO = `
  data, entrada, saida_almoco AS saidaAlmoco, retorno_almoco AS retornoAlmoco, saida
`;

export function buscarPorUsuarioEData(usuarioId, data) {
  return db.prepare(`SELECT ${CAMPOS} FROM registros_ponto WHERE usuario_id = ? AND data = ?`).get(usuarioId, data);
}

// Cria a linha do dia se ainda não existir, ou atualiza o campo do `tipo` marcado.
export function marcar(usuarioId, data, campo, horario) {
  const existente = db.prepare('SELECT * FROM registros_ponto WHERE usuario_id = ? AND data = ?').get(usuarioId, data);

  if (!existente) {
    db.prepare(`INSERT INTO registros_ponto (usuario_id, data, ${campo}) VALUES (?, ?, ?)`).run(usuarioId, data, horario);
    return { criado: true, registro: buscarPorUsuarioEData(usuarioId, data) };
  }

  db.prepare(`UPDATE registros_ponto SET ${campo} = ? WHERE id = ?`).run(horario, existente.id);
  return { criado: false, registro: buscarPorUsuarioEData(usuarioId, data) };
}

export function buscarPorPeriodo(usuarioId, dataInicio, dataFim) {
  return db.prepare(`
    SELECT ${CAMPOS_HISTORICO} FROM registros_ponto
    WHERE usuario_id = ? AND data BETWEEN ? AND ?
    ORDER BY data ASC
  `).all(usuarioId, dataInicio, dataFim);
}
