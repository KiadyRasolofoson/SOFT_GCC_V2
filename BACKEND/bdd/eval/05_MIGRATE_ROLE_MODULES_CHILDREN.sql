-- =============================================================================
-- Migration : élargir Role_Modules aux pages enfants
-- =============================================================================
-- Avant : seuls les modules racines étaient assignés ; tous les enfants s'affichaient.
-- Après : la visibilité est page par page. Ce script préserve le comportement
-- existant en ajoutant tous les enfants actifs des parents déjà assignés.
-- =============================================================================

INSERT INTO Role_Modules (role_id, module_id)
SELECT rm.role_id, c.module_id
FROM Role_Modules rm
INNER JOIN Modules p ON p.module_id = rm.module_id AND p.parent_module_id IS NULL
INNER JOIN Modules c ON c.parent_module_id = p.module_id AND c.state = 1
WHERE NOT EXISTS (
  SELECT 1 FROM Role_Modules x
  WHERE x.role_id = rm.role_id AND x.module_id = c.module_id
);
