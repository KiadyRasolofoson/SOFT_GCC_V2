/*
	Date : 2026-08-25
	Description : Script de migration pour la logique métier du formulaire « Avancement (Plan de Carrière) »,
	règle 2 — Correspondance bijective Échelon ↔ Indice dans la grille indiciaire.

	Logique métier couverte :
	  1. Échelon → Classe légale        (Echelon.Legal_class_id  => filtre des échelons par classe)
	  2. Échelon → Indice               (Echelon.Indication_id   => la sélection d'un échelon
	                                                              pré-sélectionne automatiquement l'indice)

	Base cible : Soft_GCC (SQL Server).
	Le script est idempotent (vérifie l'existence avant chaque ALTER).
*/

USE Soft_GCC;
GO

-- =====================================================================
-- 1. ÉCHELON → CLASSE LÉGALE
--    Echelon.Legal_class_id  =>  filtre des échelons par classe légale
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Echelon') AND name = 'Legal_class_id')
BEGIN
	ALTER TABLE Echelon ADD Legal_class_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Echelon_LegalClass')
BEGIN
	ALTER TABLE Echelon
		ADD CONSTRAINT FK_Echelon_LegalClass
		FOREIGN KEY (Legal_class_id) REFERENCES Legal_class(Legal_class_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 2. ÉCHELON → INDICE
--    Echelon.Indication_id  =>  sélection d'un échelon => indice correspondant
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Echelon') AND name = 'Indication_id')
BEGIN
	ALTER TABLE Echelon ADD Indication_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Echelon_Indication')
BEGIN
	ALTER TABLE Echelon
		ADD CONSTRAINT FK_Echelon_Indication
		FOREIGN KEY (Indication_id) REFERENCES Indication(Indication_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 3. INDEX sur les colonnes de relation (performance des cascades)
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Echelon_LegalClass' AND object_id = OBJECT_ID('Echelon'))
	CREATE INDEX IX_Echelon_LegalClass ON Echelon(Legal_class_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Echelon_Indication' AND object_id = OBJECT_ID('Echelon'))
	CREATE INDEX IX_Echelon_Indication ON Echelon(Indication_id);
GO

-- =====================================================================
-- 4. ÉCHELON → DURÉE MINIMALE D'ANCIENNETÉ  (règle 3)
--    Echelon.Min_months  =>  ancienneté minimale (en mois) requise dans
--    l'échelon avant de pouvoir prétendre à un avancement
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Echelon') AND name = 'Min_months')
BEGIN
	ALTER TABLE Echelon ADD Min_months INT NULL;
END
GO

PRINT 'Migration des relations paramètres (Avancement / grille indiciaire) terminée.';
GO
