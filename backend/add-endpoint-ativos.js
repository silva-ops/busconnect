const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/backend/src/controllers/empresaController.js';
let txt = fs.readFileSync(arq, 'utf8');

const novoEndpoint = `

// ===== Onibus ativos (com ultima posicao) =====
exports.onibusAtivos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      \`SELECT v.id AS viagem_id,
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
       ORDER BY v.iniciada_em DESC\`
    );
    return res.json(rows);
  } catch (e) {
    console.error('[empresaController] Erro onibus-ativos:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
`;

if (!/onibusAtivos/.test(txt)) {
  txt = txt + novoEndpoint;
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK empresaController.js atualizado.');
} else {
  console.log('-- empresaController.js ja tem onibusAtivos');
}