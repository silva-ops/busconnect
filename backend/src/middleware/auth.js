const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'busconnect-dev-secret';

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const partes = header.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ sucesso: false, mensagem: 'Token nao fornecido' });
  }

  const token = partes[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ sucesso: false, mensagem: 'Token invalido ou expirado' });
  }
}

function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'Nao autenticado' });
    }
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado para o perfil ' + req.usuario.perfil });
    }
    return next();
  };
}

module.exports = { autenticar, exigirPerfil, JWT_SECRET };