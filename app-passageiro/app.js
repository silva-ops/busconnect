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
const PASSAGEIRO_ID = 10;

// ===== Elementos =====
const elTelaLogin = document.getElementById('tela-login');
const elFormLogin = document.getElementById('form-login');
const elLoginErro = document.getElementById('login-erro');
const elBtnLogin = elFormLogin.querySelector('.btn-login');
const elLogout = document.getElementById('btn-logout');

// ===== Estado =====
let authToken = localStorage.getItem('busconnect_token_pass') || null;
let usuarioAtual = null;
try {
  const u = localStorage.getItem('busconnect_usuario_pass');
  if (u) usuarioAtual = JSON.parse(u);
} catch (e) { usuarioAtual = null; }

let todosPontos = [];
let destinoSelecionado = null;
let pontosRota = [];
let indiceAtual = 0;
let indiceDestino = -1;
let socket = null;
let embarcou = false;

// ===== Mapa =====
let mapa = null;
let marcadorOnibus = null;
let marcadorDestino = null;
let linhaRota = null;
let marcadoresPontos = [];

const telas = {
  inicio: document.getElementById('tela-inicio'),
  recomendado: document.getElementById('tela-recomendado'),
  viagem: document.getElementById('tela-viagem'),
  aproximando: document.getElementById('tela-aproximando'),
  chegou: document.getElementById('tela-chegou'),
};

const inputDestino = document.getElementById('input-destino');
const sugestoes = document.getElementById('sugestoes');
const btnEncontrar = document.getElementById('btn-encontrar');
const btnEmbarcar = document.getElementById('btn-embarcar');
const btnVoltar = document.getElementById('btn-voltar');
const btnNovaViagem = document.getElementById('btn-nova-viagem');

// ===== Auth helpers =====
function mostrarLogin() {
  elTelaLogin.classList.remove('escondido');
}
function esconderLogin() {
  elTelaLogin.classList.add('escondido');
}
function limparSessao() {
  authToken = null;
  usuarioAtual = null;
  localStorage.removeItem('busconnect_token_pass');
  localStorage.removeItem('busconnect_usuario_pass');
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

// ===== Login =====
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

    if (d.usuario.perfil !== 'PASSAGEIRO' && d.usuario.perfil !== 'ADMINISTRADOR') {
      elLoginErro.textContent = 'Este app e apenas para PASSAGEIRO';
      elBtnLogin.disabled = false;
      elBtnLogin.textContent = 'ENTRAR';
      return;
    }

    authToken = d.token;
    usuarioAtual = d.usuario;
    localStorage.setItem('busconnect_token_pass', authToken);
    localStorage.setItem('busconnect_usuario_pass', JSON.stringify(usuarioAtual));

    esconderLogin();
    embarcou = false;
    mostrarTela('inicio');
    inputDestino.value = '';
    sugestoes.innerHTML = '';
    destinoSelecionado = null;
    btnEncontrar.disabled = true;
    carregarPontos();
  } catch (err) {
    elLoginErro.textContent = 'Erro de conexao: ' + err.message;
  } finally {
    elBtnLogin.disabled = false;
    elBtnLogin.textContent = 'ENTRAR';
  }
});

elLogout.addEventListener('click', () => {
  if (socket) { socket.disconnect(); socket = null; }
  embarcou = false;
  destinoSelecionado = null;
  pontosRota = [];
  if (mapa) { mapa.remove(); mapa = null; }
  limparSessao();
  mostrarTela('inicio');
  mostrarLogin();
  document.getElementById('login-senha').value = '';
});

// ===== Navegação =====
function mostrarTela(nome) {
  Object.values(telas).forEach((t) => t.classList.remove('ativa'));
  telas[nome].classList.add('ativa');
  if (nome === 'viagem') setTimeout(inicializarMapa, 100);
}

// ===== Pontos e autocomplete =====
async function carregarPontos() {
  try {
    todosPontos = await authFetch(URL + '/api/pontos').then((r) => r.json());
  } catch (e) {
    console.error('Erro ao carregar pontos:', e);
  }
}

inputDestino.addEventListener('input', () => {
  const q = inputDestino.value.trim().toLowerCase();
  sugestoes.innerHTML = '';
  if (q.length < 1) { btnEncontrar.disabled = true; return; }

  const filtrados = todosPontos.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 6);
  filtrados.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = p.nome;
    li.onclick = () => {
      destinoSelecionado = p;
      inputDestino.value = p.nome;
      sugestoes.innerHTML = '';
      btnEncontrar.disabled = false;
    };
    sugestoes.appendChild(li);
  });
});

btnEncontrar.onclick = async () => {
  if (!destinoSelecionado) { alert('Escolha um destino da lista.'); return; }

  const [viagem, pontos] = await Promise.all([
    authFetch(URL + '/api/viagens/' + VIAGEM_ID).then((r) => r.json()),
    authFetch(URL + '/api/viagens/' + VIAGEM_ID + '/pontos').then((r) => r.json()),
  ]);

  pontosRota = pontos;
  indiceDestino = pontosRota.findIndex((p) => p.id === destinoSelecionado.id);

  document.getElementById('rec-linha').textContent = viagem.linha_codigo || '-';
  document.getElementById('rec-onibus').textContent = viagem.onibus_codigo || '-';
  document.getElementById('rec-destino').textContent = destinoSelecionado.nome;
  document.getElementById('rec-embarque').textContent = pontosRota[0].nome;
  document.getElementById('rec-previsao').textContent = '8 minutos';

  if (mapa) {
    mapa.remove();
    mapa = null; marcadorOnibus = null; marcadorDestino = null;
    linhaRota = null; marcadoresPontos = [];
  }

  mostrarTela('recomendado');
};

btnVoltar.onclick = () => {
  mostrarTela('inicio');
  inputDestino.value = '';
  destinoSelecionado = null;
  btnEncontrar.disabled = true;
  sugestoes.innerHTML = '';
};

// ===== Embarcar =====
btnEmbarcar.onclick = async () => {
  btnEmbarcar.disabled = true;
  btnEmbarcar.textContent = 'EMBARCANDO...';

  try {
    const resp = await authFetch(URL + '/api/passageiros/embarcar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        viagem_id: VIAGEM_ID,
        passageiro_id: PASSAGEIRO_ID,
        ponto_destino_id: destinoSelecionado.id,
      }),
    }).then((r) => r.json());

    if (!resp.sucesso) {
      alert('Erro ao embarcar: ' + resp.mensagem);
      return;
    }

    embarcou = true;
    conectarWebSocket();

    document.getElementById('via-linha').textContent = document.getElementById('rec-linha').textContent;
    document.getElementById('via-destino').textContent = destinoSelecionado.nome;
    document.getElementById('via-proximo').textContent = '...';
    document.getElementById('via-faltam').textContent = '...';
    document.getElementById('progresso-preenchido').style.width = '0%';

    mostrarTela('viagem');
  } catch (e) {
    alert('Erro: ' + e.message);
  } finally {
    btnEmbarcar.disabled = false;
    btnEmbarcar.textContent = 'EMBARCAR';
  }
};

// ===== Mapa =====
function inicializarMapa() {
  if (mapa) { mapa.invalidateSize(); return; }
  if (pontosRota.length === 0) return;

  const inicio = pontosRota[0];
  mapa = L.map('mapa-viagem', { zoomControl: true, attributionControl: true })
    .setView([inicio.latitude, inicio.longitude], 15);

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  ).addTo(mapa);

  const coordsRota = pontosRota.map((p) => [p.latitude, p.longitude]);
  linhaRota = L.polyline(coordsRota, { color: '#38bdf8', weight: 5, opacity: 0.85 }).addTo(mapa);

  marcadoresPontos = pontosRota.map((p) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="marcador-ponto"></div>',
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    return L.marker([p.latitude, p.longitude], { icon }).addTo(mapa).bindPopup(p.nome);
  });

  if (destinoSelecionado) {
    const icon = L.divIcon({
      className: '',
      html: '<div class="marcador-destino">&#127937;</div>',
      iconSize: [30, 30], iconAnchor: [15, 15],
    });
    marcadorDestino = L.marker(
      [destinoSelecionado.latitude, destinoSelecionado.longitude],
      { icon, zIndexOffset: 1000 }
    ).addTo(mapa).bindPopup('Destino: ' + destinoSelecionado.nome);
  }

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

function atualizarPosicaoOnibus(lat, lng) {
  if (!mapa || !marcadorOnibus) return;
  marcadorOnibus.setLatLng([lat, lng]);
}

// ===== WebSocket =====
function conectarWebSocket() {
  if (socket) return;
  socket = io(URL);

  socket.on('connect', () => {
    socket.emit('inscrever:viagem', VIAGEM_ID);
  });

  socket.on('onibus:localizacao', (d) => {
    if (!embarcou) return;
    atualizarPosicaoOnibus(d.latitude, d.longitude);
  });

  socket.on('viagem:atualizada', (d) => {
    if (!embarcou) return;
    indiceAtual = d.indice_ponto_atual;
    const proximo = pontosRota[indiceAtual + 1];
    const faltam = Math.max(0, indiceDestino - indiceAtual);

    document.getElementById('via-proximo').textContent = proximo ? proximo.nome : '-';
    document.getElementById('via-faltam').textContent = faltam === 1 ? '1 ponto' : faltam + ' pontos';

    const progresso = indiceDestino > 0 ? Math.min(100, (indiceAtual / indiceDestino) * 100) : 0;
    document.getElementById('progresso-preenchido').style.width = progresso + '%';
  });

  socket.on('passageiro:destino_proximo', (d) => {
    if (!embarcou) return;
    if (d.passageiro_id !== PASSAGEIRO_ID) return;
    mostrarTela('aproximando');
  });

  socket.on('passageiro:chegou', (d) => {
    if (!embarcou) return;
    if (d.passageiro_id !== PASSAGEIRO_ID) return;
    document.getElementById('chegou-ponto').textContent = d.ponto_nome || destinoSelecionado.nome;
    mostrarTela('chegou');
    embarcou = false;
  });
}

btnNovaViagem.onclick = () => {
  if (socket) { socket.disconnect(); socket = null; }
  if (mapa) {
    mapa.remove();
    mapa = null; marcadorOnibus = null; marcadorDestino = null;
    linhaRota = null; marcadoresPontos = [];
  }
  destinoSelecionado = null;
  pontosRota = [];
  indiceAtual = 0;
  indiceDestino = -1;
  inputDestino.value = '';
  sugestoes.innerHTML = '';
  btnEncontrar.disabled = true;
  mostrarTela('inicio');
};

// ===== Inicializacao =====
if (authToken) {
  esconderLogin();
  carregarPontos();
} else {
  mostrarLogin();
}
// Esconder a splash screen apos 2 segundos
setTimeout(() => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('escondido');
    setTimeout(() => splash.remove(), 700);
  }
}, 2000);
