const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-motorista/index.html';
let txt = fs.readFileSync(arq, 'utf8');

if (!/id="tela-login"/.test(txt)) {
  const loginHtml = `
  <div id="tela-login" class="overlay-login">
    <div class="login-box">
      <div class="login-marca">BusConnect</div>
      <div class="login-sub">Painel do Motorista</div>

      <form id="form-login" autocomplete="on">
        <label class="login-label">E-mail</label>
        <input id="login-email" type="email" placeholder="motorista@busconnect.com" required autofocus />

        <label class="login-label">Senha</label>
        <input id="login-senha" type="password" placeholder="Sua senha" required />

        <div id="login-erro" class="login-erro"></div>

        <button type="submit" class="btn-login">ENTRAR</button>
      </form>

      <div class="login-hint">
        Usuário de teste: <b>motorista@busconnect.com</b> / <b>senha123</b>
      </div>
    </div>
  </div>
`;
  txt = txt.replace(/<body>/, '<body>\n' + loginHtml);

  // Botao de logout no header
  txt = txt.replace(
    /<div class="status" id="status">[^<]*<\/div>/,
    '<div class="header-right">\n      <span id="usuario-logado" class="usuario-logado"></span>\n      <div class="status" id="status">Conectando...</div>\n      <button id="btn-logout" class="btn-logout" title="Sair">Sair</button>\n    </div>'
  );

  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK index.html atualizado.');
} else {
  console.log('-- login ja existe');
}