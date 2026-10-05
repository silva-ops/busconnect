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
let VIAGEM_ID = 500;  // valor inicial, substituido ao escolher linha
let PASSAGEIRO_ID = null;  // preenchido no login

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

// Restaura passageiro_id do usuario logado (persistido no localStorage)
if (usuarioAtual && usuarioAtual.passageiro_id) {
  PASSAGEIRO_ID = usuarioAtual.passageiro_id;
  console.log('[init] PASSAGEIRO_ID restaurado:', PASSAGEIRO_ID);
}

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
  linhas: document.getElementById('tela-linhas'),
  viagem: document.getElementById('tela-viagem'),
  aproximando: document.getElementById('tela-aproximando'),
  chegou: document.getElementById('tela-chegou'),
  historico: document.getElementById('tela-historico'),
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
  PASSAGEIRO_ID = null;
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
    // Captura o passageiro_id retornado pelo backend
    if (d.usuario.passageiro_id) {
      PASSAGEIRO_ID = d.usuario.passageiro_id;
      console.log('[login] passageiro_id =', PASSAGEIRO_ID);
    } else {
      console.log('[login] AVISO: passageiro_id nao veio do backend');
    }
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

  // 1) Busca as linhas que passam pelo ponto de destino
  const linhas = await authFetch(URL + '/api/pontos/' + destinoSelecionado.id + '/linhas').then((r) => r.json());

  if (linhas.length === 0) {
    alert('Nenhuma linha disponivel para esse destino.');
    return;
  }

  // 2) Preenche a tela de linhas
  document.getElementById('titulo-linhas').textContent = 'Para ' + destinoSelecionado.nome + ':';
  const lista = document.getElementById('lista-linhas');
  lista.innerHTML = '';

  linhas.forEach((l) => {
    const card = document.createElement('div');
    card.className = 'card-linha-escolha' + (l.codigo === '3060' ? ' linha-3060' : '');
    card.innerHTML =
      '<div class="topo">' +
        '<span class="codigo">Linha ' + l.codigo + '</span>' +
        '<span class="seta">→</span>' +
      '</div>' +
      '<div class="nome">' + l.nome + '</div>' +
      '<div class="info">' +
        '<span>🚌 <strong>' + (l.viagens_ativas || 0) + '</strong> ônibus</span>' +
        '<span>👥 <strong>' + (l.onibus_disponiveis || 0) + '</strong> vagas</span>' +
      '</div>';

    card.addEventListener('click', () => escolherLinha(l));
    lista.appendChild(card);
  });

  mostrarTela('linhas');
};

btnVoltar.onclick = () => {
  mostrarTela('inicio');
  inputDestino.value = '';
  destinoSelecionado = null;
  btnEncontrar.disabled = true;
  sugestoes.innerHTML = '';
};

// ===== Embarcar =====
// Gesto do usuario para destravar audio
btnEmbarcar.addEventListener('click', () => {
  inicializarAudio();
}, { once: false });

btnEmbarcar.onclick = async () => {
  if (!PASSAGEIRO_ID) {
    alert('Erro: passageiro_id nao disponivel. Faca login novamente.');
    return;
  }
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
    pedirPermissaoNotificacao();
    inicializarAudio();
    conectarWebSocket();
    if (window.registrarPush) { window.registrarPush(PASSAGEIRO_ID, VIAGEM_ID); }
    console.log('[DEBUG-BC] embarcou, aguardando eventos...');

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


// ===== ESCOLHER LINHA =====
async function escolherLinha(linha) {
  console.log('[linha] escolhida:', linha.codigo);

  // 1) Busca as viagens ativas da linha
  const viagens = await authFetch(URL + '/api/linhas/' + linha.id + '/viagens-ativas').then((r) => r.json());

  if (viagens.length === 0) {
    alert('Nenhum ônibus em operação nessa linha agora.');
    return;
  }

  const viagem = viagens[0];  // pega a primeira em operacao
  VIAGEM_ID = viagem.viagem_id;

  // 2) Busca os detalhes da viagem + pontos
  const [viagemDetalhes, pontos] = await Promise.all([
    authFetch(URL + '/api/viagens/' + VIAGEM_ID).then((r) => r.json()),
    authFetch(URL + '/api/viagens/' + VIAGEM_ID + '/pontos').then((r) => r.json()),
  ]);

  pontosRota = pontos;
  indiceDestino = pontosRota.findIndex((p) => p.id === destinoSelecionado.id);

  document.getElementById('rec-linha').textContent = viagemDetalhes.linha_codigo || linha.codigo || '-';
  document.getElementById('rec-onibus').textContent = viagemDetalhes.onibus_codigo || viagem.onibus_codigo || '-';
  document.getElementById('rec-destino').textContent = destinoSelecionado.nome;
  document.getElementById('rec-embarque').textContent = pontosRota[0].nome;
  document.getElementById('rec-previsao').textContent = '8 minutos';

  // Limpa o mapa para nova viagem
  if (mapa) {
    mapa.remove();
    mapa = null;
    marcadorOnibus = null;
    marcadorDestino = null;
    linhaRota = null;
    marcadoresPontos = [];
  }

  mostrarTela('recomendado');
}

// Botao voltar da tela de linhas
const btnVoltarDestino = document.getElementById('btn-voltar-destino');
if (btnVoltarDestino) {
  btnVoltarDestino.addEventListener('click', () => mostrarTela('inicio'));
}

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

    // NAO troca de tela. Apenas mostra o banner no topo.
    tocarSomAviso("atencao");
    notificarViaSW("⚠️ ATENÇÃO", "Seu destino está próximo. Prepare-se para desembarcar.", [200, 100, 200], false);

    mostrarBannerAproximando(d.ponto_nome || 'Destino');
  });

  socket.on('passageiro:chegou', (d) => {
 esconderBannerAproximando();
    console.log('[DEBUG-BC] chegou recebido', JSON.stringify(d));
    if (!embarcou) return;
    if (d.passageiro_id !== PASSAGEIRO_ID) return;
    tocarSomAviso("chegou");
      notificarViaSW("🎉 VOCÊ CHEGOU", (d.ponto_nome || "Destino alcançado") + " — Boa viagem!", [400, 150, 400, 150, 400], true);
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



// ===== NOTIFICACOES =====
function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) {
    console.log('Navegador nao suporta notificacoes.');
    return;
  }
  if (Notification.permission === 'granted') {
    console.log('Notificacoes ja autorizadas.');
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      console.log('Permissao de notificacao: ' + perm);
    });
  }
}

function mostrarNotificacao(titulo, corpo, icone) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(titulo, {
      body: corpo,
      icon: icone || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2722%27 fill=%27%230f172a%27/%3E%3Crect x=%2722%27 y=%2728%27 width=%2756%27 height=%2744%27 rx=%276%27 fill=%27none%27 stroke=%27%2338bdf8%27 stroke-width=%276%27/%3E%3Ccircle cx=%2738%27 cy=%2780%27 r=%276%27 fill=%27%2338bdf8%27/%3E%3Ccircle cx=%2762%27 cy=%2780%27 r=%276%27 fill=%27%2338bdf8%27/%3E%3C/svg%3E',
      tag: 'busconnect-aviso',
      renotify: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 10000);
  } catch (e) {
    console.error('Erro ao mostrar notificacao:', e);
  }
}



// ===== SOM (Web Audio API) =====
let audioCtx = null;

function inicializarAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[audio] criado');
    } catch (e) {
      console.error('[audio] erro criar:', e);
      return;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  // Toca um som inaudivel sincronamente para destravar (iOS/Android)
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.001; // praticamente inaudivel
    osc.start(0);
    osc.stop(audioCtx.currentTime + 0.01);
  } catch (e) {}
  console.log('[audio] estado:', audioCtx.state);
}

function tocarSomAviso(tipo) {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Padrao mais agressivo e repetido
  let notas;
  if (tipo === 'chegou') {
    // 4 bipes alegres + repete
    notas = [880, 1100, 1320, 1568, 880, 1100, 1320, 1568];
  } else {
    // 3 bipes de atencao, tipo sirene
    notas = [1000, 800, 1000, 800, 1000, 800];
  }

  let delay = 0;
  const dur = 0.18;
  const pausa = 0.06;

  notas.forEach(function(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';   // mais penetrante que sine
    osc.frequency.value = freq;

    const t = audioCtx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.01);   // volume maximo
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.start(t);
    osc.stop(t + dur + 0.03);
    delay += dur + pausa;
  });

  // Vibracao (Android suporta; iOS Safari nao)
  if (navigator.vibrate) {
    if (tipo === 'chegou') {
      navigator.vibrate([300, 100, 300, 100, 300]);      // 3 vibracoes
    } else {
      navigator.vibrate([200, 100, 200]);                 // 2 vibracoes
    }
  }

  console.log('[audio] tocou som:', tipo, 'estado:', audioCtx.state, 'notas:', notas.length);
}
// PATCH SOM v3
// PATCH SOM v2



// PATCH SW v1
// ===== SERVICE WORKER =====
let swRegistration = null;

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[sw] Service Worker nao suportado');
    return;
  }
  try {
    swRegistration = await navigator.serviceWorker.register('sw.js');
    console.log('[sw] registrado, escopo:', swRegistration.scope);
  } catch (e) {
    console.error('[sw] erro ao registrar:', e);
  }
}

function notificarViaSW(titulo, corpo, vibrar, persistente) {
  if (!swRegistration || !swRegistration.active) {
    // Fallback: notificacao normal
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(titulo, { body: corpo, vibrate: vibrar });
      } catch(e) {}
    }
    if (navigator.vibrate) navigator.vibrate(vibrar || [300, 100, 300]);
    return;
  }
  swRegistration.active.postMessage({
    tipo: 'notificar',
    titulo: titulo,
    corpo: corpo,
    vibrar: vibrar || [300, 100, 300],
    persistente: persistente || false,
    tag: 'busconnect-aviso',
  });
}

// Registra o SW assim que o app carrega
registrarServiceWorker();



// ===== BANNER DE APROXIMACAO =====
function mostrarBannerAproximando(nomePonto) {
  const banner = document.getElementById('banner-aproximando');
  if (!banner) return;

  const texto = document.getElementById('banner-texto');
  if (texto) {
    texto.textContent = 'Seu destino está próximo: ' + nomePonto;
  }

  banner.classList.remove('escondido');
  console.log('[banner] aproximando exibido para', nomePonto);

  // Vibra de novo apos 3s (reforco)
  setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, 3000);
}

function esconderBannerAproximando() {
  const banner = document.getElementById('banner-aproximando');
  if (banner) banner.classList.add('escondido');
}


// ===== AUTO-UPDATE via Service Worker =====
// Quando o Service Worker novo assume o controle, recarrega o app
// automaticamente para que o usuario veja a versao mais recente.
let swRefreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    console.log('[sw] controllerchange - recarregando app');

    // Se estiver no meio de uma viagem, adia o reload
    if (typeof embarcou !== 'undefined' && embarcou) {
      console.log('[sw] viagem em andamento, reload adiado');
      window.__recarregarAposViagem = true;
      return;
    }

    window.location.reload();
  });
}

// Tambem escuta a mensagem direta do SW (redundancia)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.tipo === 'SW_UPDATED') {
      console.log('[sw] SW_UPDATED recebido, versao:', data.versao);
    }
  });
}

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
