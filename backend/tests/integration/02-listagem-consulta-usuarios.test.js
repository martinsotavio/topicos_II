import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { limparBanco, criarAdmin, criarUsuario, tokenPara } from './helpers.js';

beforeEach(() => {
  limparBanco();
});

describe('GET /usuarios', () => {
  it('ADMIN lista todos os colaboradores', async () => {
    const admin = await criarAdmin();
    await criarUsuario();
    await criarUsuario();

    const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // admin + 2 employees
  });

  it('EMPLOYEE chamando GET /usuarios recebe 403', async () => {
    const employee = await criarUsuario();

    const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('sem token retorna 401', async () => {
    const res = await request(app).get('/usuarios');

    expect(res.status).toBe(401);
  });

  it('nunca inclui senha_hash na resposta', async () => {
    const admin = await criarAdmin();

    const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenPara(admin)}`);

    for (const usuario of res.body) {
      expect(usuario.senha_hash).toBeUndefined();
    }
  });
});

describe('GET /usuarios/:id', () => {
  it('EMPLOYEE consultando o próprio id recebe seus dados', async () => {
    const employee = await criarUsuario({ nome: 'Ana Silva' });

    const res = await request(app).get(`/usuarios/${employee.id}`).set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Ana Silva');
  });

  it('EMPLOYEE consultando outro id recebe 403', async () => {
    const employee = await criarUsuario();
    const outro = await criarUsuario();

    const res = await request(app).get(`/usuarios/${outro.id}`).set('Authorization', `Bearer ${tokenPara(employee)}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('ADMIN consulta qualquer id', async () => {
    const admin = await criarAdmin();
    const employee = await criarUsuario();

    const res = await request(app).get(`/usuarios/${employee.id}`).set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(employee.id);
  });

  it('id inexistente retorna 404', async () => {
    const admin = await criarAdmin();

    const res = await request(app).get('/usuarios/999999').set('Authorization', `Bearer ${tokenPara(admin)}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
