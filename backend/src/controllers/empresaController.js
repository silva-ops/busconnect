const pool = require('../database/pool');

// ===== KPIs do topo =====
exports.resumo = async (req, res) => {
  try {
    const [onibus, viagensAtivas, passAtivos, passTransportados, linhasAtivas] = await Promise.all([
      pool.query(`SELECT COUNT(DISTINCT onibus_id)::int AS n
                  FROM viagens WHERE status = 'EM_ANDAMENTO'`),
      pool.query(`SELECT COUNT(*)::int AS n FROM viagens WHERE status = 'EM_ANDAMENTO'`),
      pool.query(`SELECT COUNT(*)::int AS n
                  FROM viagens_passageiros WHERE status <> 'FINALIZADO'`),
      pool.query(`SELECT COUNT(*)::int AS n
                  FROM viagens_passageiros
                  WHERE status = 'FINALIZADO' AND DATE(finalizado_em) = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*)::int AS n FROM linhas`),
    ]);

    return res.json({
      onibus_em_operacao: onibus.rows[0].n,
      viagens_ativas: viagensAtivas.rows[0].n,
      passageiros_ativos: passAtivos.rows[0].n,
      passageiros_transportados_hoje: passTransportados.rows[0].n,
      total_linhas: linhasAtivas.rows[0].n,
    });
  } catch (e) {
    console.error('[empresaController] Erro resumo:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== Lista de viagens (ativas + histórico) =====
exports.listarViagens = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.status, v.iniciada_em, v.finalizada_em,
              l.codigo AS linha_codigo, l.nome AS linha_nome,
              o.codigo AS onibus_codigo, o.placa AS onibus_placa,
              (SELECT COUNT(*)::int FROM viagens_passageiros WHERE viagem_id = v.id) AS total_passageiros,
              (SELECT COUNT(*)::int FROM viagens_passageiros WHERE viagem_id = v.id AND status = 'FINALIZADO') AS passageiros_chegaram
       FROM viagens v
       LEFT JOIN linhas l ON l.id = v.linha_id
       LEFT JOIN onibus o ON o.id = v.onibus_id
       ORDER BY v.iniciada_em DESC
       LIMIT 50`
    );
    return res.json(rows);
  } catch (e) {
    console.error('[empresaController] Erro viagens:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== Passageiros de uma viagem =====
exports.passageirosDaViagem = async (req, res) => {
  try {
    const viagemId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT vp.passageiro_id,
              vp.status,
              vp.embarcou_em,
              vp.chegou_em,
              vp.finalizado_em,
              p.nome AS ponto_destino_nome
       FROM viagens_passageiros vp
       LEFT JOIN pontos p ON p.id = vp.ponto_destino_id
       WHERE vp.viagem_id = $1
       ORDER BY vp.passageiro_id`,
      [viagemId]
    );
    return res.json(rows);
  } catch (e) {
    console.error('[empresaController] Erro passageiros:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== Estatísticas =====
exports.estatisticas = async (req, res) => {
  try {
    const tempoMedio = await pool.query(
      `SELECT
         COALESCE(AVG(EXTRACT(EPOCH FROM (finalizado_em - embarcou_em))), 0)::int AS tempo_medio_segundos,
         COUNT(*)::int AS total_finalizados
       FROM viagens_passageiros
       WHERE status = 'FINALIZADO'
         AND embarcou_em IS NOT NULL
         AND finalizado_em IS NOT NULL`
    );

    const pontosMaisUsados = await pool.query(
      `SELECT p.nome, COUNT(*)::int AS desembarques
       FROM viagens_passageiros vp
       JOIN pontos p ON p.id = vp.ponto_destino_id
       WHERE vp.status = 'FINALIZADO'
       GROUP BY p.nome
       ORDER BY desembarques DESC
       LIMIT 5`
    );

    const passageirosPorLinha = await pool.query(
      `SELECT l.codigo AS linha_codigo, l.nome AS linha_nome, COUNT(*)::int AS passageiros
       FROM viagens_passageiros vp
       JOIN viagens v ON v.id = vp.viagem_id
       JOIN linhas l ON l.id = v.linha_id
       GROUP BY l.codigo, l.nome
       ORDER BY passageiros DESC`
    );

    return res.json({
      tempo_medio_segundos: tempoMedio.rows[0].tempo_medio_segundos,
      total_finalizados: tempoMedio.rows[0].total_finalizados,
      pontos_mais_usados: pontosMaisUsados.rows,
      passageiros_por_linha: passageirosPorLinha.rows,
    });
  } catch (e) {
    console.error('[empresaController] Erro estatisticas:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== Frota / linhas / pontos / rotas / motoristas =====
exports.linhas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, codigo, nome FROM linhas ORDER BY codigo`
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ sucesso: false, mensagem: e.message }); }
};

exports.rotas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.sentido,
              l.codigo AS linha_codigo, l.nome AS linha_nome,
              (SELECT COUNT(*)::int FROM rota_pontos WHERE rota_id = r.id) AS total_pontos
       FROM rotas r
       LEFT JOIN linhas l ON l.id = r.linha_id
       ORDER BY r.id`
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ sucesso: false, mensagem: e.message }); }
};

exports.pontos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, latitude::float AS latitude, longitude::float AS longitude
       FROM pontos ORDER BY nome`
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ sucesso: false, mensagem: e.message }); }
};

exports.motoristas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.cnh,
              u.nome AS usuario_nome, u.email AS usuario_email,
              e.nome AS empresa_nome
       FROM motoristas m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       LEFT JOIN empresas e ON e.id = m.empresa_id
       ORDER BY m.id`
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ sucesso: false, mensagem: e.message }); }
};

exports.onibus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.codigo, o.placa, o.capacidade,
              e.nome AS empresa_nome
       FROM onibus o
       LEFT JOIN empresas e ON e.id = o.empresa_id
       ORDER BY o.codigo`
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ sucesso: false, mensagem: e.message }); }
};

// ===== Onibus ativos (com ultima posicao) =====
exports.onibusAtivos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.id AS viagem_id,
              v.status AS viagem_status,
              l.codigo AS linha_codigo,
              l.nome   AS linha_nome,
              o.codigo AS onibus_codigo,
              o.placa  AS onibus_placa,
              v.rota_id,
              (SELECT latitude::float  FROM localizacoes_onibus
                WHERE viagem_id = v.id ORDER BY timestamp DESC LIMIT 1) AS ultima_latitude,
              (SELECT longitude::float FROM localizacoes_onibus
                WHERE viagem_id = v.id ORDER BY timestamp DESC LIMIT 1) AS ultima_longitude,
              (SELECT timestamp FROM localizacoes_onibus
                WHERE viagem_id = v.id ORDER BY timestamp DESC LIMIT 1) AS ultima_timestamp
       FROM viagens v
       LEFT JOIN linhas l ON l.id = v.linha_id
       LEFT JOIN onibus o ON o.id = v.onibus_id
       WHERE v.status = 'EM_ANDAMENTO'
       ORDER BY v.iniciada_em DESC`
    );
    return res.json(rows);
  } catch (e) {
    console.error('[empresaController] Erro onibus-ativos:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
