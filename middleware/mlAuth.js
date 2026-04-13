const verificarYRenovarToken = require('../services/tokenService');

function mlAuth(req, res, next) {
  const id_vendedor = req.params.id_vendedor || req.query.id_vendedor || req.body?.id_vendedor;

  if (!id_vendedor) {
    return res.status(400).json({ error: 'Se requiere id_vendedor' });
  }

  verificarYRenovarToken(Number(id_vendedor))
    .then((access_token) => {
      req.ml_access_token = access_token;
      req.id_vendedor = Number(id_vendedor);
      next();
    })
    .catch((err) => {
      console.error('Error en mlAuth middleware:', err.message);
      res.status(401).json({ error: 'No se pudo validar/renovar el token de MercadoLibre' });
    });
}

module.exports = mlAuth;
