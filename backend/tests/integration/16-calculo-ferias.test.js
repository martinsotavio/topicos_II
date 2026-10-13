import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('POST /usuarios/:id/ferias/calcular', () => {
  it('cálculo com diasFerias: 30 bate com o exemplo (6120 / 2040 / 8160)', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario({ nome: 'Ana Silva', valorHora: 25.5, cargaHorariaDiaria: 8 });

    const res = await request(app)
      .post(`/usuarios/${ana.id}/ferias/calcular`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ diasFerias: 30 });

    expect(res.status).toBe(200);
    expect(res.body.salarioBase).toBe(6120);
    expect(res.body.adicionalUmTerco).toBe(2040);
    expect(res.body.valorFerias).toBe(8160);
  });

  it('diasFerias: 0 retorna 400', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/ferias/calcular`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ diasFerias: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('diasFerias: 31 retorna 400', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/ferias/calcular`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ diasFerias: 31 });

    expect(res.status).toBe(400);
  });

  it('EMPLOYEE recebe 403 (mesmo para o próprio id)', async () => {
    const ana = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${ana.id}/ferias/calcular`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`)
      .send({ diasFerias: 30 });

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/usuarios/999999/ferias/calcular')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ diasFerias: 30 });

    expect(res.status).toBe(404);
  });
});
