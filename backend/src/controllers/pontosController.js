const pool = require('../database/pool');

exports.listarPontos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, latitude::float AS latitude, longitude::float AS longitude FROM pontos ORDER BY nome'
    );
    return res.json(rows);
  } catch (e) {
    console.error('[pontosController] Erro:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};