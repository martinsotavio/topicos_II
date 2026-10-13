import ApiError from '../errors/apiError.js';

export function permitir(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.'));
    }
    next();
  };
}
