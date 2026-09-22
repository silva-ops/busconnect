const fs = require('fs');
const base = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/';

function corrigirArquivo(nome, regras) {
  const arq = base + nome;
  if (!fs.existsSync(arq)) { console.log('  ! ' + nome + ' nao existe'); return; }
  let txt = fs.readFileSync(arq, 'utf8');
  const orig = txt;
  for (const r of regras) {
    txt = txt.replace(r[0], r[1]);
  }
  if (txt !== orig) {
    fs.writeFileSync(arq, txt, 'utf8');
    console.log('  OK ' + nome);
  } else {
    console.log('  -- sem mudanca: ' + nome);
  }
}

// Caracteres construidos por codigo Unicode (nao corrompem)
const C = String.fromCharCode(0x00C7); // C cedilha
const Atil = String.fromCharCode(0x00C3); // A tilde
const oac = String.fromCharCode(0x00F3); // o agudo
const aac = String.fromCharCode(0x00E1); // a agudo
const dash = String.fromCharCode(0x2014); // travessao

const ATENCAO = 'ATEN' + C + Atil + 'O';
const proximoLower = 'pr' + oac + 'ximo';
const proximoUpper = 'Pr' + oac + 'ximo';
const esta = 'est' + aac;

// ===== index.html =====
corrigirArquivo('index.html', [
  // <h2 class="titulo-aproximando">qualquer coisa</h2> -> ATENCAO
  [/<h2 class="titulo-aproximando">[^<]*<\/h2>/g, '<h2 class="titulo-aproximando">' + ATENCAO + '</h2>'],

  // Paragrafo "Seu destino esta proximo."
  [/<p class="texto-aproximando">[^<]*<\/p>/g,
   '<p class="texto-aproximando">Seu destino ' + esta + ' ' + proximoLower + '.</p>'],

  // Qualquer "Pr" + 1-3 chars + "ximo" que ainda estiver errado
  [/Pr[\s\S]{0,3}ximo/g, proximoUpper],
  [/pr[\s\S]{0,3}ximo/g, proximoLower],

  // Travessao corrompido em qualquer forma
  [/â€[™”"″]/g, dash],
  [/[\u00E2][\u0080][\u0094]/g, dash],
  [/â€”/g, dash],

  // Placeholder "—" nos <strong> que virou lixo
  [/<strong id="via-proximo">[^<]*<\/strong>/g, '<strong id="via-proximo">' + dash + '</strong>'],
  [/<strong id="via-faltam">[^<]*<\/strong>/g, '<strong id="via-faltam">' + dash + '</strong>'],
  [/<strong id="rec-linha">[^<]*<\/strong>/g, '<strong id="rec-linha">' + dash + '</strong>'],
  [/<strong id="rec-onibus">[^<]*<\/strong>/g, '<strong id="rec-onibus">' + dash + '</strong>'],
  [/<strong id="rec-destino">[^<]*<\/strong>/g, '<strong id="rec-destino">' + dash + '</strong>'],
  [/<strong id="rec-embarque">[^<]*<\/strong>/g, '<strong id="rec-embarque">' + dash + '</strong>'],
  [/<strong id="rec-previsao">[^<]*<\/strong>/g, '<strong id="rec-previsao">' + dash + '</strong>'],
  [/<strong id="via-linha">[^<]*<\/strong>/g, '<strong id="via-linha">' + dash + '</strong>'],
  [/<strong id="via-destino">[^<]*<\/strong>/g, '<strong id="via-destino">' + dash + '</strong>'],

  // Onibus no botao
  [/<button id="btn-encontrar"[^>]*>[^<]*<\/button>/g,
   '<button id="btn-encontrar" class="btn-primario" disabled>ENCONTRAR ' + String.fromCharCode(0x00D4) + 'NIBUS</button>'],
]);

// ===== app.js =====
corrigirArquivo('app.js', [
  // Troca tile OpenStreetMap por CartoDB (que aceita file://)
  [/https:\/\/\{s\}\.tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/g,
   'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
  [/'&copy; OpenStreetMap'/g, "'&copy; OpenStreetMap | &copy; CARTO'"],
]);

console.log('\nPronto.');