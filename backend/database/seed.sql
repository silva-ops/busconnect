INSERT INTO empresas (id, nome, cnpj) VALUES (1, 'Empresa Teste', '00000000000191');

INSERT INTO onibus (id, codigo, placa, empresa_id, capacidade)
VALUES (1234, '1234', 'ABC1D23', 1, 40);

INSERT INTO linhas (id, codigo, nome, empresa_id)
VALUES (3050, '3050', 'Centro - Terminal', 1);

INSERT INTO rotas (id, linha_id, sentido) VALUES (1, 3050, 'IDA');

INSERT INTO pontos (id, nome, latitude, longitude) VALUES
  (1, 'Terminal',        -19.9500, -43.9400),
  (2, 'Rua das Flores',  -19.9510, -43.9410),
  (3, 'Rua Central',     -19.9520, -43.9420),
  (4, 'Praca Central',   -19.9530, -43.9430),
  (5, 'Mercado',         -19.9540, -43.9440);

INSERT INTO rota_pontos (rota_id, ponto_id, ordem) VALUES
  (1, 1, 1),
  (1, 2, 2),
  (1, 3, 3),
  (1, 4, 4),
  (1, 5, 5);

INSERT INTO viagens (id, linha_id, rota_id, onibus_id, status, iniciada_em)
VALUES (500, 3050, 1, 1234, 'EM_ANDAMENTO', NOW());

INSERT INTO passageiros (id) VALUES (10);

INSERT INTO viagens_passageiros (viagem_id, passageiro_id, ponto_destino_id, status)
VALUES (500, 10, 4, 'EM_VIAGEM');

SELECT setval('empresas_id_seq', 1);
SELECT setval('onibus_id_seq', 1234);
SELECT setval('linhas_id_seq', 3050);
SELECT setval('rotas_id_seq', 1);
SELECT setval('pontos_id_seq', 5);
SELECT setval('viagens_id_seq', 500);
SELECT setval('passageiros_id_seq', 10);