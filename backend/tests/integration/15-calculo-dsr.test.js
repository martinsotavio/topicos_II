import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /usuarios/:id/dsr', () => {
  it('período sem horas extras retorna valorDsr: 0', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario({ valorHora: 25.5, cargaHorariaDiaria: 8 });
    inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' }); // exatamente 8h, sem extra

    const res = await request(app)
      .get(`/usuarios/${ana.id}/dsr?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.salarioBrutoExtra).toBe(0);
    expect(res.body.valorDsr).toBe(0);
  });

  it('cálculo com dados de Ana Silva bate com o esperado (salarioBrutoExtra ≈ 95.63)', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario({ nome: 'Ana Silva', valorHora: 25.5, cargaHorariaDiaria: 8 });
    inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-04', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:30:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-05', entrada: '08:00:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-06', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '19:00:00' });

    const res = await request(app)
      .get(`/usuarios/${ana.id}/dsr?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.body.salarioBrutoExtra).toBe(95.63);
    expect(res.body.diasUteis + res.body.diasDescanso).toBe(10);
    expect(res.body.valorDsr).toBeGreaterThan(0);
  });

  it('EMPLOYEE só consulta o próprio DSR', async () => {
    const ana = await criarUsuario();
    const outro = await criarUsuario();

    const proprio = await request(app)
      .get(`/usuarios/${ana.id}/dsr?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`);
    expect(proprio.status).toBe(200);

    const alheio = await request(app)
      .get(`/usuarios/${outro.id}/dsr?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`);
    expect(alheio.status).toBe(403);
  });

  it('dataInicio > dataFim retorna 400', async () => {
    const ana = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/dsr?dataInicio=2026-08-10&dataFim=2026-08-01`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(400);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .get('/usuarios/999999/dsr?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
