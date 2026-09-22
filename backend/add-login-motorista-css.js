const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-motorista/style.css';
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
}
.overlay-login.escondido { display: none; }

.login-box {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 40px 36px;
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
  margin-bottom: 28px;
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
  transition: transform 0.15s;
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
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}
.login-hint b { color: #94a3b8; }

/* Header right */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.usuario-logado {
  font-size: 13px;
  color: #94a3b8;
}
.btn-logout {
  background: #7f1d1d;
  color: #fecaca;
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
}
.btn-logout:hover { background: #991b1b; }
`;

if (!/overlay-login/.test(txt)) {
  fs.writeFileSync(arq, txt + extra, 'utf8');
  console.log('OK style.css atualizado.');
} else {
  console.log('-- CSS ja existe');
}