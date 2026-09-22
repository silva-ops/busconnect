const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/index.html';
let txt = fs.readFileSync(arq, 'utf8');

const Ocirc = String.fromCharCode(0x00D4);  // Ô
const Larrow = String.fromCharCode(0x2190); // seta esquerda

// 1) Corrige id="via-próximo" (acento criado por engano)
txt = txt.replace(/id="via-próximo"/g, 'id="via-proximo"');
txt = txt.replace(/id="via-destino\b/g, 'id="via-destino"'); // sanity

// 2) Corrige <h2 class="titulo-tela"> que ficou "i\"nibus"
txt = txt.replace(
  /<h2 class="titulo-tela">[\s\S]*?<\/h2>/,
  '<h2 class="titulo-tela">' + Ocirc + 'nibus recomendado</h2>'
);

// 3) Corrige todos os <span> que ficaram com "i\"nibus"
txt = txt.replace(
  /<span>[^<]{0,8}nibus<\/span>/g,
  '<span>' + Ocirc + 'nibus</span>'
);

// 4) Corrige botao voltar com seta
txt = txt.replace(
  /<button id="btn-voltar"[^>]*>[\s\S]*?<\/button>/,
  '<button id="btn-voltar" class="btn-secundario">' + Larrow + ' Escolher outro destino</button>'
);

// 5) Limpa quaisquer residuos "i\"nibus" ou "i nibus" espalhados
txt = txt.replace(/i"nibus/g, Ocirc + 'nibus');
txt = txt.replace(/i\s{1,2}nibus/g, Ocirc + 'nibus');
txt = txt.replace(/[\u00C3][\u0094]nibus/g, Ocirc + 'nibus');

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK index.html corrigido');