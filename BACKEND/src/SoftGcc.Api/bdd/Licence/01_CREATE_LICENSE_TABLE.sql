-- =============================================================================
-- Script de création de la table de licences
-- Système de licensing on-premise basé sur RSA
-- =============================================================================

-- Supprime la table si elle existe déjà (pour réexécution)
IF OBJECT_ID('dbo.license', 'U') IS NOT NULL
    DROP TABLE dbo.license;

CREATE TABLE dbo.license (
    -- Identifiant unique de la licence (GUID généré côté éditeur)
    license_id              UNIQUEIDENTIFIER    NOT NULL PRIMARY KEY,

    -- Clé de licence complète (format base64: payload|signature)
    -- Permet de revalider la signature à tout moment
    license_key             NVARCHAR(MAX)       NOT NULL,

    -- Identifiant machine au moment de l'activation
    machine_id              NVARCHAR(512)       NOT NULL,

    -- Identifiant client associé à la licence
    customer_id             NVARCHAR(256)       NOT NULL,

    -- Date d'expiration de la licence
    expire_at               DATETIME2           NOT NULL,

    -- Date d'émission de la licence (côté éditeur)
    issued_at               DATETIME2           NOT NULL,

    -- Type de licence : Trial, Standard, Enterprise
    license_type            NVARCHAR(50)        NOT NULL,

    -- Liste des fonctionnalités activées, sérialisée en JSON
    features                NVARCHAR(MAX)       NOT NULL DEFAULT '[]',

    -- Date de la dernière validation réussie
    -- Utilisée pour la détection de clock rollback
    last_validated_at       DATETIME2           NULL,

    -- Indique si un rollback d'horloge a été détecté
    is_clock_rollback_detected BIT               NOT NULL DEFAULT 0,

    -- Date de création de l'enregistrement
    created_at              DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

    -- Date de dernière modification
    updated_at              DATETIME2           NOT NULL DEFAULT GETUTCDATE()
);

-- Index sur machine_id pour les recherches rapides
CREATE NONCLUSTERED INDEX IX_license_machine_id
    ON dbo.license (machine_id);

-- Index sur last_validated_at pour la détection de clock rollback
CREATE NONCLUSTERED INDEX IX_license_last_validated_at
    ON dbo.license (last_validated_at);

-- Index sur expire_at pour les notifications d'expiration
CREATE NONCLUSTERED INDEX IX_license_expire_at
    ON dbo.license (expire_at);

PRINT '✓ Table license créée avec succès.';
GO
