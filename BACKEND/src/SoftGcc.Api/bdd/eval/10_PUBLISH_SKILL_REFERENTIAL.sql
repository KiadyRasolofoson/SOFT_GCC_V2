-- =============================================================================
-- Permission PUBLISH_SKILL_REFERENTIAL + menu référentiel (prod déjà seedée)
-- Idempotent. À exécuter après la migration EF AddSkillReferential.
--
-- Mapping % → rang (déjà appliqué par la migration, rappel métier) :
--   < 25  → 1 Notions
--   < 50  → 2 Application
--   < 75  → 3 Maîtrise
--   sinon → 4 Expert
-- Required_level NULL / 0 → Expected_level 2 (Application)
-- =============================================================================

PRINT '=== Seed PUBLISH_SKILL_REFERENTIAL ===';

IF NOT EXISTS (SELECT 1 FROM Permissions WHERE name = 'PUBLISH_SKILL_REFERENTIAL')
BEGIN
    INSERT INTO Permissions (name, description, state)
    VALUES ('PUBLISH_SKILL_REFERENTIAL', N'Publier et archiver le référentiel de compétences', 1);
END

-- Admin (1) + RH (3) uniquement — pas Manager (2)
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT r.role_id, p.Permission_id
FROM (VALUES (1), (3)) AS r(role_id)
CROSS JOIN Permissions p
WHERE p.name = 'PUBLISH_SKILL_REFERENTIAL'
  AND p.state = 1
  AND NOT EXISTS (
      SELECT 1 FROM Role_Permissions rp
      WHERE rp.role_id = r.role_id AND rp.permission_id = p.Permission_id
  );

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Modules')
BEGIN
    UPDATE Modules
    SET route = N'/soft-gcc/parametres/referentiel-competences',
        display_name = N'Référentiel de compétences'
    WHERE name = 'param_competences';

    IF NOT EXISTS (SELECT 1 FROM Modules WHERE name = 'param_competences_nomenclatures')
    BEGIN
        INSERT INTO Modules (name, display_name, icon, route, parent_module_id, sort_order, state)
        SELECT 'param_competences_nomenclatures', N'Nomenclatures compétences', NULL,
               N'/soft-gcc/parametres/competences', m.module_id, 2, 1
        FROM Modules m WHERE m.name = 'parametrage';
    END

    UPDATE Modules
    SET parent_module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'parametrage'),
        display_name = N'Nomenclatures compétences',
        route = N'/soft-gcc/parametres/competences',
        sort_order = 2,
        state = 1
    WHERE name = 'param_competences_nomenclatures';

    UPDATE Permissions
    SET module_id = (SELECT TOP 1 module_id FROM Modules WHERE name = 'param_competences')
    WHERE name IN ('VIEW_SKILL_SETTINGS', 'MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL');

    INSERT INTO Role_Modules (role_id, module_id)
    SELECT rm.role_id, c.module_id
    FROM Role_Modules rm
    INNER JOIN Modules p ON p.module_id = rm.module_id AND p.name = 'parametrage'
    INNER JOIN Modules c ON c.parent_module_id = p.module_id AND c.name = 'param_competences_nomenclatures'
    WHERE NOT EXISTS (
        SELECT 1 FROM Role_Modules x
        WHERE x.role_id = rm.role_id AND x.module_id = c.module_id
    );
END

PRINT '=== Seed PUBLISH_SKILL_REFERENTIAL terminé ===';
