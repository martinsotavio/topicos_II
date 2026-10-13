import db from '../db.js';

const CAMPOS = `
  id, tipo, descricao, natureza, percentual,
  valor_fixo AS valorFixo, CAST(ativo AS INTEGER) AS ativoInt
`;

function formatar(row) {
  if (!row) return null;
  const { ativoInt, ...resto } = row;
  return { ...resto, ativo: Boolean(ativoInt) };
}

export function criar({ tipo, descricao, natureza, percentual, valorFixo }) {
  const info = db.prepare(`
    INSERT INTO regras_desconto_adicional (tipo, descricao, natureza, percentual, valor_fixo)
    VALUES (?, ?, ?, ?, ?)
  `).run(tipo, descricao, natureza, percentual ?? null, valorFixo ?? null);
  return buscarPorId(info.lastInsertRowid);
}

export function listar({ natureza, tipo, ativo } = {}) {
  const condicoes = [];
  const params = [];

  if (natureza) { condicoes.push('natureza = ?'); params.push(natureza); }
  if (tipo) { condicoes.push('tipo = ?'); params.push(tipo); }
  if (ativo !== undefined) { condicoes.push('ativo = ?'); params.push(ativo ? 1 : 0); }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return db.prepare(`SELECT ${CAMPOS} FROM regras_desconto_adicional ${where}`).all(...params).map(formatar);
}

export function buscarPorId(id) {
  return formatar(db.prepare(`SELECT ${CAMPOS} FROM regras_desconto_adicional WHERE id = ?`).get(id));
}

export function atualizarParcial(id, campos) {
  const atual = db.prepare('SELECT * FROM regras_desconto_adicional WHERE id = ?').get(id);
  if (!atual) return null;

  const percentual = campos.percentual !== undefined ? campos.percentual : atual.percentual;
  const valorFixo = campos.valorFixo !== undefined ? campos.valorFixo : atual.valor_fixo;

  db.prepare(`
    UPDATE regras_desconto_adicional
    SET tipo = ?, descricao = ?, natureza = ?, percentual = ?, valor_fixo = ?, ativo = ?
    WHERE id = ?
  `).run(
    campos.tipo ?? atual.tipo,
    campos.descricao ?? atual.descricao,
    campos.natureza ?? atual.natureza,
    percentual,
    valorFixo,
    campos.ativo !== undefined ? (campos.ativo ? 1 : 0) : atual.ativo,
    id
  );
  return buscarPorId(id);
}

export function estaUsadaEmAlgumaFolha(id) {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM folha_itens WHERE regra_id = ?').get(id);
  return total > 0;
}

export function remover(id) {
  const info = db.prepare('DELETE FROM regras_desconto_adicional WHERE id = ?').run(id);
  return info.changes > 0;
}
