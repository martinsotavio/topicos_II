import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /usuarios/:id/ponto/historico', () => {
  it('ADMIN consulta o histórico de qualquer colaborador', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();
    inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-04', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:30:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-05', entrada: '08:00:00' });
    inserirRegistroPonto(ana.id, { data: '2026-08-06', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '19:00:00' });

    const res = await request(app)
      .get(`/usuarios/${ana.id}/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.registros).toHaveLength(4);
  });

  it('EMPLOYEE chamando essa rota (mesmo para o próprio id) recebe 403', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${employee.id}/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .get('/usuarios/999999/ponto/historico?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });

  it('período inválido retorna 400', async () => {
    const admin = await criarAdmin();
    const ana = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/ponto/historico?dataInicio=2026-08-10&dataFim=2026-08-01`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(400);
  });
});
