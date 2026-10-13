import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara, emailUnico, cpfUnico } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

function dadosCompletos(overrides = {}) {
  return {
    nome: 'Colaborador Substituído',
    email: emailUnico(),
    senha: 'outraSenha1',
    cpf: cpfUnico(),
    role: 'EMPLOYEE',
    cargo: 'Analista',
    departamento: 'TI',
    dataAdmissao: '2021-01-01',
    valorHora: 25,
    cargaHorariaDiaria: 8,
    cargaHorariaSemanal: 44,
    ...overrides,
  };
}

describe('PATCH /usuarios/:id', () => {
  it('ADMIN altera o cargo de um colaborador', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario({ cargo: 'Analista Júnior' });

    const res = await request(app)
      .patch(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ cargo: 'Analista Sênior' });

    expect(res.status).toBe(200);
    expect(res.body.cargo).toBe('Analista Sênior');
  });

  it('EMPLOYEE tentando alterar o próprio role recebe 400', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('EMPLOYEE altera o próprio nome com sucesso', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ nome: 'Nome Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Nome Atualizado');
  });

  it('EMPLOYEE tentando PATCH no id de outro colaborador recebe 403', async () => {
    const employee = await criarUsuario();
    const outro = await criarUsuario();

    const res = await request(app)
      .patch(`/usuarios/${outro.id}`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send({ nome: 'Hack' });

    expect(res.status).toBe(403);
  });

  it('PATCH sem nenhum campo retorna 400', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .patch(`/usuarios/${admin.id}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app)
      .patch('/usuarios/999999')
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /usuarios/:id', () => {
  it('ADMIN substitui o cadastro completo', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const res = await request(app)
      .put(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send(dadosCompletos());

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Colaborador Substituído');
  });

  it('PUT com e-mail já usado retorna 409', async () => {
    const admin = await criarAdmin();
    const jaExiste = await criarUsuario();
    const employee = await criarUsuario();

    const res = await request(app)
      .put(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send(dadosCompletos({ email: jaExiste.email }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('EMPLOYEE tentando PUT recebe 403', async () => {
    const employee = await criarUsuario();

    const res = await request(app)
      .put(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(employee)}`)
      .send(dadosCompletos());

    expect(res.status).toBe(403);
  });

  it('PUT com campo obrigatório ausente retorna 400', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();
    const { cargo, ...semCargo } = dadosCompletos();

    const res = await request(app)
      .put(`/usuarios/${employee.id}`)
      .set('Authorization', `Bearer ${tokenPara(admin)}`)
      .send(semCargo);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /usuarios/:id', () => {
  it('remove e retorna 204; GET seguinte retorna 404', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const del = await request(app).delete(`/usuarios/${employee.id}`).set('Authorization', `Bearer ${tokenPara(admin)}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/usuarios/${employee.id}`).set('Authorization', `Bearer ${tokenPara(admin)}`);
    expect(get.status).toBe(404);
  });

  it('EMPLOYEE tentando DELETE recebe 403', async () => {
    const employee = await criarUsuario();
    const outro = await criarUsuario();

    const res = await request(app).delete(`/usuarios/${outro.id}`).set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app).delete('/usuarios/999999').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
  });
});
