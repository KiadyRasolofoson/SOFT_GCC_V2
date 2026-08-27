/* ============================================================================
   ADAPTATION_DONNEES_AVANCEMENT_TEST.sql
   Données de test pour la logique « Avancement (Plan de Carrière) ».

   PRÉREQUIS — exécuter D'ABORD, dans l'ordre (idempotents) :
     1. migration_relations_parametres_nomination.sql   (colonnes/FK Nomination)
     2. migration_relations_parametres_avancement.sql   (Echelon.Legal_class_id /
        Echelon.Indication_id / Echelon.Min_months)
     3. ADAPTATION_DONNEES_NOMINATION_TEST.sql          (établissements, catégories,
        classes, indices + valeurs, types de contrat, modèles, paiements, RIB employé)

   Ce script complète les données pour tester l'AVANCEMENT :
     - Échelons par classe légale (→ indice de la grille, durée minimale)
     - Un plan de carrière ACTIF (Nomination) pour un employé : situation actuelle
       (département, catégorie, classe, indice, échelon) → pré-remplissage,
       règle de progression (nouvel indice > actuel) et règle d'ancienneté.

   Règles couvertes (voir logique_metier_avancement.md) :
     R1 : nouvel indice strictement supérieur à l'indice actuel (bloquant)
     R2 : échelon → indice correspondant (bijection via Echelon.Indication_id)
     R3 : ancienneté >= Echelon.Min_months (avertissement non bloquant)
     R4 : changement catégorie/classe réinitialise échelon + indice
   ============================================================================ */
SET NOCOUNT ON;

PRINT '=== Adaptation des données Avancement (test) ===';

-- Références issues du script Nomination (classes + indices + valeurs).
DECLARE @classeA INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Cadre A');
DECLARE @classeB INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Cadre B');
DECLARE @classeC INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Non-Cadre C');

DECLARE @indA50 INT = (SELECT Indication_id FROM Indication WHERE Indication_name = N'Indice Cadre A-50');
DECLARE @indA55 INT = (SELECT Indication_id FROM Indication WHERE Indication_name = N'Indice Cadre A-55');
DECLARE @indB40 INT = (SELECT Indication_id FROM Indication WHERE Indication_name = N'Indice Cadre B-40');
DECLARE @indC20 INT = (SELECT Indication_id FROM Indication WHERE Indication_name = N'Indice Non-Cadre C-20');

-- ── 1. ÉCHELONS (par classe légale, liés à un indice + durée minimale) ─────
--    Classe Cadre A : Échelon 1 → Indice A-50 (base 2 500 000), Échelon 2 → Indice A-55 (base 2 750 000)
IF @classeA IS NOT NULL AND @indA50 IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM Echelon WHERE Echelon_name = N'Échelon 1' AND Legal_class_id = @classeA)
    INSERT INTO Echelon (Echelon_name, Legal_class_id, Indication_id, Min_months)
    VALUES (N'Échelon 1', @classeA, @indA50, 12);

IF @classeA IS NOT NULL AND @indA55 IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM Echelon WHERE Echelon_name = N'Échelon 2' AND Legal_class_id = @classeA)
    INSERT INTO Echelon (Echelon_name, Legal_class_id, Indication_id, Min_months)
    VALUES (N'Échelon 2', @classeA, @indA55, 24);

--    Classe Cadre B : Échelon 1 → Indice B-40 (base 1 800 000)
IF @classeB IS NOT NULL AND @indB40 IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM Echelon WHERE Echelon_name = N'Échelon 1' AND Legal_class_id = @classeB)
    INSERT INTO Echelon (Echelon_name, Legal_class_id, Indication_id, Min_months)
    VALUES (N'Échelon 1', @classeB, @indB40, 12);

--    Classe Non-Cadre C : Échelon 1 → Indice C-20 (base 800 000)
IF @classeC IS NOT NULL AND @indC20 IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM Echelon WHERE Echelon_name = N'Échelon 1' AND Legal_class_id = @classeC)
    INSERT INTO Echelon (Echelon_name, Legal_class_id, Indication_id, Min_months)
    VALUES (N'Échelon 1', @classeC, @indC20, 12);

-- ── 2. SITUATION ACTUELLE : plan de carrière ACTIF (Nomination) pour un employé ──
DECLARE @reg NVARCHAR(50) = (SELECT TOP 1 Registration_number FROM Employee
                             WHERE Rib_number IS NOT NULL AND Rib_number <> N'' ORDER BY Employee_id);
IF @reg IS NULL
    SET @reg = (SELECT TOP 1 Registration_number FROM Employee ORDER BY Employee_id);

IF @reg IS NOT NULL AND @classeA IS NOT NULL AND @indA50 IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM Career_plan WHERE Registration_number = @reg AND State > 0)
BEGIN
    DECLARE @dept INT = (SELECT TOP 1 Department_id FROM Department ORDER BY Department_id);
    DECLARE @pos  INT = (SELECT TOP 1 Position_id FROM Position ORDER BY Position_id);
    DECLARE @echelon1A INT = (SELECT TOP 1 Echelon_id FROM Echelon WHERE Legal_class_id = @classeA AND Indication_id = @indA50);
    DECLARE @catCadre INT = (SELECT TOP 1 Professional_category_id FROM Professional_category WHERE Professional_category_name = N'Cadre');

    -- Situation initiale à l'INDICE BAS (Échelon 1 → A-50) pour tester R1 :
    -- un avancement vers Échelon 2 (A-55) augmente l'indice.
    INSERT INTO Career_plan (
        Assignment_type_id, Registration_number, Decision_number, Decision_date, Assignment_date,
        Description, Department_id, Position_id, Indication_id, Base_salary, Net_salary,
        Professional_category_id, Legal_class_id, Echelon_id, State, Creation_date, Updated_date)
    VALUES (
        1, @reg, N'DEC-2025-NOM-001', '2025-06-15', '2025-07-01',
        N'Situation initiale — test avancement', @dept, @pos, @indA50,
        (SELECT Indication_value * Point_value FROM Indication WHERE Indication_id = @indA50),
        NULL,
        @catCadre, @classeA, @echelon1A, 1, GETDATE(), GETDATE());

    PRINT 'Situation actuelle créée pour l''employé ' + @reg + ' (Échelon 1 / Indice A-50).';
END
ELSE
    PRINT 'Aucun plan actif créé (employé introuvable ou plan existant).';

-- ── 3. VÉRIFICATION ────────────────────────────────────────────────────────
PRINT '';
PRINT 'Échelons → Classe / Indice / Durée min :';
SELECT e.Echelon_name, lc.Legal_class_name, i.Indication_name,
       (i.Indication_value * i.Point_value) AS SalaireBase, e.Min_months
FROM Echelon e
LEFT JOIN Legal_class lc ON lc.Legal_class_id = e.Legal_class_id
LEFT JOIN Indication i ON i.Indication_id = e.Indication_id
ORDER BY lc.Legal_class_name, e.Echelon_name;

PRINT '';
PRINT 'Situation actuelle (dernier plan actif) :';
SELECT TOP 1 cp.Registration_number, cp.Assignment_type_id, cp.Department_id, cp.Indication_id,
       cp.Echelon_id, cp.Base_salary, cp.Assignment_date, cp.State
FROM Career_plan cp
WHERE cp.State > 0
ORDER BY cp.Career_plan_id DESC;

PRINT '';
PRINT '=== Adaptation des données Avancement (test) terminée. ===';
