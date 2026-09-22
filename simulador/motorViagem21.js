const { distanciaMetros, pontoMaisProximo } = require('./geo');

const RAIO_APROXIMACAO_METROS = 300;
const RAIO_CHEGADA_METROS = 50;

const ESTADOS = Object.freeze({
  AGUARDANDO: 'AGUARDANDO',
  EMBARCADO: 'EMBARCADO',
  EM_VIAGEM: 'EM_VIAGEM',
  APROXIMANDO_DESTINO: 'APROXIMANDO_DESTINO',
  DESTINO_ALCANCADO: 'DESTINO_ALCANCADO',
  FINALIZADO: 'FINALIZADO',
});

class MotorViagem21 {
  constructor() {
    this.viagens = new Map();
  }

  registrarViagem({ viagemId, linhaId, onibusId, pontos }) {
    if (!viagemId) throw new Error('viagemId obrigatorio');
    if (!Array.isArray(pontos) || pontos.length === 0) {
      throw new Error('pontos obrigatorios');
    }
    const pontosOrdenados = [...pontos].sort((a, b) => a.ordem - b.ordem);
    this.viagens.set(viagemId, {
      viagemId, linhaId, onibusId,
      pontos: pontosOrdenados,
      indicePontoAtual: 0,
      ultimaPosicao: null,
      passageiros: new Map(),
      viagemFinalizada: false,
    });
    return this.viagens.get(viagemId);
  }

  registrarPassageiro({ viagemId, passageiroId, pontoDestinoId }) {
    const viagem = this.viagens.get(viagemId);
    if (!viagem) throw new Error('Viagem ' + viagemId + ' nao registrada');
    const pontoExiste = viagem.pontos.some((p) => p.id === pontoDestinoId);
    if (!pontoExiste) throw new Error('Ponto destino ' + pontoDestinoId + ' nao pertence a rota');
    viagem.passageiros.set(passageiroId, {
      passageiroId, pontoDestinoId,
      status: ESTADOS.EM_VIAGEM,
      notificadoAproximacao: false,
      notificadoChegada: false,
    });
    return viagem.passageiros.get(passageiroId);
  }

  processarLocalizacao({ viagemId, onibusId, latitude, longitude, velocidade, timestamp }) {
    const viagem = this.viagens.get(viagemId);
    if (!viagem) return { eventos: [], erro: 'Viagem ' + viagemId + ' nao registrada' };

    viagem.ultimaPosicao = { latitude, longitude, velocidade, timestamp };
    const eventos = [];

    const maisProximo = pontoMaisProximo(latitude, longitude, viagem.pontos);
    if (!maisProximo) return { eventos };

    const pontoAtualIdx = viagem.pontos.findIndex((p) => p.id === maisProximo.ponto.id);
    if (pontoAtualIdx > viagem.indicePontoAtual) {
      viagem.indicePontoAtual = pontoAtualIdx;
    }
    const pontoAtual = viagem.pontos[viagem.indicePontoAtual];

    const porDestino = new Map();
    for (const p of viagem.passageiros.values()) {
      if (p.status === ESTADOS.FINALIZADO) continue;
      if (!porDestino.has(p.pontoDestinoId)) porDestino.set(p.pontoDestinoId, []);
      porDestino.get(p.pontoDestinoId).push(p);
    }

    for (const [pontoDestinoId, passageiros] of porDestino.entries()) {
      const pontoDestino = viagem.pontos.find((p) => p.id === pontoDestinoId);
      if (!pontoDestino) continue;

      const distDestino = distanciaMetros(
        latitude, longitude, pontoDestino.latitude, pontoDestino.longitude
      );

      if (distDestino <= RAIO_APROXIMACAO_METROS && distDestino > RAIO_CHEGADA_METROS) {
        for (const p of passageiros) {
          if (!p.notificadoAproximacao && p.status !== ESTADOS.FINALIZADO) {
            p.notificadoAproximacao = true;
            p.status = ESTADOS.APROXIMANDO_DESTINO;
            eventos.push({
              evento: 'passageiro:destino_proximo',
              passageiro_id: p.passageiroId,
              ponto_id: pontoDestino.id,
              ponto_nome: pontoDestino.nome,
              distancia_metros: Math.round(distDestino),
              mensagem: 'Seu destino esta proximo. Prepare-se para desembarcar.',
            });
          }
        }
      }

      if (distDestino <= RAIO_CHEGADA_METROS) {
        const pendentes = passageiros.filter(
          (p) => !p.notificadoChegada && p.status !== ESTADOS.FINALIZADO
        );
        if (pendentes.length > 0) {
          eventos.push({
            evento: 'motorista:aviso_desembarque',
            viagem_id: viagemId,
            ponto_id: pontoDestino.id,
            ponto_nome: pontoDestino.nome,
            passageiros: pendentes.length,
            mensagem: pendentes.length === 1
              ? '1 passageiro desembarca na proxima parada (' + pontoDestino.nome + ')'
              : pendentes.length + ' passageiros desembarcam na proxima parada (' + pontoDestino.nome + ')',
          });
        }
        for (const p of pendentes) {
          p.notificadoChegada = true;
          p.status = ESTADOS.DESTINO_ALCANCADO;
          eventos.push({
            evento: 'passageiro:chegou',
            passageiro_id: p.passageiroId,
            ponto_id: pontoDestino.id,
            ponto_nome: pontoDestino.nome,
            mensagem: 'VOCE CHEGOU',
          });
          p.status = ESTADOS.FINALIZADO;
        }
      }
    }

    const ultimoIdx = viagem.pontos.length - 1;
    const pontoFinal = viagem.pontos[ultimoIdx];
    const distUltimo = distanciaMetros(
      latitude, longitude, pontoFinal.latitude, pontoFinal.longitude
    );

    if (
      !viagem.viagemFinalizada &&
      viagem.indicePontoAtual === ultimoIdx &&
      distUltimo <= RAIO_CHEGADA_METROS
    ) {
      viagem.viagemFinalizada = true;

      const restantes = [...viagem.passageiros.values()].filter(
        (p) => p.status !== ESTADOS.FINALIZADO
      );
      for (const p of restantes) {
        p.notificadoChegada = true;
        p.status = ESTADOS.FINALIZADO;
      }

      eventos.push({
        evento: 'viagem:finalizada',
        viagem_id: viagemId,
        ponto_final_id: pontoFinal.id,
        ponto_final_nome: pontoFinal.nome,
        timestamp,
      });
    }

    eventos.push({
      evento: 'viagem:atualizada',
      viagem_id: viagemId,
      ponto_atual_id: pontoAtual ? pontoAtual.id : null,
      ponto_atual_nome: pontoAtual ? pontoAtual.nome : null,
      indice_ponto_atual: viagem.indicePontoAtual,
      passageiros_ativos: [...viagem.passageiros.values()].filter(
        (p) => p.status !== ESTADOS.FINALIZADO
      ).length,
      timestamp,
    });

    return { eventos };
  }
}

module.exports = {
  MotorViagem21,
  ESTADOS,
  RAIO_APROXIMACAO_METROS,
  RAIO_CHEGADA_METROS,
};