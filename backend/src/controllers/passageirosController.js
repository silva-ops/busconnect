const pool = require('../database/pool');
const localizacaoService = require('../services/localizacaoService');

exports.embarcar = async (req, res) => {
  try {
    const { viagem_id, passageiro_id, ponto_destino_id } = req.body;

    if (!viagem_id || !passageiro_id || !ponto_destino_id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'viagem_id, passageiro_id e ponto_destino_id sao obrigatorios',
      });
    }

    // 1) Verifica se o ponto pertence a rota da viagem
    const { rows: pontosRota } = await pool.query(
      `SELECT p.id, p.nome
       FROM viagens v
       JOIN rota_pontos rp ON rp.rota_id = v.rota_id
       JOIN pontos p ON p.id = rp.ponto_id
       WHERE v.id = $1 AND p.id = $2`,
      [viagem_id, ponto_destino_id]
    );
    if (pontosRota.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Ponto nao pertence a rota da viagem' });
    }

    // 2) Atualiza (ou cria) o registro do passageiro na viagem
    await pool.query(
      `INSERT INTO viagens_passageiros
         (viagem_id, passageiro_id, ponto_destino_id, status, notificado_aproximacao, notificado_chegada, embarcou_em)
       VALUES ($1, $2, $3, 'EM_VIAGEM', FALSE, FALSE, NOW())
       ON CONFLICT (viagem_id, passageiro_id)
       DO UPDATE SET
         ponto_destino_id = EXCLUDED.ponto_destino_id,
         status = 'EM_VIAGEM',
         notificado_aproximacao = FALSE,
         notificado_chegada = FALSE,
         embarcou_em = NOW(),
         chegou_em = NULL,
         finalizado_em = NULL`,
      [viagem_id, passageiro_id, ponto_destino_id]
    );

    // 3) Invalida o cache do motor (forca recarga no proximo GPS)
    localizacaoService.invalidarViagem(viagem_id);

    return res.json({
      sucesso: true,
      mensagem: 'Embarque registrado',
      viagem_id,
      passageiro_id,
      ponto_destino: pontosRota[0].nome,
    });
  } catch (e) {
    console.error('[passageirosController] Erro:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};