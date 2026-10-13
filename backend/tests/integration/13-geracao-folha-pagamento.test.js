import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('POST /usuarios/:id/folha/gerar', () => {
  it('gerar folha para um colaborador retorna 201', async () => {
    const admin = await criarAdmin();
    const bruno = await criarUsuario({ nome: 'Bruno Lima' });
    inserirRegistroPonto(bruno.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });

    const res = await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ usuarioId: bruno.id, periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });
  });

  it('gerar de novo para o mesmo colaborador/período retorna 409', async () => {
    const admin = await criarAdmin();
    const bruno = await criarUsuario();
    const token = tokenPara(admin);
    const body = { periodoInicio: '2026-08-01', periodoFim: '2026-08-31' };

    await request(app).post(`/usuarios/${bruno.id}/folha/gerar`).set('Authorization', `Bearer ${token}`).send(body);
    const res = await request(app).post(`/usuarios/${bruno.id}/folha/gerar`).set('Authorization', `Bearer ${token}`).send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PERIOD_OVERLAP');
  });

  it('gerar com período parcialmente sobreposto também retorna 409', async () => {
    const admin = await criarAdmin();
    const bruno = await criarUsuario();
    const token = tokenPara(admin);

    await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });

    const res = await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ periodoInicio: '2026-08-15', periodoFim: '2026-09-10' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PERIOD_OVERLAP');
  });

  it('período não sobreposto para o mesmo colaborador é aceito (201)', async () => {
    const admin = await criarAdmin();
    const bruno = await criarUsuario();
    const token = tokenPara(admin);

    await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });

    const res = await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ periodoInicio: '2026-09-01', periodoFim: '2026-09-30' });

    expect(res.status).toBe(201);
  });

  it('EMPLOYEE tentando gerar recebe 403', async () => {
    const bruno = await criarUsuario();

    const res = await request(app)
      .post(`/usuarios/${bruno.id}/folha/gerar`)
      .set('Authorization', `Bearer ${tokenPara(bruno)}`)
      .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .post('/usuarios/999999/folha/gerar')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-31' });

    expect(res.status).toBe(404);
  });
});
