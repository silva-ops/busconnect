const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/style.css';
let txt = fs.readFileSync(arq, 'utf8');

const extra = `

/* ===== Tela de Login (overlay) ===== */
.overlay-login {
  position: fixed;
  inset: 0;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.overlay-login.escondido { display: none; }

.login-box {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 36px 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.login-marca {
  font-size: 28px;
  font-weight: 800;
  color: #38bdf8;
  text-align: center;
  margin-bottom: 4px;
}
.login-sub {
  font-size: 13px;
  color: #64748b;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 26px;
  text-transform: uppercase;
}
.login-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-bottom: 6px;
  margin-top: 14px;
}
#login-email, #login-senha {
  width: 100%;
  padding: 12px 14px;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 10px;
  color: #f1f5f9;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
#login-email:focus, #login-senha:focus { border-color: #38bdf8; }

.btn-login {
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1.5px;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
.btn-login:active { transform: scale(0.98); }
.btn-login:disabled { background: #334155; color: #64748b; cursor: not-allowed; }

.login-erro {
  color: #f87171;
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
  min-height: 18px;
}
.login-hint {
  color: #475569;
  font-size: 12px;
  text-align: center;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #334155;
}
.login-hint b { color: #94a3b8; }

/* Botao Sair flutuante na tela inicial */
.btn-logout-flutuante {
  position: fixed;
  top: 12px;
  right: 12px;
  background: #7f1d1d;
  color: #fecaca;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
  z-index: 100;
}
.btn-logout-flutuante:hover { background: #991b1b; }
`;

if (!/overlay-login/.test(txt)) {
  fs.writeFileSync(arq, txt + extra, 'utf8');
  console.log('OK style.css atualizado.');
} else {
  console.log('-- CSS ja existe');
}