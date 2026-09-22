const localizacaoService = require('../services/localizacaoService');

function validarPayload(body) {
  const campos = ['onibus_id', 'viagem_id', 'latitude', 'longitude'];
  for (const c of campos) {
    if (body[c] === undefined || body[c] === null) {
      return 'Campo obrigatorio ausente: ' + c;
    }
  }
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    return 'latitude e longitude devem ser numericos';
  }
  return null;
}

exports.receberLocalizacao = async (req, res) => {
  const erro = validarPayload(req.body);
  if (erro) return res.status(400).json({ sucesso: false, mensagem: erro });

  const { onibus_id, viagem_id, latitude, longitude, velocidade, timestamp } = req.body;

  try {
    const resultado = await localizacaoService.processarLocalizacao({
      viagemId: viagem_id,
      onibusId: onibus_id,
      latitude, longitude,
      velocidade: velocidade ?? 0,
      timestamp: timestamp ?? new Date().toISOString(),
    });

    if (resultado.erro) {
      return res.status(404).json({ sucesso: false, mensagem: resultado.erro });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Localizacao recebida',
      eventos: resultado.eventos,
    });
  } catch (e) {
    console.error('[controller] Erro:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
