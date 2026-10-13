import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /ponto/hoje', () => {
  it('sem marcação hoje retorna 200 com corpo null', async () => {
    const employee = await criarUsuario();

    const res = await request(app).get('/ponto/hoje').set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('com marcação parcial retorna os campos preenchidos e os pendentes como null', async () => {
    const employee = await criarUsuario();
    const token = tokenPara(employee);

    await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'ENTRADA' });

    const res = await request(app).get('/ponto/hoje').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.entrada).not.toBeNull();
    expect(res.body.saidaAlmoco).toBeNull();
    expect(res.body.retornoAlmoco).toBeNull();
    expect(res.body.saida).toBeNull();
  });

  it('sem token retorna 401', async () => {
    const res = await request(app).get('/ponto/hoje');

    expect(res.status).toBe(401);
  });
});
