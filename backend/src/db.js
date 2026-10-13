import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'usuarios.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('ADMIN','EMPLOYEE')),
    cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    data_admissao TEXT NOT NULL,
    valor_hora REAL NOT NULL,
    carga_horaria_diaria REAL NOT NULL,
    carga_horaria_semanal REAL NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS registros_ponto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    entrada TEXT, saida_almoco TEXT, retorno_almoco TEXT, saida TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (usuario_id, data)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS regras_desconto_adicional (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK(tipo IN ('FALTA','ATRASO','VALE_TRANSPORTE','VALE_REFEICAO','IMPOSTO','OUTRO')),
    descricao TEXT NOT NULL,
    natureza TEXT NOT NULL CHECK(natureza IN ('DESCONTO','ADICIONAL')),
    percentual REAL,
    valor_fixo REAL,
    ativo INTEGER NOT NULL DEFAULT 1,
    CHECK ((percentual IS NOT NULL AND valor_fixo IS NULL) OR (percentual IS NULL AND valor_fixo IS NOT NULL))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS folhas_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    periodo_inicio TEXT NOT NULL,
    periodo_fim TEXT NOT NULL,
    total_horas_normais REAL NOT NULL,
    total_horas_extras REAL NOT NULL,
    salario_bruto REAL NOT NULL,
    total_descontos REAL NOT NULL,
    total_adicionais REAL NOT NULL,
    salario_liquido REAL NOT NULL,
    gerado_em TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS folha_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folha_id INTEGER NOT NULL REFERENCES folhas_pagamento(id) ON DELETE CASCADE,
    regra_id INTEGER REFERENCES regras_desconto_adicional(id),
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    natureza TEXT NOT NULL CHECK(natureza IN ('DESCONTO','ADICIONAL')),
    valor REAL NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bonus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('FIXO','PERCENTUAL')),
    percentual REAL,
    salario_base_calculo REAL,
    valor_calculado REAL NOT NULL,
    concedido_em TEXT NOT NULL DEFAULT (date('now'))
  )
`);

export default db;
