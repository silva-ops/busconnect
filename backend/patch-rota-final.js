const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/app.js';
let txt = fs.readFileSync(arq, 'utf8');

// Substitui restaurarRotasConhecidas por uma versao que busca do banco
// se nao houver rotas em memoria.
const novoBloco = `
async function restaurarRotasConhecidas() {
  if (!mapaEmpresa) return;

  // Se ja temos rotas em memoria, redesenha
  for (const [rotaId, dados] of ultimasRotas.entries()) {
    if (!rotasDesenhadas.has(rotaId)) {
      desenharRota(rotaId, dados.pontos);
    }
  }

  // Se nao temos nada em memoria, busca a viagem mais recente do banco
  if (ultimasRotas.size === 0) {
    try {
      const viagens = await fetch(URL + '/api/empresa/viagens').then((r) => r.json());
      if (viagens.length === 0) return;

      const ultima = viagens[0];
      const pontos = await fetch(URL + '/api/viagens/' + ultima.id + '/pontos').then((r) => r.json());
      if (pontos.length === 0) return;

      ultimasRotas.set(ultima.rota_id || ultima.id, { viagem_id: ultima.id, pontos: pontos });
      if (!rotasDesenhadas.has(ultima.rota_id || ultima.id)) {
        desenharRota(ultima.rota_id || ultima.id, pontos);
      }
    } catch (e) {
      console.error('Erro ao restaurar rota:', e);
    }
  }
}

function desenharRota(rotaId, pontos) {
  if (!mapaEmpresa || rotasDesenhadas.has(rotaId)) return;

  const coords = pontos.map((p) => [p.latitude, p.longitude]);
  const poly = L.polyline(coords, {
    color: '#38bdf8',
    weight: 4,
    opacity: 0.55,
    dashArray: '6,6',
  }).addTo(mapaEmpresa);
  rotasDesenhadas.set(rotaId, poly);

  pontos.forEach((p) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="marcador-ponto-emp"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    L.marker([p.latitude, p.longitude], { icon }).addTo(mapaEmpresa).bindPopup(p.nome);
  });

  mapaEmpresa.fitBounds(poly.getBounds(), { padding: [30, 30] });
}
`;

// Substitui a funcao restaurarRotasConhecidas inteira (se existir)
const regexRestaurar = /async function restaurarRotasConhecidas\(\) \{[\s\S]*?\n\}/;

if (regexRestaurar.test(txt)) {
  txt = txt.replace(regexRestaurar, novoBloco.trim());
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK restaurarRotasConhecidas substituida.');
} else {
  // Se nao existe, adiciona antes de carregarOnibusAtivos
  txt = txt.replace(
    /async function carregarOnibusAtivos\(\) \{/,
    novoBloco + '\nasync function carregarOnibusAtivos() {'
  );
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK funcao adicionada.');
}