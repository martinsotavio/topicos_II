import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import db from '../../src/db.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, inserirRegraFinanceira } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

function marcarRegraComoUsadaEmFolha(regraId, usuarioId) {
  const folhaInfo = db.prepare(`
    INSERT INTO folhas_pagamento
      (usuario_id, periodo_inicio, periodo_fim, total_horas_normais, total_horas_extras,
       salario_bruto, total_descontos, total_adicionais, salario_liquido)
    VALUES (?, '2026-08-01', '2026-08-31', 160, 0, 4000, 100, 0, 3900)
  `).run(usuarioId);
  db.prepare(`
    INSERT INTO folha_itens (folha_id, regra_id, tipo, descricao, natureza, valor)
    VALUES (?, ?, 'IMPOSTO', 'Imposto', 'DESCONTO', 100)
  `).run(folhaInfo.lastInsertRowid, regraId);
}

describe('PATCH /regras-financeiras/:id', () => {
  it('ADMIN desativa uma regra com {"ativo": false}', async () => {
    const admin = await criarAdmin();
    const regraId = inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });

    const res = await request(app)
      .patch(`/regras-financeiras/${regraId}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ ativo: false });

    expect(res.status).toBe(200);
    expect(res.body.ativo).toBe(false);
  });

  it('enviar percentual e valorFixo juntos no mesmo PATCH retorna 400', async () => {
    const admin = await criarAdmin();
    const regraId = inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });

    const res = await request(app)
      .patch(`/regras-financeiras/${regraId}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ percentual: 0.2, valorFixo: 10 });

    expect(res.status).toBe(400);
  });

  it('EMPLOYEE tentando PATCH recebe 403', async () => {
    const employee = await criarUsuario();
    const regraId = inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });

    const res = await request(app)
      .patch(`/regras-financeiras/${regraId}`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ ativo: false });

    expect(res.status).toBe(403);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .patch('/regras-financeiras/999999')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ ativo: false });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /regras-financeiras/:id', () => {
  it('regra já usada em alguma folha retorna 409', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();
    const regraId = inserirRegraFinanceira({ tipo: 'IMPOSTO', descricao: 'IR', natureza: 'DESCONTO', percentual: 0.11 });
    marcarRegraComoUsadaEmFolha(regraId, employee.id);

    const res = await request(app).delete(`/regras-financeiras/${regraId}`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RULE_IN_USE');
  });

  it('regra sem uso é removida com 204', async () => {
    const admin = await criarAdmin();
    const regraId = inserirRegraFinanceira({ tipo: 'VALE_REFEICAO', descricao: 'VR', natureza: 'ADICIONAL', valorFixo: 300 });

    const res = await request(app).delete(`/regras-financeiras/${regraId}`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(204);
  });

  it('EMPLOYEE tentando DELETE recebe 403', async () => {
    const employee = await criarUsuario();
    const regraId = inserirRegraFinanceira({ tipo: 'VALE_REFEICAO', descricao: 'VR', natureza: 'ADICIONAL', valorFixo: 300 });

    const res = await request(app).delete(`/regras-financeiras/${regraId}`).set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app).delete('/regras-financeiras/999999').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
