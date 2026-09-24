INSERT INTO onibus (id, codigo, placa, empresa_id, capacidade)
VALUES 
  (1235, '1235', 'XYZ2E34', 1, 40),
  (1236, '1236', 'DEF3F45', 1, 40)
ON CONFLICT (id) DO NOTHING;

INSERT INTO viagens (id, linha_id, rota_id, onibus_id, status, iniciada_em)
VALUES 
  (501, 3050, 1, 1235, 'EM_ANDAMENTO', NOW()),
  (502, 3050, 1, 1236, 'EM_ANDAMENTO', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO passageiros (id) VALUES (11), (12) ON CONFLICT (id) DO NOTHING;

INSERT INTO viagens_passageiros (viagem_id, passageiro_id, ponto_destino_id, status)
VALUES 
  (501, 11, 4, 'EM_VIAGEM'),
  (502, 12, 4, 'EM_VIAGEM')
ON CONFLICT (viagem_id, passageiro_id) DO NOTHING;

SELECT setval('onibus_id_seq', 1236);
SELECT setval('viagens_id_seq', 502);
SELECT setval('passageiros_id_seq', 12);