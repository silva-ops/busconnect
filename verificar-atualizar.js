const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/app.js';
let txt = fs.readFileSync(arq, 'utf8');

// Mostra como esta o atualizarTudo atual
const match = txt.match(/async function atualizarTudo\(\) \{[\s\S]*?\n\}/);
if (match) {
  console.log('--- atualizarTudo ATUAL ---');
  console.log(match[0]);
  console.log('--- FIM ---');
}

// Aplica replace mais abrangente
const regexAntigo = /await Promise\.all\(\[([^\]]*)\]\);/;
const match2 = txt.match(regexAntigo);
if (match2) {
  console.log('--- Promise.all ATUAL ---');
  console.log(match2[0]);
  console.log('--- FIM ---');
}

// Tenta adicionar carregarLinhasAtivas se nao existir
if (!txt.includes('carregarLinhasAtivas()')) {
  // Tenta padrao com espacos diferentes
  txt = txt.replace(
    /(await Promise\.all\(\[[^\]]*carregarOnibusAtivos\(\)[^\]]*\]\);)/,
    '$1\n    carregarLinhasAtivas();'
  );
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK app.js atualizado com chamada direta.');
} else if (txt.includes('carregarOnibusAtivos(), carregarLinhasAtivas()')) {
  console.log('OK carregarLinhasAtivas ja esta no Promise.all.');
} else if (txt.includes('carregarLinhasAtivas()')) {
  console.log('OK carregarLinhasAtivas ja existe em algum lugar.');
}