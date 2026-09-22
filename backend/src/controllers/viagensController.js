const pool = require('../database/pool');

exports.obterViagem = async (req, res) => {
  try {
    const viagemId = parseInt(req.params.id, 10);
    if (isNaN(viagemId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      `SELECT v.id, v.status,
              l.codigo AS linha_codigo, l.nome AS linha_nome,
              o.codigo AS onibus_codigo, o.placa AS onibus_placa
       FROM viagens v
       LEFT JOIN linhas l ON l.id = v.linha_id
       LEFT JOIN onibus o ON o.id = v.onibus_id
       WHERE v.id = $1`,
      [viagemId]
    );
    if (rows.length === 0) return res.status(404).json({ sucesso: false, mensagem: 'Viagem nao encontrada' });

    const v = rows[0];
    const { rows: passRows } = await pool.query(
      `SELECT COUNT(*)::int AS ativos FROM viagens_passageiros
       WHERE viagem_id = $1 AND status <> 'FINALIZADO'`,
      [viagemId]
    );

    return res.json({
      id: v.id, status: v.status,
      linha_codigo: v.linha_codigo, linha_nome: v.linha_nome,
      onibus_codigo: v.onibus_codigo, onibus_placa: v.onibus_placa,
      passageiros_ativos: passRows[0].ativos,
    });
  } catch (e) {
    console.error('[viagensController] Erro:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

exports.listarPontosDaViagem = async (req, res) => {
  try {
    const viagemId = parseInt(req.params.id, 10);
    if (isNaN(viagemId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      `SELECT p.id, p.nome,
              p.latitude::float AS latitude,
              p.longitude::float AS longitude,
              rp.ordem
       FROM viagens v
       JOIN rota_pontos rp ON rp.rota_id = v.rota_id
       JOIN pontos p ON p.id = rp.ponto_id
       WHERE v.id = $1
       ORDER BY rp.ordem`,
      [viagemId]
    );
    return res.json(rows);
  } catch (e) {
    console.error('[viagensController] Erro:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};