import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto, inserirRegraFinanceira } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

async function criarAnaComRegistros() {
  const ana = await criarUsuario({ nome: 'Ana Silva', valorHora: 25.5, cargaHorariaDiaria: 8 });
  inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });
  inserirRegistroPonto(ana.id, { data: '2026-08-04', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:30:00' });
  inserirRegistroPonto(ana.id, { data: '2026-08-05', entrada: '08:00:00' });
  inserirRegistroPonto(ana.id, { data: '2026-08-06', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '19:00:00' });
  return ana;
}

describe('GET /usuarios/:id/folha/pre-calculo', () => {
  it('resultado bate com o esperado (salarioBruto ≈ 707.63, salarioLiquido ≈ 849.79)', async () => {
    const admin = await criarAdmin();
    const ana = await criarAnaComRegistros();
    inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });
    inserirRegraFinanceira({ tipo: 'VALE_TRANSPORTE', descricao: 'VT', natureza: 'ADICIONAL', valorFixo: 220 });

    const res = await request(app)
      .get(`/usuarios/${ana.id}/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.salarioBruto).toBe(707.63);
    expect(res.body.salarioLiquido).toBeCloseTo(849.79, 1);
    expect(res.body.descontos).toHaveLength(1);
    expect(res.body.adicionais).toHaveLength(1);
  });

  it('colaborador sem nenhuma regra ativa retorna salarioLiquido == salarioBruto', async () => {
    const admin = await criarAdmin();
    const ana = await criarAnaComRegistros();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.body.salarioLiquido).toBe(res.body.salarioBruto);
    expect(res.body.descontos).toHaveLength(0);
    expect(res.body.adicionais).toHaveLength(0);
  });

  it('regra com percentual aplica sobre salarioBruto, não sobre o líquido', async () => {
    const admin = await criarAdmin();
    const ana = await criarAnaComRegistros();
    inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.1 });

    const res = await request(app)
      .get(`/usuarios/${ana.id}/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    const descontoEsperado = Math.round(res.body.salarioBruto * 0.1 * 100) / 100;
    expect(res.body.descontos[0].valor).toBe(descontoEsperado);
  });

  it('EMPLOYEE não acessa essa rota', async () => {
    const ana = await criarAnaComRegistros();

    const res = await request(app)
      .get(`/usuarios/${ana.id}/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10`)
      .set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(403);
  });

  it(':id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .get('/usuarios/999999/folha/pre-calculo?dataInicio=2026-08-01&dataFim=2026-08-10')
      .set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
