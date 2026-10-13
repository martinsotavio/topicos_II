import bcrypt from 'bcryptjs';
import db from '../src/db.js';
import * as usuarioModel from '../src/models/usuarioModel.js';
import * as registroPontoModel from '../src/models/registroPontoModel.js';
import * as regraFinanceiraModel from '../src/models/regraFinanceiraModel.js';
import * as folhaPagamentoModel from '../src/models/folhaPagamentoModel.js';
import { calcularFolha } from '../src/services/calculoFolhaService.js';

const TABELAS_EM_ORDEM = ['folha_itens', 'folhas_pagamento', 'bonus', 'registros_ponto', 'regras_desconto_adicional', 'usuarios'];

function limparBanco() {
  for (const tabela of TABELAS_EM_ORDEM) {
    db.prepare(`DELETE FROM ${tabela}`).run();
  }
}

const SENHA_ADMIN = 'Admin@123';
const SENHA_EMPLOYEE = 'Emp@123';

const USUARIOS = [
  { nome: 'Admin', email: 'admin@empresa.com', senha: SENHA_ADMIN, cpf: '11111111111', role: 'ADMIN', cargo: 'Gerente de RH', departamento: 'RH', dataAdmissao: '2018-03-01', valorHora: 45, cargaHorariaDiaria: 8, cargaHorariaSemanal: 40 },
  { nome: 'Carlos Souza', email: 'carlos.souza@empresa.com', senha: SENHA_EMPLOYEE, cpf: '22222222222', role: 'EMPLOYEE', cargo: 'Analista Financeiro', departamento: 'Financeiro', dataAdmissao: '2020-05-10', valorHora: 30, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 },
  { nome: 'Ana Silva', email: 'ana.silva@empresa.com', senha: SENHA_EMPLOYEE, cpf: '33333333333', role: 'EMPLOYEE', cargo: 'Desenvolvedora', departamento: 'TI', dataAdmissao: '2021-02-15', valorHora: 25.5, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 },
  { nome: 'Bruno Lima', email: 'bruno.lima@empresa.com', senha: SENHA_EMPLOYEE, cpf: '44444444444', role: 'EMPLOYEE', cargo: 'Designer', departamento: 'Produto', dataAdmissao: '2022-01-20', valorHora: 28, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 },
  { nome: 'Diana Alves', email: 'diana.alves@empresa.com', senha: SENHA_EMPLOYEE, cpf: '55555555555', role: 'EMPLOYEE', cargo: 'Analista de Suporte', departamento: 'TI', dataAdmissao: '2021-08-01', valorHora: 22, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 },
  { nome: 'Eduardo Santos', email: 'eduardo.santos@empresa.com', senha: SENHA_EMPLOYEE, cpf: '66666666666', role: 'EMPLOYEE', cargo: 'Vendedor', departamento: 'Comercial', dataAdmissao: '2019-11-11', valorHora: 20, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 },
  { nome: 'Fernanda Melo', email: 'fernanda.melo@empresa.com', senha: SENHA_EMPLOYEE, cpf: '77777777777', role: 'EMPLOYEE', cargo: 'Recepcionista', departamento: 'Administrativo', dataAdmissao: '2023-03-05', valorHora: 18, cargaHorariaDiaria: 8, cargaHorariaSemanal: 40 },
];

// Ponto de Ana Silva (id 3): 3 dias completos (03, 04, 06) + 1 incompleto (05).
const PONTO_ANA = [
  { data: '2026-08-03', entrada: '08:00:00', saida_almoco: '12:00:00', retorno_almoco: '13:00:00', saida: '17:00:00' },
  { data: '2026-08-04', entrada: '08:00:00', saida_almoco: '12:00:00', retorno_almoco: '13:00:00', saida: '17:30:00' },
  { data: '2026-08-05', entrada: '08:00:00', saida_almoco: null, retorno_almoco: null, saida: null },
  { data: '2026-08-06', entrada: '08:00:00', saida_almoco: '12:00:00', retorno_almoco: '13:00:00', saida: '19:00:00' },
];

const REGRAS = [
  { tipo: 'IMPOSTO', descricao: 'Imposto de renda retido na fonte', natureza: 'DESCONTO', percentual: 0.11, valorFixo: null },
  { tipo: 'VALE_TRANSPORTE', descricao: 'Vale transporte mensal', natureza: 'ADICIONAL', percentual: null, valorFixo: 220 },
];

async function seed() {
  limparBanco();

  for (const dados of USUARIOS) {
    const { senha, ...resto } = dados;
    const senhaHash = await bcrypt.hash(senha, 10);
    usuarioModel.criar({ ...resto, senhaHash });
  }

  const anaId = usuarioModel.buscarPorEmail('ana.silva@empresa.com').id;
  for (const registro of PONTO_ANA) {
    db.prepare(`
      INSERT INTO registros_ponto (usuario_id, data, entrada, saida_almoco, retorno_almoco, saida)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(anaId, registro.data, registro.entrada, registro.saida_almoco, registro.retorno_almoco, registro.saida);
  }

  for (const regra of REGRAS) {
    regraFinanceiraModel.criar(regra);
  }

  // Folha de seed para Ana Silva, cobrindo o período com os registros de ponto acima.
  const resultado = calcularFolha(anaId, '2026-08-01', '2026-08-10');
  folhaPagamentoModel.criar(anaId, '2026-08-01', '2026-08-10', resultado);

  console.log('Banco populado com sucesso:');
  console.log(`- ${USUARIOS.length} usuários (ADMIN: admin@empresa.com / ${SENHA_ADMIN})`);
  console.log(`- ${PONTO_ANA.length} registros de ponto para Ana Silva (id ${anaId})`);
  console.log(`- ${REGRAS.length} regras financeiras ativas`);
  console.log('- 1 folha de pagamento gerada para Ana Silva (2026-08-01 a 2026-08-10)');
}

seed().catch((err) => {
  console.error('Falha ao popular o banco:', err);
  process.exitCode = 1;
});
