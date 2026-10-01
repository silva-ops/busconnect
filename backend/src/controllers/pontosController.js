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

// ===== Linhas que passam por um ponto =====
exports.linhasPorPonto = async (req, res) => {
  try {
    const pontoId = parseInt(req.params.id, 10);
    if (isNaN(pontoId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      `SELECT DISTINCT
              l.id, l.codigo, l.nome,
              (SELECT COUNT(*)::int FROM viagens v
                WHERE v.linha_id = l.id AND v.status = 'EM_ANDAMENTO') AS viagens_ativas,
              (SELECT COUNT(*)::int FROM onibus o
                WHERE o.id IN (SELECT onibus_id FROM viagens WHERE linha_id = l.id AND status = 'EM_ANDAMENTO')) AS onibus_disponiveis
       FROM pontos p
       JOIN rota_pontos rp ON rp.ponto_id = p.id
       JOIN rotas r ON r.id = rp.rota_id
       JOIN linhas l ON l.id = r.linha_id
       WHERE p.id = $1
       ORDER BY l.codigo`,
      [pontoId]
    );

    return res.json(rows);
  } catch (e) {
    console.error('[pontosController] Erro linhasPorPonto:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};