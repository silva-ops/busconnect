CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  passageiro_id INT,
  viagem_id INT,
  perfil VARCHAR(20) NOT NULL DEFAULT 'PASSAGEIRO',
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_passageiro ON push_subscriptions(passageiro_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_perfil ON push_subscriptions(perfil);