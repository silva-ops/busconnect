-- Vincula usuario passageiro existente a um registro em passageiros
INSERT INTO passageiros (usuario_id)
SELECT u.id FROM usuarios u
WHERE u.perfil = 'PASSAGEIRO'
  AND NOT EXISTS (SELECT 1 FROM passageiros p WHERE p.usuario_id = u.id);

-- Ver quem foi vinculado
SELECT p.id AS passageiro_id, u.id AS usuario_id, u.nome, u.email, u.perfil
FROM passageiros p
JOIN usuarios u ON u.id = p.usuario_id
ORDER BY p.id;