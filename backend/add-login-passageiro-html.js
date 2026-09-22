const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/index.html';
let txt = fs.readFileSync(arq, 'utf8');

if (!/id="tela-login"/.test(txt)) {
  const loginHtml = `
  <div id="tela-login" class="overlay-login">
    <div class="login-box">
      <div class="login-marca">BusConnect</div>
      <div class="login-sub">Acesso do Passageiro</div>

      <form id="form-login" autocomplete="on">
        <label class="login-label">E-mail</label>
        <input id="login-email" type="email" placeholder="passageiro@busconnect.com" required autofocus />

        <label class="login-label">Senha</label>
        <input id="login-senha" type="password" placeholder="Sua senha" required />

        <div id="login-erro" class="login-erro"></div>

        <button type="submit" class="btn-login">ENTRAR</button>
      </form>

      <div class="login-hint">
        Teste: <b>passageiro@busconnect.com</b> / <b>senha123</b>
      </div>
    </div>
  </div>
`;
  txt = txt.replace(/<body>/, '<body>\n' + loginHtml);

  // Botao Sair no canto da tela inicial
  if (!/btn-logout/.test(txt)) {
    txt = txt.replace(
      /<section id="tela-inicio" class="tela ativa">/,
      '<button id="btn-logout" class="btn-logout-flutuante" title="Sair">Sair</button>\n\n  <section id="tela-inicio" class="tela ativa">'
    );
  }

  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK index.html atualizado.');
} else {
  console.log('-- login ja existe');
}