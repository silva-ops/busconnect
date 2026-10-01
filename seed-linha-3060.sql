-- ORDEM CORRETA: linhas → rotas → pontos → rota_pontos → onibus → viagens → passageiros → viagens_passageiros

-- 1) Linha 3060 PRIMEIRO (rotas depende dela)
INSERT INTO linhas (id, codigo, nome, empresa_id)
VALUES (3060, '3060', 'Nova Esperanca - Centro', 1)
ON CONFLICT (id) DO NOTHING;

-- 2) Rota 2 (referencia linha 3060 que ja existe)
INSERT INTO rotas (id, linha_id, sentido) VALUES (2, 3060, 'IDA')
ON CONFLICT (id) DO NOTHING;

-- 3) Pontos 6-9
INSERT INTO pontos (id, nome, latitude, longitude) VALUES
  (6, 'Bairro Nova Esperanca', -19.9450, -43.9350),
  (7, 'Praca da Matriz',       -19.9470, -43.9370),
  (8, 'Hospital Municipal',    -19.9490, -43.9390),
  (9, 'Terminal Rodoviario',   -19.9550, -43.9450)
ON CONFLICT (id) DO NOTHING;

-- 4) Pontos da rota 2
INSERT INTO rota_pontos (rota_id, ponto_id, ordem) VALUES
  (2, 6, 1),
  (2, 7, 2),
  (2, 8, 3),
  (2, 4, 4),
  (2, 9, 5)
ON CONFLICT (rota_id, ordem) DO NOTHING;

-- 5) Onibus 1237
INSERT INTO onibus (id, codigo, placa, empresa_id, capacidade)
VALUES (1237, '1237', 'GHI4G56', 1, 40)
ON CONFLICT (id) DO NOTHING;

-- 6) Viagem 503
INSERT INTO viagens (id, linha_id, rota_id, onibus_id, status, iniciada_em)
VALUES (503, 3060, 2, 1237, 'EM_ANDAMENTO', NOW())
ON CONFLICT (id) DO NOTHING;

-- 7) Passageiro 13
INSERT INTO passageiros (id) VALUES (13) ON CONFLICT (id) DO NOTHING;

-- 8) Passageiro 13 embarcado na viagem 503
INSERT INTO viagens_passageiros (viagem_id, passageiro_id, ponto_destino_id, status)
VALUES (503, 13, 4, 'EM_VIAGEM')
ON CONFLICT (viagem_id, passageiro_id) DO NOTHING;

-- Ajustar sequences
SELECT setval('pontos_id_seq', 9);
SELECT setval('rotas_id_seq', 2);
SELECT setval('linhas_id_seq', 3060);
SELECT setval('onibus_id_seq', 1237);
SELECT setval('viagens_id_seq', 503);
SELECT setval('passageiros_id_seq', 13);