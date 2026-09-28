const pushService = require('../services/pushService');

// POST /api/push/subscribe
exports.subscribe = async (req, res) => {
  try {
    const { passageiro_id, viagem_id, perfil, subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ sucesso: false, mensagem: 'subscription obrigatoria' });
    }
    const { endpoint, keys } = subscription;
    if (!keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ sucesso: false, mensagem: 'keys.p256dh e keys.auth obrigatorios' });
    }

    await pushService.salvarSubscription({
      passageiro_id, viagem_id, perfil, endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return res.json({ sucesso: true, mensagem: 'Subscription registrada' });
  } catch (e) {
    console.error('[pushController] Erro subscribe:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// POST /api/push/test
exports.testar = async (req, res) => {
  try {
    const { passageiro_id, perfil } = req.body;
    const payload = {
      titulo: '🔔 Teste BusConnect',
      corpo: 'Se voce esta vendo isso, as notificacoes push estao funcionando!',
      vibrar: [200, 100, 200],
      persistente: false,
      url: '/',
    };

    let resultado;
    if (perfil === 'MOTORISTA') {
      resultado = await pushService.enviarParaMotoristas(payload);
    } else if (passageiro_id) {
      resultado = await pushService.enviarParaPassageiro(passageiro_id, payload);
    } else {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe passageiro_id ou perfil' });
    }

    return res.json({ sucesso: true, resultado });
  } catch (e) {
    console.error('[pushController] Erro testar:', e.message);
    return res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};

// GET /api/push/public-key
exports.publicKey = async (req, res) => {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};