const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/pool');
const { JWT_SECRET } = require('../middleware/auth');

const PERFIS_VALIDOS = ['PASSAGEIRO', 'MOTORISTA', 'EMPRESA', 'ADMINISTRADOR'];
const VALIDADE_TOKEN = '7d';

function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      nome: usuario.nome,
    },
    JWT_SECRET,
    { expiresIn: VALIDADE_TOKEN }
  );
}

// ===== Helper: obter ou criar passageiro para um usuario =====
async function obterOuCriarPassageiro(usuarioId) {
  const { rows } = await pool.query(
    'SELECT id FROM passageiros WHERE usuario_id = $1',
    [usuarioId]
  );
  if (rows.length > 0) return rows[0].id;

  const insert = await pool.query(
    'INSERT INTO passageiros (usuario_id) VALUES ($1) RETURNING id',
    [usuarioId]
  );
  return insert.rows[0].id;
}

// ===== POST /api/auth/registro =====
exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ sucesso: false, mensagem: 'nome, email, senha e perfil sao obrigatorios' });
    }
    if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Perfil invalido' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ sucesso: false, mensagem: 'Senha deve ter no minimo 6 caracteres' });
    }

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ sucesso: false, mensagem: 'Email ja cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, perfil, criado_em`,
      [nome, email, hash, perfil]
    );

    const usuario = rows[0];
    const token = gerarToken(usuario);

    // Se for PASSAGEIRO, cria registro em passageiros automaticamente
    let passageiroId = null;
    if (perfil === 'PASSAGEIRO') {
      passageiroId = await obterOuCriarPassageiro(usuario.id);
    }

    return res.status(201).json({
      sucesso: true,
      usuario: { ...usuario, passageiro_id: passageiroId },
      token,
    });
  } catch (e) {
    console.error('[authController] Erro registrar:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== POST /api/auth/login =====
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'email e senha sao obrigatorios' });
    }

    const { rows } = await pool.query(
      'SELECT id, nome, email, perfil, senha_hash FROM usuarios WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais invalidas' });
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais invalidas' });
    }

    const token = gerarToken(usuario);

    // Se for PASSAGEIRO, retorna (e cria se nao existir) o passageiro_id
    let passageiroId = null;
    if (usuario.perfil === 'PASSAGEIRO' || usuario.perfil === 'ADMINISTRADOR') {
      passageiroId = await obterOuCriarPassageiro(usuario.id);
    }

    return res.json({
      sucesso: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        passageiro_id: passageiroId,
      },
      token,
    });
  } catch (e) {
    console.error('[authController] Erro login:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== GET /api/auth/me =====
exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuario nao encontrado' });
    }

    const usuario = rows[0];

    let passageiroId = null;
    if (usuario.perfil === 'PASSAGEIRO' || usuario.perfil === 'ADMINISTRADOR') {
      passageiroId = await obterOuCriarPassageiro(usuario.id);
    }

    return res.json({
      sucesso: true,
      usuario: { ...usuario, passageiro_id: passageiroId },
    });
  } catch (e) {
    console.error('[authController] Erro me:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};