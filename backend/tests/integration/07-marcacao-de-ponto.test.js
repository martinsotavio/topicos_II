import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('POST /ponto/marcar', () => {
  it('primeira marcação do dia cria o registro com entrada preenchida (201)', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .post('/ponto/marcar')
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ tipo: 'ENTRADA' });

    expect(res.status).toBe(201);
    expect(res.body.entrada).not.toBeNull();
    expect(res.body.saidaAlmoco).toBeNull();
  });

  it('marcar SAIDA sem ENTRADA anterior retorna 409 (fora de ordem)', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .post('/ponto/marcar')
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ tipo: 'SAIDA' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_ORDER');
  });

  it('marcar ENTRADA duas vezes no mesmo dia retorna 409 (já marcado)', async () => {
    const employee = await criarUsuario();
    const token = tokenPara(employee);

    await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'ENTRADA' });
    const res = await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'ENTRADA' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_MARKED');
  });

  it('sequência completa preenche o registro do dia por inteiro', async () => {
    const employee = await criarUsuario();
    const token = tokenPara(employee);

    await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'ENTRADA' });
    await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'SAIDA_ALMOCO' });
    await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'RETORNO_ALMOCO' });
    const ultima = await request(app).post('/ponto/marcar').set('Authorization', `Bearer ${token}`).send({ tipo: 'SAIDA' });

    expect(ultima.status).toBe(200); // já existia o registro do dia, então é atualização (não criação)
    expect(ultima.body.entrada).not.toBeNull();
    expect(ultima.body.saidaAlmoco).not.toBeNull();
    expect(ultima.body.retornoAlmoco).not.toBeNull();
    expect(ultima.body.saida).not.toBeNull();
  });

  it("tipo inválido retorna 400", async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .post('/ponto/marcar')
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ tipo: 'ALMOCO_ESTENDIDO' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('sem token retorna 401', async () => {
    const res = await request(app).post('/ponto/marcar').send({ tipo: 'ENTRADA' });

    expect(res.status).toBe(401);
  });
});
