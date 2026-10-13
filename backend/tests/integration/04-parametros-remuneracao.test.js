import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /usuarios/:id/remuneracao', () => {
  it('retorna os valores de remuneração do próprio usuário', async () => {
    const employee = await criarUsuario({ valorHora: 25.5, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 });

    const res = await request(app)
      .get(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ usuarioId: employee.id, valorHora: 25.5, cargaHorariaDiaria: 8, cargaHorariaSemanal: 44 });
  });

  it('ADMIN consulta a remuneração de qualquer colaborador', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
  });

  it('EMPLOYEE consultando a remuneração de outro colaborador recebe 403', async () => {
    const employee = await criarUsuario();
    const outro = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${outro.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /usuarios/:id/remuneracao', () => {
  it('ADMIN atualiza e o GET seguinte reflete a mudança', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario({ valorHora: 25 });

    const patch = await request(app)
      .patch(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ valorHora: 28.0 });
    expect(patch.status).toBe(200);
    expect(patch.body.valorHora).toBe(28);

    const get = await request(app)
      .get(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);
    expect(get.body.valorHora).toBe(28);
  });

  it('EMPLOYEE tentando PATCH na própria remuneração recebe 403', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ valorHora: 30 });

    expect(res.status).toBe(403);
  });

  it('valorHora: 0 retorna 400', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ valorHora: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('sem nenhum campo retorna 400', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${employee.id}/remuneracao`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .patch('/usuarios/999999/remuneracao')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ valorHora: 30 });

    expect(res.status).toBe(404);
  });
});
