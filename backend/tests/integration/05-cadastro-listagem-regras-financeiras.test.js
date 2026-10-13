import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegraFinanceira } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('POST /regras-financeiras', () => {
  it('ADMIN cadastra uma regra com valorFixo', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ tipo: 'VALE_REFEICAO', descricao: 'Vale refeição mensal', natureza: 'ADICIONAL', valorFixo: 300.0 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ tipo: 'VALE_REFEICAO', valorFixo: 300, percentual: null, ativo: true });
  });

  it('ADMIN cadastra uma regra com percentual', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });

    expect(res.status).toBe(201);
    expect(res.body.percentual).toBe(0.11);
  });

  it('percentual e valorFixo juntos retorna 400', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ tipo: 'IMPOSTO', descricao: 'x', natureza: 'DESCONTO', percentual: 0.1, valorFixo: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('nem percentual nem valorFixo retorna 400', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ tipo: 'IMPOSTO', descricao: 'x', natureza: 'DESCONTO' });

    expect(res.status).toBe(400);
  });

  it('tipo inválido retorna 400', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ tipo: 'INVALIDO', descricao: 'x', natureza: 'DESCONTO', valorFixo: 10 });

    expect(res.status).toBe(400);
  });

  it('POST por EMPLOYEE retorna 403', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .post('/regras-financeiras')
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ tipo: 'IMPOSTO', descricao: 'x', natureza: 'DESCONTO', percentual: 0.1 });

    expect(res.status).toBe(403);
  });
});

describe('GET /regras-financeiras', () => {
  it('sem filtro retorna todas as regras para ADMIN', async () => {
    const admin = await criarAdmin();
    inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });
    inserirRegraFinanceira({ tipo: 'VALE_TRANSPORTE', descricao: 'VT', natureza: 'ADICIONAL', valorFixo: 220 });

    const res = await request(app).get('/regras-financeiras').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('?natureza=ADICIONAL retorna só a de vale transporte', async () => {
    const admin = await criarAdmin();
    inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });
    inserirRegraFinanceira({ tipo: 'VALE_TRANSPORTE', descricao: 'VT', natureza: 'ADICIONAL', valorFixo: 220 });

    const res = await request(app)
      .get('/regras-financeiras?natureza=ADICIONAL')
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('VALE_TRANSPORTE');
  });

  it('EMPLOYEE só vê regras ativas mesmo forçando ?ativo=false', async () => {
    const employee = await criarUsuario();
    inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'ativa', natureza: 'DESCONTO', percentual: 0.11, ativo: true });
    inserirRegraFinanceira({ tipo: 'OUTRO', descricao: 'inativa', natureza: 'DESCONTO', percentual: 0.05, ativo: false });

    const res = await request(app)
      .get('/regras-financeiras?ativo=false')
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].descricao).toBe('ativa');
  });
});
