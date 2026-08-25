-- Remet « Nomenclatures compétences » au même niveau que le référentiel
-- (enfant de Paramètres), pour qu'elle réapparaisse dans le menu.

UPDATE Modules
SET parent_module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'parametrage'),
    display_name = N'Nomenclatures compétences',
    route = N'/soft-gcc/parametres/competences',
    sort_order = 2,
    state = 1
WHERE name = 'param_competences_nomenclatures';

IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_competences_nomenclatures')
BEGIN
    INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
    SELECT 'param_competences_nomenclatures', N'Nomenclatures compétences', NULL,
           N'/soft-gcc/parametres/competences', m.module_id, 2, 1
    FROM Modules m WHERE m.name = 'parametrage';
END

INSERT INTO Role_Modules (role_id, module_id)
SELECT rm.role_id, c.module_id
FROM Role_Modules rm
INNER JOIN Modules p ON p.module_id = rm.module_id AND p.name = 'parametrage'
INNER JOIN Modules c ON c.parent_module_id = p.module_id AND c.name = 'param_competences_nomenclatures'
WHERE NOT EXISTS (
    SELECT 1 FROM Role_Modules x
    WHERE x.role_id = rm.role_id AND x.module_id = c.module_id
);

SELECT m.name, m.display_name, m.route, p.name AS parent_name
FROM Modules m
LEFT JOIN Modules p ON p.module_id = m.parent_module_id
WHERE m.name IN ('param_competences', 'param_competences_nomenclatures');
