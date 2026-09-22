const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/app.js';
let txt = fs.readFileSync(arq, 'utf8');

// Guarda a ultima lista de rotas conhecidas globalmente
if (!/let\s+ultimasRotas/.test(txt)) {
  txt = txt.replace(
    /let\s+inicializadoMapa = false;/,
    "let inicializadoMapa = false;\nlet ultimasRotas = new Map();"
  );
}

// Adiciona funcao restaurarRotasConhecidas
if (!/restaurarRotasConhecidas/.test(txt)) {
  const func = `
async function restaurarRotasConhecidas() {
  if (!mapaEmpresa) return;
  for (const [rotaId, dados] of ultimasRotas.entries()) {
    if (!rotasDesenhadas.has(rotaId)) {
      const coords = dados.pontos.map((p) => [p.latitude, p.longitude]);
      const poly = L.polyline(coords, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.45,
        dashArray: '6,6',
      }).addTo(mapaEmpresa);
      rotasDesenhadas.set(rotaId, poly);

      dados.pontos.forEach((p) => {
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
  }
}
`;
  txt = txt.replace(
    /async function carregarOnibusAtivos\(\) \{/,
    func + '\nasync function carregarOnibusAtivos() {'
  );

  // Chama antes do loop de ativos
  txt = txt.replace(
    /const idsAtivos = new Set\(ativos\.map\(\(a\) => a\.viagem_id\)\);/,
    "await restaurarRotasConhecidas();\n\n  const idsAtivos = new Set(ativos.map((a) => a.viagem_id));"
  );

  // Salva cada rota descoberta em ultimasRotas
  txt = txt.replace(
    /pontosPorRota\.set\(a\.rota_id, pontos\);/,
    "pontosPorRota.set(a.rota_id, pontos);\n        ultimasRotas.set(a.rota_id, { viagem_id: a.viagem_id, pontos: pontos });"
  );
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK app.js atualizado.');