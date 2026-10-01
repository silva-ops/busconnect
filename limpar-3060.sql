-- Limpar insercao parcial da linha 3060
DELETE FROM viagens_passageiros WHERE viagem_id = 503;
DELETE FROM viagens WHERE id = 503;
DELETE FROM rota_pontos WHERE rota_id = 2;
DELETE FROM rotas WHERE id = 2;
DELETE FROM passageiros WHERE id = 13;
DELETE FROM onibus WHERE id = 1237;
DELETE FROM linhas WHERE id = 3060;
-- Pontos 6-9 foram inseridos com sucesso, deixar

-- Reativar viagem 500 (estava FINALIZADA)
UPDATE viagens SET status = 'EM_ANDAMENTO', finalizada_em = NULL WHERE id = 500;
UPDATE viagens_passageiros SET status = 'EM_VIAGEM', notificado_aproximacao = FALSE, notificado_chegada = FALSE, chegou_em = NULL, finalizado_em = NULL WHERE viagem_id IN (500, 501, 502);