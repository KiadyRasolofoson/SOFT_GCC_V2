-- =============================================
-- Script de mise à jour : colonnes manquantes
-- Base : soft_GCC (serveur 151.80.218.41)
-- Date : 2026-07-28
-- =============================================

PRINT '=== Mise à jour du schéma - Colonnes manquantes ===';
PRINT '';

-- 1. Ajout de employee_id dans Users
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') AND name = 'employee_id'
)
BEGIN
    ALTER TABLE Users ADD employee_id INT NULL;
    PRINT '✓ Colonne employee_id ajoutée à Users';
END
ELSE PRINT '→ Colonne employee_id existe déjà dans Users';

-- 2. Ajout de username dans Users
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') AND name = 'username'
)
BEGIN
    ALTER TABLE Users ADD username NVARCHAR(255) NULL;
    PRINT '✓ Colonne username ajoutée à Users';
END
ELSE PRINT '→ Colonne username existe déjà dans Users';

PRINT '';
PRINT '=== Mise à jour terminée ===';
