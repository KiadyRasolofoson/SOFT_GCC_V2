-- =============================================================================
-- Correctif : plein accès pour le(s) rôle(s) intitulés Admin
-- =============================================================================
-- Les scripts 03/06/07 attribuent TOUT au Role_id = 1. Or selon l'ordre
-- d'insertion, le rôle « Admin » peut avoir un autre id (ex. 3).
-- Idempotent. À exécuter après 05, 06, 07.
-- =============================================================================

DECLARE @adminRoles TABLE (role_id INT PRIMARY KEY);

INSERT INTO @adminRoles (role_id)
SELECT r.Role_id
FROM Roles r
WHERE LOWER(LTRIM(RTRIM(r.title))) IN ('admin', 'administrator', 'administrateur');

-- Si aucun titre Admin trouvé, fallback Role_id = 1
IF NOT EXISTS (SELECT 1 FROM @adminRoles)
BEGIN
    INSERT INTO @adminRoles (role_id) VALUES (1);
END

PRINT 'Rôles Admin ciblés :';
SELECT role_id FROM @adminRoles;

-- 1) Toutes les permissions actives
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT a.role_id, p.Permission_id
FROM @adminRoles a
CROSS JOIN Permissions p
WHERE p.state = 1
AND NOT EXISTS (
    SELECT 1 FROM Role_Permissions rp
    WHERE rp.role_id = a.role_id AND rp.permission_id = p.Permission_id
);

PRINT 'Permissions Admin synchronisées.';

-- 2) Tous les modules / pages actifs
INSERT INTO Role_Modules (role_id, module_id)
SELECT a.role_id, m.module_id
FROM @adminRoles a
CROSS JOIN Modules m
WHERE m.state = 1
AND NOT EXISTS (
    SELECT 1 FROM Role_Modules rm
    WHERE rm.role_id = a.role_id AND rm.module_id = m.module_id
);

PRINT 'Modules Admin synchronisés.';
PRINT '08_FIX_ADMIN_ROLE_BY_TITLE terminé.';
