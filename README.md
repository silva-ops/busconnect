# BusConnect

Plataforma inteligente para transporte coletivo urbano com rastreamento em tempo real e desembarque 100% automatico.

## URLs em producao

| Servico | URL |
|---|---|
| Backend API | https://busconnect-backend-dkk9.onrender.com |
| App do Passageiro | https://busconnect-passageiro.pages.dev |
| Painel do Motorista | https://busconnect-motorista.pages.dev |
| Painel da Empresa | https://busconnect-empresa.pages.dev |
| Repositorio | https://github.com/silva-ops/busconnect |

## Credenciais de teste

| Perfil | Email | Senha |
|---|---|---|
| Empresa | empresa@busconnect.com | senha123 |
| Motorista | motorista@busconnect.com | senha123 |
| Passageiro | passageiro@busconnect.com | senha123 |

## Stack

- **Backend:** Node.js, Express, Socket.IO, PostgreSQL, JWT
- **Frontend:** HTML, CSS, JavaScript puro, Leaflet
- **Banco:** PostgreSQL (Neon)
- **Mapas:** Esri World Street Map (gratuito)
- **Hospedagem Backend:** Render (Free)
- **Hospedagem Frontend:** Cloudflare Pages (Free)
- **Autenticacao:** JWT + bcrypt

## Funcionalidades

- Rastreamento de onibus em tempo real via GPS + WebSocket
- Motor de Viagem 2.1 com deteccao automatica de aproximacao e chegada
- Desembarque 100% automatico (sem botao "vou descer aqui")
- Aviso automatico ao motorista por parada
- Notificacoes push + som no app do passageiro e painel do motorista
- Historico de viagens do passageiro com estatisticas
- Multiplos onibus simultaneos na mesma linha
- Mapas com rota, onibus e pontos em tempo real
- Autenticacao em 3 perfis (PASSAGEIRO, MOTORISTA, EMPRESA)

## Estrutura

```
busconnect/
├── backend/           API REST + WebSocket + Motor de Viagem
├── simulador/         Simulador de onibus (envia GPS)
├── app-passageiro/    App web do passageiro
├── painel-motorista/  Painel web do motorista
└── painel-empresa/    Painel web administrativo
```

## Motor de Viagem 2.1

Detecta automaticamente:
- **Aproximacao:** onibus entra no raio de 300m do destino
- **Chegada:** onibus entra no raio de 50m do destino
- **Fechamento:** quando chega no ultimo ponto da rota

**Sem botao "Vou descer aqui".** Tudo automatico.

## Como rodar localmente

### 1. Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm start
```

### 2. Simulador

```bash
cd simulador
npm install
node simulador.js
```

### 3. Abrir os paineis no navegador

- Passageiro: `app-passageiro/index.html`
- Motorista: `painel-motorista/index.html`
- Empresa: `painel-empresa/index.html`

## Variaveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha.

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=sua-string-secreta
NODE_VERSION=20
```

## Deploy

- **Banco:** Neon (PostgreSQL gratuito com SSL)
- **Backend:** Render (Node.js Free)
- **Frontends:** Cloudflare Pages (3 projetos independentes)
- **HTTPS:** Automatico

## Testes

```bash
cd simulador
npm test
```

## Licenca

Projeto de estudo e demonstracao.
