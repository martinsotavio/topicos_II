import api from "./api";

// Usa a instância do axios de api.js, que já envia o token salvo no login (localStorage).
async function requisicao(config) {
  try {
    const response = await api.request(config);
    // 204 No Content (ex.: DELETE) não tem corpo.
    return response.status === 204 ? null : response.data;
  } catch (error) {
    if (!error.response) {
      throw new Error('Não foi possível conectar à API. Verifique se o backend está rodando.', { cause: error });
    }

    // A API responde erros no formato { error: { code, message } }.
    const { status, data } = error.response;
    const erro = new Error(data?.error?.message || `Erro ${status} ao acessar a API.`, { cause: error });
    erro.status = status;
    erro.code = data?.error?.code;
    throw erro;
  }
}

export function listarUsuarios() {
  return requisicao({ url: '/usuarios' });
}

export function cadastrarUsuario(dados) {
  return requisicao({ url: '/auth/registrar', method: 'POST', data: dados });
}

export function atualizarUsuario(id, dados) {
  return requisicao({ url: `/usuarios/${id}`, method: 'PUT', data: dados });
}

export function removerUsuario(id) {
  return requisicao({ url: `/usuarios/${id}`, method: 'DELETE' });
}
