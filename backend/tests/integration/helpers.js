import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../src/db.js';
import * as usuarioModel from '../../src/models/usuarioModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';

const TABELAS_EM_ORDEM = ['folha_itens', 'folhas_pagamento', 'bonus', 'registros_ponto', 'regras_desconto_adicional', 'usuarios'];

export function limparBanco() {
  for (const tabela of TABELAS_EM_ORDEM) {
    db.prepare(`DELETE FROM ${tabela}`).run();
  }
}

let proximoCpf = 10000000000;
export function cpfUnico() {
  return String(proximoCpf++);
}

let proximoEmail = 1;
export function emailUnico(prefixo = 'pessoa') {
  return `${prefixo}${proximoEmail++}@empresa.com`;
}

// rounds baixo (4) só para acelerar os testes — ainda é bcrypt real, não um fake.
export async function criarUsuario({
  nome = 'Usuário Teste',
  email = emailUnico(),
  senha = 'Senha@123',
  cpf = cpfUnico(),
  role = 'EMPLOYEE',
  cargo = 'Cargo Teste',
  departamento = 'Depto Teste',
  dataAdmissao = '2020-01-01',
  valorHora = 20,
  cargaHorariaDiaria = 8,
  cargaHorariaSemanal = 44,
} = {}) {
  const senhaHash = await bcrypt.hash(senha, 4);
  return usuarioModel.criar({
    nome, email, senhaHash, cpf, role, cargo, departamento,
    dataAdmissao, valorHora, cargaHorariaDiaria, cargaHorariaSemanal,
  });
}

export function criarAdmin(dados = {}) {
  return criarUsuario({ role: 'ADMIN', cargo: 'Administrador', departamento: 'Diretoria', ...dados });
}

export function tokenPara(usuario) {
  return jwt.sign(
    { sub: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function inserirRegistroPonto(usuarioId, { data, entrada = null, saidaAlmoco = null, retornoAlmoco = null, saida = null }) {
  db.prepare(`
    INSERT INTO registros_ponto (usuario_id, data, entrada, saida_almoco, retorno_almoco, saida)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuarioId, data, entrada, saidaAlmoco, retornoAlmoco, saida);
}

export function inserirRegraFinanceira({ tipo, descricao, natureza, percentual = null, valorFixo = null, ativo = true }) {
  const info = db.prepare(`
    INSERT INTO regras_desconto_adicional (tipo, descricao, natureza, percentual, valor_fixo, ativo)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tipo, descricao, natureza, percentual, valorFixo, ativo ? 1 : 0);
  return info.lastInsertRowid;
}
