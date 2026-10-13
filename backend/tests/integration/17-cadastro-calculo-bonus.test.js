import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('POST /usuarios/:id/bonus', () => {
  it('cadastro FIXO retorna valorCalculado igual ao valorFixo enviado', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ descricao: 'Meta de vendas Q3', tipo: 'FIXO', valorFixo: 500.0 });

    expect(res.status).toBe(201);
    expect(res.body.valorCalculado).toBe(500);
  });

  it('cadastro PERCENTUAL calcula corretamente percentual * salarioBaseCalculo', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ descricao: 'Bônus por desempenho', tipo: 'PERCENTUAL', percentual: 0.05, salarioBaseCalculo: 4488.0 });

    expect(res.status).toBe(201);
    expect(res.body.valorCalculado).toBe(224.4);
  });

  it('cadastro PERCENTUAL sem salarioBaseCalculo retorna 400', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ descricao: 'x', tipo: 'PERCENTUAL', percentual: 0.05 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('EMPLOYEE recebe 403 ao tentar cadastrar', async () => {
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`)
      .send({ descricao: 'x', tipo: 'FIXO', valorFixo: 100 });

    expect(res.status).toBe(403);
  });

  it("tipo inválido retorna 400", async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ descricao: 'x', tipo: 'OUTRO', valorFixo: 100 });

    expect(res.status).toBe(400);
  });
});

describe('GET /usuarios/:id/bonus', () => {
  it('EMPLOYEE lista os próprios bônus', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    await request(app)
      .post(`/usuarios/${ana.id}/bonus`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ descricao: 'Meta de vendas Q3', tipo: 'FIXO', valorFixo: 500.0 });

    const res = await request(app).get(`/usuarios/${ana.id}/bonus`).set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].descricao).toBe('Meta de vendas Q3');
  });

  it('EMPLOYEE não lista bônus de outro colaborador', async () => {
    const ana = await criarUsuario();
    const outro = await criarUsuario();

    const res = await request(app).get(`/usuarios/${outro.id}/bonus`).set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app).get('/usuarios/999999/bonus').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
