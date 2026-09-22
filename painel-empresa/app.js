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
const elStatus = document.getElementById('status');
const elUsuarioLogado = document.getElementById('usuario-logado');
const elLogout = document.getElementById('btn-logout');
const elTelaLogin = document.getElementById('tela-login');
const elFormLogin = document.getElementById('form-login');
const elLoginErro = document.getElementById('login-erro');
const elBtnLogin = elFormLogin.querySelector('.btn-login');

// ===== Autenticação =====
let authToken = localStorage.getItem('busconnect_token') || null;
let usuarioAtual = null;
try {
  const u = localStorage.getItem('busconnect_usuario');
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
  localStorage.removeItem('busconnect_token');
  localStorage.removeItem('busconnect_usuario');
}

// Wrapper de fetch que adiciona o token e trata 401
async function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  if (authToken) opts.headers.Authorization = 'Bearer ' + authToken;
  const r = await fetch(url, opts);
  if (r.status === 401) {
    limparSessao();
    mostrarLogin();
    throw new Error('Sessao expirada. Faca login novamente.');
  }
  return r;
}

// ===== Tela de Login =====
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

    if (d.usuario.perfil !== 'EMPRESA' && d.usuario.perfil !== 'ADMINISTRADOR') {
      elLoginErro.textContent = 'Este painel e apenas para EMPRESA ou ADMINISTRADOR';
      elBtnLogin.disabled = false;
      elBtnLogin.textContent = 'ENTRAR';
      return;
    }

    authToken = d.token;
    usuarioAtual = d.usuario;
    localStorage.setItem('busconnect_token', authToken);
    localStorage.setItem('busconnect_usuario', JSON.stringify(usuarioAtual));

    esconderLogin();
    atualizarTudo();
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
let mapaEmpresa = null;
let marcadoresOnibus = new Map();
let rotasDesenhadas = new Map();
let pontosPorRota = new Map();
let inicializadoMapa = false;
let ultimasRotas = new Map();

function fmtDuracao(segundos) {
  if (!segundos || segundos < 0) return '-';
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m + ' min ' + String(s).padStart(2, '0') + 's';
}
function fmtHora(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function inicializarMapaEmpresa() {
  if (mapaEmpresa) { mapaEmpresa.invalidateSize(); return; }
  const el = document.getElementById('mapa-empresa');
  if (!el) return;
  mapaEmpresa = L.map('mapa-empresa', { zoomControl: true, attributionControl: true })
    .setView([-19.9520, -43.9420], 14);

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
  ).addTo(mapaEmpresa);

  inicializadoMapa = true;
}

function desenharRota(rotaId, pontos) {
  if (!mapaEmpresa || rotasDesenhadas.has(rotaId)) return;
  const coords = pontos.map((p) => [p.latitude, p.longitude]);
  const poly = L.polyline(coords, { color: '#38bdf8', weight: 4, opacity: 0.55, dashArray: '6,6' }).addTo(mapaEmpresa);
  rotasDesenhadas.set(rotaId, poly);
  pontos.forEach((p) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="marcador-ponto-emp"></div>',
      iconSize: [12, 12], iconAnchor: [6, 6],
    });
    L.marker([p.latitude, p.longitude], { icon }).addTo(mapaEmpresa).bindPopup(p.nome);
  });
  mapaEmpresa.fitBounds(poly.getBounds(), { padding: [30, 30] });
}

async function restaurarRotasConhecidas() {
  if (!mapaEmpresa) return;
  for (const [rotaId, dados] of ultimasRotas.entries()) {
    if (!rotasDesenhadas.has(rotaId)) desenharRota(rotaId, dados.pontos);
  }
  if (ultimasRotas.size === 0) {
    try {
      const viagens = await authFetch(URL + '/api/empresa/viagens').then((r) => r.json());
      if (viagens.length === 0) return;
      const ultima = viagens[0];
      const pontos = await authFetch(URL + '/api/viagens/' + ultima.id + '/pontos').then((r) => r.json());
      if (pontos.length === 0) return;
      ultimasRotas.set(ultima.rota_id || ultima.id, { viagem_id: ultima.id, pontos });
      if (!rotasDesenhadas.has(ultima.rota_id || ultima.id)) {
        desenharRota(ultima.rota_id || ultima.id, pontos);
      }
    } catch (e) { console.error('Erro restaurar rota:', e); }
  }
}

async function carregarOnibusAtivos() {
  if (!inicializadoMapa) await inicializarMapaEmpresa();
  if (!mapaEmpresa) return;

  let ativos = [];
  try {
    ativos = await authFetch(URL + '/api/empresa/onibus-ativos').then((r) => r.json());
  } catch (e) { console.error('Erro onibus ativos:', e); return; }

  await restaurarRotasConhecidas();

  const idsAtivos = new Set(ativos.map((a) => a.viagem_id));
  for (const [viagemId, marker] of marcadoresOnibus.entries()) {
    if (!idsAtivos.has(viagemId)) {
      mapaEmpresa.removeLayer(marker);
      marcadoresOnibus.delete(viagemId);
    }
  }

  for (const a of ativos) {
    const icone = L.divIcon({
      className: '',
      html: '<div class="marcador-onibus-emp">&#128652;</div>',
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
    const popupHtml = '<b>Linha ' + (a.linha_codigo || '-') + '</b><br>Onibus: ' +
      (a.onibus_codigo || '-') + '<br>Placa: ' + (a.onibus_placa || '-') + '<br>Viagem #' + a.viagem_id;

    if (marcadoresOnibus.has(a.viagem_id)) {
      const m = marcadoresOnibus.get(a.viagem_id);
      if (a.ultima_latitude && a.ultima_longitude) m.setLatLng([a.ultima_latitude, a.ultima_longitude]);
      m.setPopupContent(popupHtml);
    } else if (a.ultima_latitude && a.ultima_longitude) {
      const marker = L.marker([a.ultima_latitude, a.ultima_longitude], { icon: icone, zIndexOffset: 1000 })
        .addTo(mapaEmpresa).bindPopup(popupHtml);
      marcadoresOnibus.set(a.viagem_id, marker);
    }

    if (a.rota_id && !rotasDesenhadas.has(a.rota_id)) {
      try {
        const pontos = await authFetch(URL + '/api/viagens/' + a.viagem_id + '/pontos').then((r) => r.json());
        pontosPorRota.set(a.rota_id, pontos);
        ultimasRotas.set(a.rota_id, { viagem_id: a.viagem_id, pontos });
        desenharRota(a.rota_id, pontos);
      } catch (e) { console.error('Erro rota:', e); }
    }
  }
}

function atualizarOnibusNoMapa(dados) {
  if (!mapaEmpresa) return;
  const m = marcadoresOnibus.get(dados.viagem_id);
  if (m) m.setLatLng([dados.latitude, dados.longitude]);
}

async function carregarResumo() {
  const d = await authFetch(URL + '/api/empresa/resumo').then((r) => r.json());
  document.getElementById('kpi-onibus').textContent = d.onibus_em_operacao;
  document.getElementById('kpi-viagens').textContent = d.viagens_ativas;
  document.getElementById('kpi-passageiros').textContent = d.passageiros_ativos;
  document.getElementById('kpi-transportados').textContent = d.passageiros_transportados_hoje;
  document.getElementById('kpi-linhas').textContent = d.total_linhas;
}

async function carregarViagens() {
  const viagens = await authFetch(URL + '/api/empresa/viagens').then((r) => r.json());
  const ativas = viagens.filter((v) => v.status === 'EM_ANDAMENTO');
  const container = document.getElementById('viagens-ativas');
  container.innerHTML = '';

  if (ativas.length === 0) {
    const div = document.createElement('div');
    div.className = 'viagem-card vazia';
    div.textContent = 'Nenhuma viagem em andamento no momento.';
    container.appendChild(div);
  } else {
    ativas.forEach((v) => {
      const div = document.createElement('div');
      div.className = 'viagem-card';
      div.innerHTML = '<div class="viagem-id">#' + v.id + '</div>' +
        '<div class="viagem-campo"><span>LINHA</span><strong>' + (v.linha_codigo || '-') + '</strong></div>' +
        '<div class="viagem-campo"><span>ONIBUS</span><strong>' + (v.onibus_codigo || '-') + '</strong></div>' +
        '<div class="viagem-campo"><span>PASSAGEIROS</span><strong>' + v.total_passageiros + '</strong></div>' +
        '<div class="viagem-status">EM OPERACAO</div>';
      container.appendChild(div);
    });
  }

  const tbody = document.querySelector('#tabela-historico tbody');
  tbody.innerHTML = '';
  viagens.forEach((v) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>#' + v.id + '</td>' +
      '<td>' + (v.linha_codigo || '-') + '</td>' +
      '<td>' + (v.onibus_codigo || '-') + '</td>' +
      '<td>' + fmtHora(v.iniciada_em) + '</td>' +
      '<td>' + (v.finalizada_em ? fmtHora(v.finalizada_em) : '-') + '</td>' +
      '<td><span class="status-pill status-' + v.status + '">' + v.status + '</span></td>' +
      '<td>' + v.total_passageiros + '</td>' +
      '<td>' + v.passageiros_chegaram + '</td>';
    tbody.appendChild(tr);
  });
}

async function carregarEstatisticas() {
  const d = await authFetch(URL + '/api/empresa/estatisticas').then((r) => r.json());
  document.getElementById('stat-tempo-medio').textContent = fmtDuracao(d.tempo_medio_segundos);
  document.getElementById('stat-total-finalizados').textContent = d.total_finalizados;

  const pontos = document.getElementById('lista-pontos');
  pontos.innerHTML = '';
  if (d.pontos_mais_usados.length === 0) {
    pontos.innerHTML = '<li><span>Sem dados ainda</span></li>';
  } else {
    d.pontos_mais_usados.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = '<span>' + p.nome + '</span><strong>' + p.desembarques + '</strong>';
      pontos.appendChild(li);
    });
  }

  const linhas = document.getElementById('lista-linhas-stats');
  linhas.innerHTML = '';
  if (d.passageiros_por_linha.length === 0) {
    linhas.innerHTML = '<li>Nenhum passageiro registrado.</li>';
  } else {
    const max = Math.max(1, ...d.passageiros_por_linha.map((l) => l.passageiros));
    d.passageiros_por_linha.forEach((l) => {
      const li = document.createElement('li');
      const pct = Math.round((l.passageiros / max) * 100);
      li.innerHTML = '<div class="barra-wrap">' +
        '<span class="barra-nome">' + l.linha_codigo + '</span>' +
        '<div class="barra"><div class="barra-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="barra-valor">' + l.passageiros + '</span></div>';
      linhas.appendChild(li);
    });
  }
}

async function carregarFrota() {
  const [onibus, linhas, rotas, pontos, motoristas] = await Promise.all([
    authFetch(URL + '/api/empresa/onibus').then((r) => r.json()),
    authFetch(URL + '/api/empresa/linhas').then((r) => r.json()),
    authFetch(URL + '/api/empresa/rotas').then((r) => r.json()),
    authFetch(URL + '/api/empresa/pontos').then((r) => r.json()),
    authFetch(URL + '/api/empresa/motoristas').then((r) => r.json()),
  ]);

  const render = (id, items, fn) => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    if (items.length === 0) { el.innerHTML = '<li><span>Nenhum registro</span></li>'; return; }
    items.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = fn(item);
      el.appendChild(li);
    });
  };

  render('lista-onibus', onibus, (o) => '<span>' + o.codigo + ' - ' + o.placa + '</span><strong>' + o.capacidade + ' lug.</strong>');
  render('lista-linhas', linhas, (l) => '<span>' + l.codigo + '</span><strong>' + l.nome + '</strong>');
  render('lista-rotas', rotas, (r) => '<span>Rota #' + r.id + ' (' + r.sentido + ')</span><strong>' + r.total_pontos + ' pontos</strong>');
  render('lista-pontos-todos', pontos, (p) => '<span>' + p.nome + '</span><strong>#' + p.id + '</strong>');
  render('lista-motoristas', motoristas, (m) => '<span>' + (m.usuario_nome || 'Motorista #' + m.id) + '</span><strong>' + (m.cnh || '-') + '</strong>');
}

async function atualizarTudo() {
  if (!authToken) return;
  try {
    await Promise.all([
      carregarResumo(),
      carregarViagens(),
      carregarEstatisticas(),
      carregarFrota(),
      carregarOnibusAtivos(),
    ]);
  } catch (e) {
    console.error('Erro ao atualizar painel:', e);
  }
}

// ===== WebSocket (nao precisa de token - canal publico) =====
const socket = io(URL);

socket.on('connect', () => {
  if (authToken) {
    elStatus.textContent = 'Conectado';
    elStatus.classList.add('ok');
  }
  socket.emit('inscrever:viagem', 500);
  socket.emit('inscrever:empresa');
});

socket.on('disconnect', () => {
  elStatus.textContent = 'Desconectado';
  elStatus.classList.remove('ok');
});

socket.on('viagem:atualizada', () => { if (authToken) atualizarTudo(); });
socket.on('passageiro:chegou', () => { if (authToken) atualizarTudo(); });
socket.on('viagem:finalizada', () => { if (authToken) atualizarTudo(); });
socket.on('onibus:localizacao', (d) => { if (authToken) atualizarOnibusNoMapa(d); });

// ===== Inicializacao =====
if (authToken) {
  esconderLogin();
  atualizarTudo();
} else {
  mostrarLogin();
}

setInterval(() => { if (authToken) atualizarTudo(); }, 10000);