const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/app.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('carregarHistorico')) {
  console.log('-- JS do historico ja existe');
  process.exit(0);
}

const js = `

// ===== HISTORICO =====
function fmtDuracaoHist(segundos) {
  if (!segundos || segundos < 0) return '-';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'min';
  return m + ' min';
}
function fmtDataHist(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return dia + '/' + mes + ' ' + hora + ':' + min;
}

async function carregarHistorico() {
  try {
    const [stats, viagens] = await Promise.all([
      authFetch(URL + '/api/passageiros/' + PASSAGEIRO_ID + '/estatisticas').then((r) => r.json()),
      authFetch(URL + '/api/passageiros/' + PASSAGEIRO_ID + '/historico').then((r) => r.json()),
    ]);

    document.getElementById('stat-total').textContent = stats.total_viagens || 0;
    document.getElementById('stat-tempo').textContent = fmtDuracaoHist(stats.tempo_total_segundos || 0);
    document.getElementById('stat-favorito').textContent =
      (stats.pontos_favoritos && stats.pontos_favoritos[0]) ? stats.pontos_favoritos[0].nome : '-';

    const lista = document.getElementById('lista-historico');
    lista.innerHTML = '';
    if (!viagens || viagens.length === 0) {
      lista.innerHTML = '<li class="historico-vazio">Nenhuma viagem no historico ainda.</li>';
      return;
    }
    viagens.forEach((v) => {
      const li = document.createElement('li');
      li.className = 'item-historico';
      li.innerHTML =
        '<div class="linha-topo">' +
          '<span class="linha-cod">Linha ' + (v.linha_codigo || '-') + '</span>' +
          '<span class="linha-data">' + fmtDataHist(v.finalizado_em) + '</span>' +
        '</div>' +
        '<div class="destino">' + (v.ponto_destino_nome || '-') + '</div>' +
        '<div class="detalhe">Onibus ' + (v.onibus_codigo || '-') + ' - ' + fmtDuracaoHist(v.duracao_segundos) + '</div>';
      lista.appendChild(li);
    });
  } catch (e) {
    console.error('Erro ao carregar historico:', e);
  }
}

// Listener do botao
const btnHistorico = document.getElementById('btn-historico');
if (btnHistorico) {
  btnHistorico.addEventListener('click', async () => {
    mostrarTela('historico');
    await carregarHistorico();
  });
}
const btnVoltarInicio = document.getElementById('btn-voltar-inicio');
if (btnVoltarInicio) {
  btnVoltarInicio.addEventListener('click', () => mostrarTela('inicio'));
}
`;

fs.writeFileSync(arq, txt + js, 'utf8');
console.log('OK JS do historico adicionado.');