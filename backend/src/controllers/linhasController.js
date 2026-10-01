const pool = require('../database/pool');

// GET /api/linhas — lista todas as linhas com contagem de viagens ativas
exports.listar = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.codigo, l.nome,
              (SELECT COUNT(*)::int FROM viagens v
                WHERE v.linha_id = l.id AND v.status = 'EM_ANDAMENTO') AS viagens_ativas
       FROM linhas l
       ORDER BY l.codigo`
    );
    return res.json(rows);
  } catch (e) {
    console.error('[linhasController] Erro listar:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// GET /api/linhas/:id — detalhes da linha
exports.obter = async (req, res) => {
  try {
    const linhaId = parseInt(req.params.id, 10);
    if (isNaN(linhaId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      'SELECT id, codigo, nome FROM linhas WHERE id = $1', [linhaId]
    );
    if (rows.length === 0) return res.status(404).json({ sucesso: false, mensagem: 'Linha nao encontrada' });
    return res.json(rows[0]);
  } catch (e) {
    console.error('[linhasController] Erro obter:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// GET /api/linhas/:id/viagens-ativas — viagens EM_ANDAMENTO da linha
exports.viagensAtivas = async (req, res) => {
  try {
    const linhaId = parseInt(req.params.id, 10);
    if (isNaN(linhaId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id,
              v.status,
              o.codigo AS onibus_codigo,
              o.placa  AS onibus_placa,
              v.rota_id,
              (SELECT COUNT(*)::int FROM viagens_passageiros vp
                WHERE vp.viagem_id = v.id AND vp.status <> 'FINALIZADO') AS passageiros_ativos
       FROM viagens v
       LEFT JOIN onibus o ON o.id = v.onibus_id
       WHERE v.linha_id = $1 AND v.status = 'EM_ANDAMENTO'
       ORDER BY v.iniciada_em DESC`,
      [linhaId]
    );
    return res.json(rows);
  } catch (e) {
    console.error('[linhasController] Erro viagensAtivas:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// GET /api/linhas/:id/pontos — todos os pontos da(s) rota(s) da linha
exports.pontos = async (req, res) => {
  try {
    const linhaId = parseInt(req.params.id, 10);
    if (isNaN(linhaId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      `SELECT DISTINCT p.id, p.nome,
              p.latitude::float AS latitude,
              p.longitude::float AS longitude,
              rp.ordem
       FROM linhas l
       JOIN rotas r ON r.linha_id = l.id
       JOIN rota_pontos rp ON rp.rota_id = r.id
       JOIN pontos p ON p.id = rp.ponto_id
       WHERE l.id = $1
       ORDER BY rp.ordem`,
      [linhaId]
    );
    return res.json(rows);
  } catch (e) {
    console.error('[linhasController] Erro pontos:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};