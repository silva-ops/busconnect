const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/backend/src/controllers/passageirosController.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('exports.historico')) {
  console.log('-- endpoints ja existem');
  process.exit(0);
}

const novosEndpoints = `

// ===== GET /api/passageiros/:id/historico =====
exports.historico = async (req, res) => {
  try {
    const passageiroId = parseInt(req.params.id, 10);
    if (isNaN(passageiroId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const { rows } = await pool.query(
      \`SELECT v.id AS viagem_id,
              l.codigo AS linha_codigo,
              l.nome   AS linha_nome,
              o.codigo AS onibus_codigo,
              o.placa  AS onibus_placa,
              p.nome   AS ponto_destino_nome,
              vp.embarcou_em,
              vp.chegou_em,
              vp.finalizado_em,
              EXTRACT(EPOCH FROM (vp.finalizado_em - vp.embarcou_em))::int AS duracao_segundos
       FROM viagens_passageiros vp
       JOIN viagens v ON v.id = vp.viagem_id
       LEFT JOIN linhas l ON l.id = v.linha_id
       LEFT JOIN onibus o ON o.id = v.onibus_id
       LEFT JOIN pontos p ON p.id = vp.ponto_destino_id
       WHERE vp.passageiro_id = $1 AND vp.status = 'FINALIZADO'
       ORDER BY vp.finalizado_em DESC
       LIMIT 50\`,
      [passageiroId]
    );

    return res.json(rows);
  } catch (e) {
    console.error('[passageirosController] Erro historico:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// ===== GET /api/passageiros/:id/estatisticas =====
exports.estatisticas = async (req, res) => {
  try {
    const passageiroId = parseInt(req.params.id, 10);
    if (isNaN(passageiroId)) return res.status(400).json({ sucesso: false, mensagem: 'id invalido' });

    const totais = await pool.query(
      \`SELECT COUNT(*)::int AS total_viagens,
              COALESCE(SUM(EXTRACT(EPOCH FROM (finalizado_em - embarcou_em))), 0)::int AS tempo_total_segundos
       FROM viagens_passageiros
       WHERE passageiro_id = $1 AND status = 'FINALIZADO'\`,
      [passageiroId]
    );

    const favoritos = await pool.query(
      \`SELECT p.nome, COUNT(*)::int AS total
       FROM viagens_passageiros vp
       JOIN pontos p ON p.id = vp.ponto_destino_id
       WHERE vp.passageiro_id = $1 AND vp.status = 'FINALIZADO'
       GROUP BY p.nome
       ORDER BY total DESC
       LIMIT 3\`,
      [passageiroId]
    );

    return res.json({
      total_viagens: totais.rows[0].total_viagens,
      tempo_total_segundos: totais.rows[0].tempo_total_segundos,
      pontos_favoritos: favoritos.rows,
    });
  } catch (e) {
    console.error('[passageirosController] Erro estatisticas:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
`;

fs.writeFileSync(arq, txt + novosEndpoints, 'utf8');
console.log('OK endpoints de historico adicionados.');