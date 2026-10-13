import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

async function criarAnaComRegistros() {
  const ana = await criarUsuario({ nome: 'Ana Silva', cargaHorariaDiaria: 8 });
  inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' }); // 8h, 0 extra
  inserirRegistroPonto(ana.id, { data: '2026-08-04', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:30:00' }); // 8.5h, 0.5 extra
  inserirRegistroPonto(ana.id, { data: '2026-08-05', entrada: '08:00:00' }); // incompleto
  inserirRegistroPonto(ana.id, { data: '2026-08-06', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '19:00:00' }); // 10h, 2 extra
  return ana;
}

describe('GET /ponto/resumo-horas', () => {
  it('resultado bate com 24h normais + 2,5h extras, 1 dia incompleto', async () => {
    const ana = await criarAnaComRegistros();

    const res = await request(app)
      .get('/ponto/resumo-horas?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(200);
    expect(res.body.totalHorasNormais).toBe(24);
    expect(res.body.totalHorasExtras).toBe(2.5);
    expect(res.body.diasComRegistroCompleto).toBe(3);
    expect(res.body.diasIncompletos).toBe(1);
  });

  it('dia incompleto (2026-08-05) não soma horas em nenhum total', async () => {
    const ana = await criarAnaComRegistros();

    const res = await request(app)
      .get('/ponto/resumo-horas?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(ana)}`);

    const diaIncompleto = res.body.detalhePorDia.find((d) => d.data === '2026-08-05');
    expect(diaIncompleto.completo).toBe(false);
    expect(diaIncompleto.horasTrabalhadas).toBeNull();
    expect(diaIncompleto.horasNormais).toBe(0);
    expect(diaIncompleto.horasExtras).toBe(0);
  });
});

describe('GET /usuarios/:id/ponto/resumo-horas', () => {
  it('ADMIN consulta o resumo de qualquer :id', async () => {
    const admin = await criarAdmin();
    const ana = await criarAnaComRegistros();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/ponto/resumo-horas?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.totalHorasNormais).toBe(24);
    expect(res.body.totalHorasExtras).toBe(2.5);
  });

  it('EMPLOYEE não consulta resumo de outro colaborador', async () => {
    const ana = await criarAnaComRegistros();
    const outro = await criarUsuario();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/ponto/resumo-horas?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(outro)}`);

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .get('/usuarios/999999/ponto/resumo-horas?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
