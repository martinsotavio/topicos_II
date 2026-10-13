import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegistroPonto, inserirRegraFinanceira } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

async function gerarFolhaParaAna(adminToken) {
  const ana = await criarUsuario({ nome: 'Ana Silva', valorHora: 25.5, cargaHorariaDiaria: 8 });
  inserirRegistroPonto(ana.id, { data: '2026-08-03', entrada: '08:00:00', saidaAlmoco: '12:00:00', retornoAlmoco: '13:00:00', saida: '17:00:00' });
  inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'Imposto de renda', natureza: 'DESCONTO', percentual: 0.11 });
  inserirRegraFinanceira({ tipo: 'VALE_TRANSPORTE', descricao: 'Vale transporte', natureza: 'ADICIONAL', valorFixo: 220 });

  const gerar = await request(app)
    .post(`/usuarios/${ana.id}/folha/gerar`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ periodoInicio: '2026-08-01', periodoFim: '2026-08-10' });

  return { ana, folhaId: gerar.body.id };
}

describe('GET /usuarios/:id/folhas', () => {
  it('retorna a folha gerada para o colaborador', async () => {
    const admin = await criarAdmin();
    const { ana } = await gerarFolhaParaAna(tokenPara(admin));

    const res = await request(app).get(`/usuarios/${ana.id}/folhas`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].usuarioId).toBe(ana.id);
  });

  it('EMPLOYEE consultando folhas de outro colaborador recebe 403', async () => {
    const admin = await criarAdmin();
    const { ana } = await gerarFolhaParaAna(tokenPara(admin));
    const bruno = await criarUsuario({ nome: 'Bruno Lima' });

    const res = await request(app).get(`/usuarios/${ana.id}/folhas`).set('Authorization', `Bearer ${tokenPara(bruno)}`);

    expect(res.status).toBe(403);
  });

  it('o próprio colaborador consulta as próprias folhas', async () => {
    const admin = await criarAdmin();
    const { ana } = await gerarFolhaParaAna(tokenPara(admin));

    const res = await request(app).get(`/usuarios/${ana.id}/folhas`).set('Authorization', `Bearer ${tokenPara(ana)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /usuarios/:id/folhas/:folhaId', () => {
  it('mostra os itens de desconto/adicional corretos', async () => {
    const admin = await criarAdmin();
    const { ana, folhaId } = await gerarFolhaParaAna(tokenPara(admin));

    const res = await request(app).get(`/usuarios/${ana.id}/folhas/${folhaId}`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.descontos).toHaveLength(1);
    expect(res.body.descontos[0].tipo).toBe('IMPOSTO');
    expect(res.body.adicionais).toHaveLength(1);
    expect(res.body.adicionais[0].tipo).toBe('VALE_TRANSPORTE');
  });

  it('folhaId inexistente retorna 404', async () => {
    const admin = await criarAdmin();
    const { ana } = await gerarFolhaParaAna(tokenPara(admin));

    const res = await request(app).get(`/usuarios/${ana.id}/folhas/999999`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });

  it('EMPLOYEE consultando detalhe de folha de outro colaborador recebe 403', async () => {
    const admin = await criarAdmin();
    const { ana, folhaId } = await gerarFolhaParaAna(tokenPara(admin));
    const bruno = await criarUsuario({ nome: 'Bruno Lima' });

    const res = await request(app).get(`/usuarios/${ana.id}/folhas/${folhaId}`).set('Authorization', `Bearer ${tokenPara(bruno)}`);

    expect(res.status).toBe(403);
  });
});
