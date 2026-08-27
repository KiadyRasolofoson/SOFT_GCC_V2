/* ============================================================================
   ADAPTATION_DONNEES_NOMINATION_TEST.sql
   Données de test pour la logique « Nomination (Plan de Carrière) ».

   PRÉREQUIS — exécuter D'ABORD (idempotent, ré-exécutable) :
     BACKEND/src/SoftGcc.Api/bdd/migration_relations_parametres_nomination.sql
   Il crée les colonnes/FK nécessaires :
     Department.Establishment_id
     Position.Department_id / Professional_category_id / Legal_class_id
     Legal_class.Professional_category_id + Min_salary
     Indication.Legal_class_id + Indication_value + Point_value
     Newsletter_template.Employee_type_id + Deduction_rate
     Employee.Rib_number / Bank_name

   Ce script est IDEMPOTENT (ré-exécutable sans danger) : il complète/adapte les
   données actuelles pour tester les cascades, le calcul du salaire, la grille
   minima et l'avertissement RIB. Base cible : Soft_GCC.

   Logique couverte (voir logique_metier_nomination.md) :
     1. Établissement → Département        (cascade)
     2. Département → Poste                (cascade)
     3. Poste → Catégorie pro + Classe     (pré-remplissage)
     4. Catégorie pro → Classe légale      (cascade)
     5. Classe légale → Indice             (cascade)
     6. Type de contrat → Modèle de bulletin (cascade)
     7. Salaire de base = Indice × Valeur du point
     8. Grille minima : base >= Min_salary de la classe
     9. Salaire net = base × (1 − Deduction_rate/100)
    10. RIB employé si mode de paiement = Virement
   ============================================================================ */
SET NOCOUNT ON;

PRINT '=== Adaptation des données Nomination (test) ===';

-- ── 1. ÉTABLISSEMENTS ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Establishment WHERE Establishment_name = N'Siège Social')
    INSERT INTO Establishment (Establishment_name) VALUES (N'Siège Social');

IF NOT EXISTS (SELECT 1 FROM Establishment WHERE Establishment_name = N'Agence Tamatave')
    INSERT INTO Establishment (Establishment_name) VALUES (N'Agence Tamatave');

-- ── 2. CATÉGORIES PROFESSIONNELLES ───────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Professional_category WHERE Professional_category_name = N'Cadre')
    INSERT INTO Professional_category (Professional_category_name) VALUES (N'Cadre');

IF NOT EXISTS (SELECT 1 FROM Professional_category WHERE Professional_category_name = N'Non-Cadre')
    INSERT INTO Professional_category (Professional_category_name) VALUES (N'Non-Cadre');

DECLARE @catCadre INT = (SELECT Professional_category_id FROM Professional_category WHERE Professional_category_name = N'Cadre');
DECLARE @catNonCadre INT = (SELECT Professional_category_id FROM Professional_category WHERE Professional_category_name = N'Non-Cadre');

-- ── 3. CLASSES LÉGALES (catégorie + minimum conventionnel) ───────────────
IF NOT EXISTS (SELECT 1 FROM Legal_class WHERE Legal_class_name = N'Classe Cadre A')
    INSERT INTO Legal_class (Legal_class_name, Professional_category_id, Min_salary)
    VALUES (N'Classe Cadre A', @catCadre, 2500000.00);

IF NOT EXISTS (SELECT 1 FROM Legal_class WHERE Legal_class_name = N'Classe Cadre B')
    INSERT INTO Legal_class (Legal_class_name, Professional_category_id, Min_salary)
    VALUES (N'Classe Cadre B', @catCadre, 1800000.00);

IF NOT EXISTS (SELECT 1 FROM Legal_class WHERE Legal_class_name = N'Classe Non-Cadre C')
    INSERT INTO Legal_class (Legal_class_name, Professional_category_id, Min_salary)
    VALUES (N'Classe Non-Cadre C', @catNonCadre, 800000.00);

DECLARE @classeA INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Cadre A');
DECLARE @classeB INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Cadre B');
DECLARE @classeC INT = (SELECT Legal_class_id FROM Legal_class WHERE Legal_class_name = N'Classe Non-Cadre C');

-- ── 4. INDICES (classe + valeur + point → salaire de base = valeur × point) ──
IF NOT EXISTS (SELECT 1 FROM Indication WHERE Indication_name = N'Indice Cadre A-55')
    INSERT INTO Indication (Indication_name, Legal_class_id, Indication_value, Point_value)
    VALUES (N'Indice Cadre A-55', @classeA, 55, 50000.00);            -- 55 × 50 000 = 2 750 000

IF NOT EXISTS (SELECT 1 FROM Indication WHERE Indication_name = N'Indice Cadre A-50')
    INSERT INTO Indication (Indication_name, Legal_class_id, Indication_value, Point_value)
    VALUES (N'Indice Cadre A-50', @classeA, 50, 50000.00);            -- 50 × 50 000 = 2 500 000

IF NOT EXISTS (SELECT 1 FROM Indication WHERE Indication_name = N'Indice Cadre B-40')
    INSERT INTO Indication (Indication_name, Legal_class_id, Indication_value, Point_value)
    VALUES (N'Indice Cadre B-40', @classeB, 40, 45000.00);            -- 40 × 45 000 = 1 800 000

IF NOT EXISTS (SELECT 1 FROM Indication WHERE Indication_name = N'Indice Non-Cadre C-20')
    INSERT INTO Indication (Indication_name, Legal_class_id, Indication_value, Point_value)
    VALUES (N'Indice Non-Cadre C-20', @classeC, 20, 40000.00);        -- 20 × 40 000 = 800 000

-- ── 5. TYPES DE CONTRAT ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Employee_type WHERE Employee_type_name = N'CDI')
    INSERT INTO Employee_type (Employee_type_name) VALUES (N'CDI');

IF NOT EXISTS (SELECT 1 FROM Employee_type WHERE Employee_type_name = N'CDD')
    INSERT INTO Employee_type (Employee_type_name) VALUES (N'CDD');

IF NOT EXISTS (SELECT 1 FROM Employee_type WHERE Employee_type_name = N'Stage')
    INSERT INTO Employee_type (Employee_type_name) VALUES (N'Stage');

DECLARE @cdi INT = (SELECT Employee_type_id FROM Employee_type WHERE Employee_type_name = N'CDI');
DECLARE @cdd INT = (SELECT Employee_type_id FROM Employee_type WHERE Employee_type_name = N'CDD');
DECLARE @stage INT = (SELECT Employee_type_id FROM Employee_type WHERE Employee_type_name = N'Stage');

-- ── 6. MODÈLES DE BULLETIN (type de contrat + taux de déduction → net) ──
IF NOT EXISTS (SELECT 1 FROM Newsletter_template WHERE Newsletter_template_name = N'Standard Cadre 40h')
    INSERT INTO Newsletter_template (Newsletter_template_name, Employee_type_id, Deduction_rate)
    VALUES (N'Standard Cadre 40h', @cdi, 20.00);   -- net = base × 0,80

IF NOT EXISTS (SELECT 1 FROM Newsletter_template WHERE Newsletter_template_name = N'Non-Cadre')
    INSERT INTO Newsletter_template (Newsletter_template_name, Employee_type_id, Deduction_rate)
    VALUES (N'Non-Cadre', @cdd, 12.00);            -- net = base × 0,88

IF NOT EXISTS (SELECT 1 FROM Newsletter_template WHERE Newsletter_template_name = N'Stagiaire')
    INSERT INTO Newsletter_template (Newsletter_template_name, Employee_type_id, Deduction_rate)
    VALUES (N'Stagiaire', @stage, 5.00);           -- net = base × 0,95

-- ── 7. MODES DE PAIEMENT ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Payment_method WHERE Payment_method_name = N'Virement bancaire')
    INSERT INTO Payment_method (Payment_method_name) VALUES (N'Virement bancaire');

IF NOT EXISTS (SELECT 1 FROM Payment_method WHERE Payment_method_name = N'Chèque')
    INSERT INTO Payment_method (Payment_method_name) VALUES (N'Chèque');

IF NOT EXISTS (SELECT 1 FROM Payment_method WHERE Payment_method_name = N'Espèces')
    INSERT INTO Payment_method (Payment_method_name) VALUES (N'Espèces');

-- ── 8. DÉPARTEMENTS : rattacher les existants à un établissement ─────────
DECLARE @siege INT = (SELECT TOP 1 Establishment_id FROM Establishment WHERE Establishment_name = N'Siège Social' ORDER BY Establishment_id);
UPDATE Department SET Establishment_id = @siege WHERE Establishment_id IS NULL AND @siege IS NOT NULL;

-- Si aucun département : en créer pour disposer de données de test.
IF NOT EXISTS (SELECT 1 FROM Department)
BEGIN
    DECLARE @siegeFallback INT = (SELECT TOP 1 Establishment_id FROM Establishment ORDER BY Establishment_id);
    INSERT INTO Department (Department_name, Establishment_id) VALUES
        (N'Informatique', @siegeFallback),
        (N'Ressources Humaines', @siegeFallback),
        (N'Finance', @siegeFallback);
END

-- ── 9. POSTES : rattacher département + catégorie + classe par défaut ────
--    Adaptez les valeurs par nom si votre référentiel est précis
--    (ex. : 'Développeur' → Informatique / Cadre / Classe Cadre A).
DECLARE @deptDefault INT = (SELECT TOP 1 Department_id FROM Department ORDER BY Department_id);
UPDATE Position
SET Department_id = COALESCE(Department_id, @deptDefault),
    Professional_category_id = COALESCE(Professional_category_id, @catCadre),
    Legal_class_id = COALESCE(Legal_class_id, @classeA)
WHERE @deptDefault IS NOT NULL AND @catCadre IS NOT NULL AND @classeA IS NOT NULL;

-- Si aucun poste : en créer pour disposer de données de test.
IF NOT EXISTS (SELECT 1 FROM Position)
BEGIN
    DECLARE @deptInfo INT = (SELECT TOP 1 Department_id FROM Department WHERE Department_name = N'Informatique');
    INSERT INTO Position (Position_name, Department_id, Professional_category_id, Legal_class_id) VALUES
        (N'Développeur Full-Stack', @deptInfo, @catCadre, @classeA),
        (N'Chef de projet', @deptInfo, @catCadre, @classeA);
END

-- ── 10. RIB EMPLOYÉ (mode de paiement = Virement) ────────────────────────
IF NOT EXISTS (SELECT 1 FROM Employee WHERE Rib_number IS NOT NULL AND Rib_number <> N'')
BEGIN
    UPDATE TOP (1) Employee
    SET Rib_number = N'00012-123456789-01',
        Bank_name = N'BNI Madagascar'
    WHERE Rib_number IS NULL OR Rib_number = N'';
END

-- ── 11. VÉRIFICATION (aperçu) ────────────────────────────────────────────
PRINT '';
PRINT 'Référentiels :';
SELECT 'Établissements' AS Lot, COUNT(*) AS Nb FROM Establishment
UNION ALL SELECT 'Catégories professionnelles', COUNT(*) FROM Professional_category
UNION ALL SELECT 'Classes légales', COUNT(*) FROM Legal_class
UNION ALL SELECT 'Indices', COUNT(*) FROM Indication
UNION ALL SELECT 'Types de contrat', COUNT(*) FROM Employee_type
UNION ALL SELECT 'Modèles de bulletin', COUNT(*) FROM Newsletter_template
UNION ALL SELECT 'Modes de paiement', COUNT(*) FROM Payment_method;

PRINT '';
PRINT 'Départements → Établissement :';
SELECT d.Department_name, e.Establishment_name
FROM Department d
LEFT JOIN Establishment e ON e.Establishment_id = d.Establishment_id
ORDER BY e.Establishment_name, d.Department_name;

PRINT '';
PRINT 'Postes → Département / Catégorie / Classe :';
SELECT p.Position_name, d.Department_name, pc.Professional_category_name, lc.Legal_class_name
FROM Position p
LEFT JOIN Department d ON d.Department_id = p.Department_id
LEFT JOIN Professional_category pc ON pc.Professional_category_id = p.Professional_category_id
LEFT JOIN Legal_class lc ON lc.Legal_class_id = p.Legal_class_id
ORDER BY p.Position_name;

PRINT '';
PRINT 'Calculs attendus (salaire de base = valeur × point, min classe) :';
SELECT i.Indication_name, i.Indication_value, i.Point_value,
       (i.Indication_value * i.Point_value) AS SalaireBase,
       lc.Legal_class_name, lc.Min_salary
FROM Indication i
LEFT JOIN Legal_class lc ON lc.Legal_class_id = i.Legal_class_id
ORDER BY lc.Legal_class_name, i.Indication_name;

PRINT '';
PRINT 'Employés avec RIB (mode Virement) :';
SELECT TOP 5 Registration_number, Rib_number, Bank_name FROM Employee ORDER BY Employee_id;

PRINT '';
PRINT '=== Adaptation des données Nomination (test) terminée. ===';
