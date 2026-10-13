import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, emailUnico, cpfUnico } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

function dadosCadastro(overrides = {}) {
  return {
    nome: 'Novo Colaborador',
    email: emailUnico(),
    senha: 'senhaForte123',
    cpf: cpfUnico(),
    role: 'EMPLOYEE',
    cargo: 'Dev',
    departamento: 'TI',
    dataAdmissao: '2026-08-01',
    valorHora: 30,
    cargaHorariaDiaria: 8,
    cargaHorariaSemanal: 44,
    ...overrides,
  };
}

describe('POST /auth/registrar — bootstrap do primeiro ADMIN', () => {
  it('permite cadastro sem token quando o banco está vazio', async () => {
    const res = await request(app)
      .post('/auth/registrar')
      .send(dadosCadastro({ role: 'ADMIN', cargo: 'CEO', departamento: 'Diretoria' }));

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('ADMIN');
  });

  it('exige autenticação para cadastrar quando o banco já tem alguém', async () => {
    await criarAdmin();

    const res = await request(app).post('/auth/registrar').send(dadosCadastro());

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /auth/registrar — cadastro por ADMIN', () => {
  it('cadastro válido por ADMIN retorna 201 sem senha nem senha_hash', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro());

    expect(res.status).toBe(201);
    expect(res.body.senha).toBeUndefined();
    expect(res.body.senha_hash).toBeUndefined();
    expect(res.body).toMatchObject({ nome: 'Novo Colaborador', role: 'EMPLOYEE' });
  });

  it('EMPLOYEE tentando cadastrar retorna 403', async () => {
    const employee = await criarUsuario();
    const token = tokenPara(employee);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro());

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('CPF duplicado retorna 409', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);
    const cpf = cpfUnico();

    await request(app).post('/auth/registrar').set('Authorization', `Bearer ${token}`).send(dadosCadastro({ cpf }));
    const res = await request(app).post('/auth/registrar').set('Authorization', `Bearer ${token}`).send(dadosCadastro({ cpf }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CPF_IN_USE');
  });

  it('e-mail duplicado retorna 409', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);
    const email = emailUnico();

    await request(app).post('/auth/registrar').set('Authorization', `Bearer ${token}`).send(dadosCadastro({ email }));
    const res = await request(app).post('/auth/registrar').set('Authorization', `Bearer ${token}`).send(dadosCadastro({ email }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('valorHora: -5 retorna 400', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro({ valorHora: -5 }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('cpf fora do padrão de 11 dígitos retorna 400', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro({ cpf: '123' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('role inválida retorna 400', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro({ role: 'SUPERUSER' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('dataAdmissao futura retorna 400', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosCadastro({ dataAdmissao: '2999-01-01' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('campo obrigatório ausente retorna 400', async () => {
    const admin = await criarAdmin();
    const token = tokenPara(admin);
    const { cargo, ...semCargo } = dadosCadastro();

    const res = await request(app)
      .post('/auth/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send(semCargo);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
