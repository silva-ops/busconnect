const axios = require('axios');
const rota = require('./rota-teste');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVALO_MS = 1000;
const VELOCIDADE_KMH = 30;

function construirTrilha(pontos, passosPorTrecho = 20) {
  const trilha = [];
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i];
    const b = pontos[i + 1];
    for (let s = 0; s < passosPorTrecho; s++) {
      const t = s / passosPorTrecho;
      trilha.push({
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      });
    }
  }
  const ultimo = pontos[pontos.length - 1];
  trilha.push({ latitude: ultimo.latitude, longitude: ultimo.longitude });
  return trilha;
}

async function enviarLocalizacao(pos) {
  const payload = {
    onibus_id: rota.onibusId,
    viagem_id: rota.viagemId,
    latitude: pos.latitude,
    longitude: pos.longitude,
    velocidade: VELOCIDADE_KMH,
    timestamp: new Date().toISOString(),
  };

  try {
    const { data } = await axios.post(API_URL + '/api/onibus/localizacao', payload);
    console.log(
      '[GPS] lat=' + pos.latitude.toFixed(5) +
      ' lng=' + pos.longitude.toFixed(5) +
      ' -> ' + data.mensagem +
      ' (' + (data.eventos || []).length + ' eventos)'
    );
    for (const ev of data.eventos || []) {
      if (ev.evento === 'motorista:aviso_desembarque') {
        console.log('   >>> MOTORISTA:', ev.mensagem);
      }
      if (ev.evento === 'passageiro:destino_proximo') {
        console.log('   >>> PASSAGEIRO (aproximando):', ev.mensagem);
      }
      if (ev.evento === 'passageiro:chegou') {
        console.log('   >>> PASSAGEIRO:', ev.mensagem, '-', ev.ponto_nome);
      }
    }
  } catch (err) {
    const msg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error('[ERRO] Falha ao enviar localizacao:', msg);
  }
}

async function main() {
  console.log('[BusConnect] Simulador iniciado');
  console.log('[BusConnect] Enviando para ' + API_URL + '/api/onibus/localizacao');
  const trilha = construirTrilha(rota.pontos, 20);
  console.log('[BusConnect] Trilha com ' + trilha.length + ' posicoes');

  let i = 0;
  const timer = setInterval(async () => {
    if (i >= trilha.length) {
      clearInterval(timer);
      console.log('[BusConnect] Fim da rota. Simulador encerrado.');
      return;
    }
    await enviarLocalizacao(trilha[i]);
    i++;
  }, INTERVALO_MS);
}

main();
