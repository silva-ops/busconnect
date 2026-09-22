// Detecta a URL do backend automaticamente:
// - Em producao (Render), usa a variavel BACKEND_URL definida em config.js
// - Localmente, usa http://localhost:3000
const URL = (function detectarBackendURL() {
  // Se a pagina esta rodando como file://, sempre localhost
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  // Se estiver em localhost, sempre localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // Em producao, le do window.BUSCONNECT_BACKEND_URL (definido em config.js)
  if (window.BUSCONNECT_BACKEND_URL) return window.BUSCONNECT_BACKEND_URL;
  // Fallback
  return 'http://localhost:3000';
})();
const VIAGEM_ID = 500;

// ===== Elementos =====
const elStatus = document.getElementById('status');
const elProxima = document.getElementById('proxima-parada');
const elNomePonto = document.getElementById('nome-ponto');
const elInfoPass = document.getElementById('info-passageiros');
const elPontoAtual = document.getElementById('ponto-atual');
const elPassageirosAtivos = document.getElementById('passageiros-ativos');
const elGps = document.getElementById('gps');
const elHistorico = document.getElementById('historico-lista');
const elLinha = document.getElementById('linha');
const elOnibus = document.getElementById('onibus');
const elUsuarioLogado = document.getElementById('usuario-logado');
const elLogout = document.getElementById('btn-logout');
const elTelaLogin = document.getElementById('tela-login');
const elFormLogin = document.getElementById('form-login');
const elLoginErro = document.getElementById('login-erro');
const elBtnLogin = elFormLogin.querySelector('.btn-login');

// ===== Autenticação =====
let authToken = localStorage.getItem('busconnect_token_mot') || null;
let usuarioAtual = null;
try {
  const u = localStorage.getItem('busconnect_usuario_mot');
  if (u) usuarioAtual = JSON.parse(u);
} catch (e) { usuarioAtual = null; }

function mostrarLogin() {
  elTelaLogin.classList.remove('escondido');
  if (elUsuarioLogado) elUsuarioLogado.textContent = '';
}

function esconderLogin() {
  elTelaLogin.classList.add('escondido');
  if (usuarioAtual && elUsuarioLogado) {
    elUsuarioLogado.textContent = usuarioAtual.nome + ' (' + usuarioAtual.perfil + ')';
  }
}

function limparSessao() {
  authToken = null;
  usuarioAtual = null;
  localStorage.removeItem('busconnect_token_mot');
  localStorage.removeItem('busconnect_usuario_mot');
}

async function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  if (authToken) opts.headers.Authorization = 'Bearer ' + authToken;
  const r = await fetch(url, opts);
  if (r.status === 401) {
    limparSessao();
    mostrarLogin();
    throw new Error('Sessao expirada');
  }
  return r;
}

elFormLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  elLoginErro.textContent = '';
  elBtnLogin.disabled = true;
  elBtnLogin.textContent = 'ENTRANDO...';

  try {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    const r = await fetch(URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const d = await r.json();

    if (!r.ok || !d.sucesso) {
      elLoginErro.textContent = d.mensagem || 'Credenciais invalidas';
      elBtnLogin.disabled = false;
      elBtnLogin.textContent = 'ENTRAR';
      return;
    }

    if (d.usuario.perfil !== 'MOTORISTA' && d.usuario.perfil !== 'ADMINISTRADOR') {
      elLoginErro.textContent = 'Este painel e apenas para MOTORISTA ou ADMINISTRADOR';
      elBtnLogin.disabled = false;
      elBtnLogin.textContent = 'ENTRAR';
      return;
    }

    authToken = d.token;
    usuarioAtual = d.usuario;
    localStorage.setItem('busconnect_token_mot', authToken);
    localStorage.setItem('busconnect_usuario_mot', JSON.stringify(usuarioAtual));

    esconderLogin();
    carregarDadosViagem();
  } catch (err) {
    elLoginErro.textContent = 'Erro de conexao: ' + err.message;
  } finally {
    elBtnLogin.disabled = false;
    elBtnLogin.textContent = 'ENTRAR';
  }
});

elLogout.addEventListener('click', () => {
  limparSessao();
  mostrarLogin();
  document.getElementById('login-senha').value = '';
});

// ===== Mapa =====
let mapa = null;
let marcadorOnibus = null;
let marcadorDestino = null;
let linhaRota = null;
let pontosRota = [];

function log(msg, destaque = false) {
  const li = document.createElement('li');
  li.textContent = new Date().toLocaleTimeString('pt-BR') + '  ' + msg;
  if (destaque) li.classList.add('destaque');
  elHistorico.prepend(li);
  while (elHistorico.children.length > 30) elHistorico.lastChild.remove();
}

async function inicializarMapa() {
  if (mapa) return;
  try {
    pontosRota = await authFetch(URL + '/api/viagens/' + VIAGEM_ID + '/pontos').then((r) => r.json());
  } catch (e) {
    console.error('Erro ao carregar pontos:', e);
    return;
  }
  if (pontosRota.length === 0) return;

  const inicio = pontosRota[0];
  mapa = L.map('mapa-motorista', { zoomControl: true, attributionControl: true })
    .setView([inicio.latitude, inicio.longitude], 14);

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  ).addTo(mapa);

  const coords = pontosRota.map((p) => [p.latitude, p.longitude]);
  linhaRota = L.polyline(coords, { color: '#38bdf8', weight: 5, opacity: 0.85 }).addTo(mapa);

  pontosRota.forEach((p) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="marcador-ponto"></div>',
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    L.marker([p.latitude, p.longitude], { icon }).addTo(mapa).bindPopup(p.nome);
  });

  const iconOnibus = L.divIcon({
    className: '',
    html: '<div class="marcador-onibus">&#128652;</div>',
    iconSize: [34, 34], iconAnchor: [17, 17],
  });
  marcadorOnibus = L.marker([inicio.latitude, inicio.longitude], {
    icon: iconOnibus, zIndexOffset: 2000,
  }).addTo(mapa);

  mapa.fitBounds(linhaRota.getBounds(), { padding: [30, 30] });
}

function moverOnibus(lat, lng) {
  if (!mapa || !marcadorOnibus) return;
  marcadorOnibus.setLatLng([lat, lng]);
}

function marcarDestino(pontoId) {
  if (!mapa) return;
  const ponto = pontosRota.find((p) => p.id === pontoId);
  if (!ponto) return;
  if (marcadorDestino) { mapa.removeLayer(marcadorDestino); marcadorDestino = null; }
  const icon = L.divIcon({
    className: '',
    html: '<div class="marcador-destino">&#127937;</div>',
    iconSize: [30, 30], iconAnchor: [15, 15],
  });
  marcadorDestino = L.marker([ponto.latitude, ponto.longitude], { icon, zIndexOffset: 1000 })
    .addTo(mapa).bindPopup('Desembarque: ' + ponto.nome);
}

// ===== Dados da viagem =====
async function carregarDadosViagem() {
  try {
    const d = await authFetch(URL + '/api/viagens/' + VIAGEM_ID).then((r) => r.json());
    if (d.linha_codigo) elLinha.textContent = 'LINHA ' + d.linha_codigo;
    if (d.onibus_codigo) elOnibus.textContent = 'ONIBUS ' + d.onibus_codigo;
    if (typeof d.passageiros_ativos === 'number') {
      elPassageirosAtivos.textContent = d.passageiros_ativos;
    }
    log('Viagem ' + d.id + ' carregada - linha ' + d.linha_codigo);
  } catch (err) {
    console.error('Erro ao obter viagem:', err);
  }
  inicializarMapa();
}

// ===== WebSocket =====
const socket = io(URL);

socket.on('connect', () => {
  if (!authToken) return;
  elStatus.textContent = 'Conectado';
  elStatus.classList.add('ok');
  socket.emit('inscrever:viagem', VIAGEM_ID);
});

socket.on('disconnect', () => {
  elStatus.textContent = 'Desconectado';
  elStatus.classList.remove('ok');
});

socket.on('inscricao:ok', (d) => {
  if (authToken) log('Inscrito na viagem ' + d.viagemId);
});

socket.on('onibus:localizacao', (d) => {
  if (!authToken) return;
  elGps.textContent = d.latitude.toFixed(5) + ' / ' + d.longitude.toFixed(5);
  moverOnibus(d.latitude, d.longitude);
});

socket.on('viagem:atualizada', (d) => {
  if (!authToken) return;
  if (d.ponto_atual_nome) elPontoAtual.textContent = d.ponto_atual_nome;
  elPassageirosAtivos.textContent = d.passageiros_ativos;
});

socket.on('passageiro:destino_proximo', (d) => {
  if (!authToken) return;
  elNomePonto.textContent = d.ponto_nome || ('Ponto ' + d.ponto_id);
  elInfoPass.textContent = 'APROXIMANDO DO DESTINO';
  elProxima.classList.remove('aviso');
  elProxima.classList.add('aproximando');
  log('Aproximando de: ' + (d.ponto_nome || 'ponto ' + d.ponto_id), true);
});

socket.on('motorista:aviso_desembarque', (d) => {
  if (!authToken) return;
  elNomePonto.textContent = d.ponto_nome;
  elInfoPass.textContent = d.mensagem;
  elProxima.classList.remove('aproximando');
  elProxima.classList.add('aviso');
  setTimeout(() => elProxima.classList.remove('aviso'), 6000);
  log('PROXIMA PARADA: ' + d.ponto_nome + ' - ' + d.passageiros + ' passageiro(s)', true);
  marcarDestino(d.ponto_id);
});

// ===== Inicialização =====
if (authToken) {
  esconderLogin();
  carregarDadosViagem();
} else {
  mostrarLogin();
}