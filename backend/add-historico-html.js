const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/index.html';
let txt = fs.readFileSync(arq, 'utf8');

// 1) Botao de historico na tela inicial (depois do botao Encontrar Onibus)
if (!txt.includes('btn-historico')) {
  txt = txt.replace(
    /(<button id="btn-encontrar"[^>]*>ENCONTRAR [^<]+<\/button>)/,
    '$1\n    <button id="btn-historico" class="btn-secundario">📊 Ver histórico de viagens</button>'
  );
}

// 2) Nova tela de historico (antes da tela aproximando)
if (!txt.includes('tela-historico')) {
  const telaHistorico = `
  <section id="tela-historico" class="tela">
    <div class="marca-pequena">HISTÓRICO</div>

    <div class="card-info" id="historico-stats">
      <div class="linha-info"><span>Total de viagens</span><strong id="stat-total">—</strong></div>
      <div class="linha-info"><span>Tempo total em ônibus</span><strong id="stat-tempo">—</strong></div>
      <div class="linha-info"><span>Destino favorito</span><strong id="stat-favorito">—</strong></div>
    </div>

    <div class="marca-pequena" style="margin-top: 24px;">Suas viagens</div>
    <ul id="lista-historico" class="lista-historico"></ul>

    <button id="btn-voltar-inicio" class="btn-secundario">← Voltar ao início</button>
  </section>
`;
  txt = txt.replace(
    /(<section id="tela-aproximando")/,
    telaHistorico + '\n  $1'
  );
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK index.html atualizado.');