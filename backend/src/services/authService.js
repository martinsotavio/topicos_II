import ApiError from '../errors/apiError.js';
import { obrigatorio, validar } from '../validation/regras.js';

export function criarAuthService({ usuarioRepository, hashService, tokenService }) {
  async function registrar({ nome, email, senha }) {
    const erro = validar({ nome, email, senha }, [
      obrigatorio('nome'),
      obrigatorio('email'),
      obrigatorio('senha')
    ]);
    if (erro) throw new ApiError(400, 'VALIDATION_ERROR', erro);

    if (usuarioRepository.buscarPorEmail(email)) {
      throw new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.');
    }

    const senhaHash = await hashService.hash(senha);
    return usuarioRepository.criar({ nome, email, senhaHash });
  }

  async function login({ email, senha }) {
    const usuario = usuarioRepository.buscarPorEmail(email);
    const senhaValida = usuario && (await hashService.comparar(senha, usuario.senha_hash));

    if (!senhaValida) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    const token = tokenService.gerar({ sub: usuario.id, nome: usuario.nome, email: usuario.email });
    return token;
  }

  return { registrar, login };
}
