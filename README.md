# BusConnect

Plataforma inteligente para transporte coletivo urbano com rastreamento em tempo real e desembarque 100% automatico.

## Stack

- **Backend:** Node.js, Express, Socket.IO, PostgreSQL, JWT
- **Frontend:** HTML, CSS, JavaScript puro, Leaflet (mapas)
- **Banco:** PostgreSQL
- **Mapas:** Esri World Street Map

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
- Aproximacao do destino (300m)
- Chegada ao ponto (50m)
- Fechamento automatico da viagem (ultimo ponto)

**Sem botao Vou descer aqui.** Tudo automatico.

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

## Credenciais de teste

| Perfil      | Email                       | Senha     |
|-------------|-----------------------------|-----------|
| Empresa     | empresa@busconnect.com      | senha123  |
| Motorista   | motorista@busconnect.com    | senha123  |
| Passageiro  | passageiro@busconnect.com   | senha123  |

## Variaveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha.

## Deploy

- **Banco:** Neon (PostgreSQL gratuito)
- **Backend:** Render
- **Frontends:** Netlify
