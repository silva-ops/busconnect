DROP TABLE IF EXISTS localizacoes_onibus CASCADE;
DROP TABLE IF EXISTS viagens_passageiros CASCADE;
DROP TABLE IF EXISTS passageiros CASCADE;
DROP TABLE IF EXISTS viagens CASCADE;
DROP TABLE IF EXISTS rota_pontos CASCADE;
DROP TABLE IF EXISTS rotas CASCADE;
DROP TABLE IF EXISTS pontos CASCADE;
DROP TABLE IF EXISTS linhas CASCADE;
DROP TABLE IF EXISTS onibus CASCADE;
DROP TABLE IF EXISTS motoristas CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('PASSAGEIRO','MOTORISTA','EMPRESA','ADMINISTRADOR')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cnpj VARCHAR(20) UNIQUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE motoristas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  empresa_id INT REFERENCES empresas(id) ON DELETE SET NULL,
  cnh VARCHAR(20),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onibus (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  placa VARCHAR(10) UNIQUE NOT NULL,
  empresa_id INT REFERENCES empresas(id) ON DELETE SET NULL,
  capacidade INT DEFAULT 40,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE linhas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(120) NOT NULL,
  empresa_id INT REFERENCES empresas(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rotas (
  id SERIAL PRIMARY KEY,
  linha_id INT REFERENCES linhas(id) ON DELETE CASCADE,
  sentido VARCHAR(10) NOT NULL CHECK (sentido IN ('IDA','VOLTA')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pontos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rota_pontos (
  id SERIAL PRIMARY KEY,
  rota_id INT REFERENCES rotas(id) ON DELETE CASCADE,
  ponto_id INT REFERENCES pontos(id) ON DELETE CASCADE,
  ordem INT NOT NULL,
  UNIQUE(rota_id, ordem)
);

CREATE TABLE viagens (
  id SERIAL PRIMARY KEY,
  linha_id INT REFERENCES linhas(id),
  rota_id INT REFERENCES rotas(id),
  onibus_id INT REFERENCES onibus(id),
  motorista_id INT REFERENCES motoristas(id),
  status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO'
    CHECK (status IN ('PLANEJADA','EM_ANDAMENTO','FINALIZADA','CANCELADA')),
  iniciada_em TIMESTAMPTZ DEFAULT NOW(),
  finalizada_em TIMESTAMPTZ
);

CREATE TABLE passageiros (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE viagens_passageiros (
  id SERIAL PRIMARY KEY,
  viagem_id INT REFERENCES viagens(id) ON DELETE CASCADE,
  passageiro_id INT REFERENCES passageiros(id),
  ponto_destino_id INT REFERENCES pontos(id),
  status VARCHAR(30) NOT NULL DEFAULT 'EM_VIAGEM'
    CHECK (status IN ('AGUARDANDO','EMBARCADO','EM_VIAGEM','APROXIMANDO_DESTINO','DESTINO_ALCANCADO','FINALIZADO')),
  notificado_aproximacao BOOLEAN DEFAULT FALSE,
  notificado_chegada BOOLEAN DEFAULT FALSE,
  embarcou_em TIMESTAMPTZ,
  chegou_em TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  UNIQUE(viagem_id, passageiro_id)
);

CREATE TABLE localizacoes_onibus (
  id BIGSERIAL PRIMARY KEY,
  onibus_id INT REFERENCES onibus(id),
  viagem_id INT REFERENCES viagens(id),
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  velocidade NUMERIC(5,2),
  timestamp TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_localizacoes_viagem_ts ON localizacoes_onibus(viagem_id, timestamp DESC);
CREATE INDEX idx_vp_viagem ON viagens_passageiros(viagem_id);
CREATE INDEX idx_vp_destino ON viagens_passageiros(ponto_destino_id);
CREATE INDEX idx_rota_pontos_rota ON rota_pontos(rota_id, ordem);
