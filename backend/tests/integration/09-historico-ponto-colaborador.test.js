import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarUsuario, tokenPara, inserirRegistroPonto } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /ponto/historico', () => {
  it('retorna exatamente os registros do período, ordenados por data crescente', async () => {
    const employee = await criarUsuario();
    inserirRegistroPonto(employee.id, { data: '2026-08-06', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '19:00:00' });
    inserirRegistroPonto(employee.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });
    inserirRegistroPonto(employee.id, { data: '2026-08-04', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:30:00' });
    inserirRegistroPonto(employee.id, { data: '2026-08-05', entrada: '08:00:00' });

    const res = await request(app)
      .get('/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(200);
    expect(res.body.registros).toHaveLength(4);
    expect(res.body.registros.map((r) => r.data)).toEqual(['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06']);
  });

  it('dataInicio depois de dataFim retorna 400', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .get('/ponto/historico?dataInicio=2026-08-10&dataFim=2026-08-01')
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('período maior que 90 dias retorna 400', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .get('/ponto/historico?dataInicio=2026-01-01&dataFim=2026-08-01')
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(400);
  });

  it('data em formato inválido retorna 400', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .get('/ponto/historico?dataInicio=01-08-2026&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(400);
  });

  it('nunca aceita usuarioId por parâmetro — sempre usa o usuário autenticado', async () => {
    const ana = await criarUsuario();
    const bruno = await criarUsuario();
    inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00' });
    inserirRegistroPonto(bruno.id, { data: '2026-08-03', entrada: '09:00:00' });

    const res = await request(app)
      .get(`/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10&usuarioId=${bruno.id}`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.body.usuarioId).toBe(ana.id);
    expect(res.body.registros).toHaveLength(1);
    expect(res.body.registros[0].entrada).toBe('08:00:00');
  });

  it('sem token retorna 401', async () => {
    const res = await request(app).get('/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10');

    expect(res.status).toBe(401);
  });
});
