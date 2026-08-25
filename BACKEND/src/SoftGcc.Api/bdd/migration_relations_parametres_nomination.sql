/*
	Date : 2026-08-24
	Description : Script de migration pour mettre en place les RELATIONS entre les tables de
	paramètres du formulaire "Nomination (Plan de Carrière)" afin d'implémenter la logique
	métier décrite dans ".github/logique_metier_nomination.md".

	Logique métier couverte :
	  1. Établissement → Département        (filtre en cascade)
	  2. Département → Poste                (filtre en cascade)
	  3. Poste → Catégorie pro + Classe légale  (pré-remplissage)
	  4. Catégorie pro → Classe légale      (filtre)
	  5. Classe légale → Indice             (filtre)
	  6. Type de contrat → Modèle de bulletin (filtre)
	  7. Indice → Salaire de base           (Salaire de base = Indice × Valeur du point)
	  8. Grille minima                      (Salaire de base >= GrilleMinima(catégorie, classe))
	  9. Salaire net estimé                 (Net = Base × (1 - taux de déduction du modèle de bulletin))
	 10. RIB employé                        (vérification si mode de paiement = Virement)

	Base cible : Soft_GCC (SQL Server).
	Le script est idempotent (vérifie l'existence avant chaque ALTER).
*/

USE Soft_GCC;
GO

-- =====================================================================
-- 1. ÉTABLISSEMENT → DÉPARTEMENT
--    Department.Establishment_id  =>  filtre des départements par établissement
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Department') AND name = 'Establishment_id')
BEGIN
	ALTER TABLE Department ADD Establishment_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Department_Establishment')
BEGIN
	ALTER TABLE Department
		ADD CONSTRAINT FK_Department_Establishment
		FOREIGN KEY (Establishment_id) REFERENCES Establishment(Establishment_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 2. DÉPARTEMENT → POSTE
--    Position.Department_id  =>  filtre des postes par département
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Position') AND name = 'Department_id')
BEGIN
	ALTER TABLE Position ADD Department_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Position_Department')
BEGIN
	ALTER TABLE Position
		ADD CONSTRAINT FK_Position_Department
		FOREIGN KEY (Department_id) REFERENCES Department(Department_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 3. POSTE → CATÉGORIE PROFESSIONNELLE + CLASSE LÉGALE
--    Position.Professional_category_id / Position.Legal_class_id
--    => pré-remplissage de la catégorie pro et de la classe légale à la sélection du poste
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Position') AND name = 'Professional_category_id')
BEGIN
	ALTER TABLE Position ADD Professional_category_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Position_ProfessionalCategory')
BEGIN
	ALTER TABLE Position
		ADD CONSTRAINT FK_Position_ProfessionalCategory
		FOREIGN KEY (Professional_category_id) REFERENCES Professional_category(Professional_category_id)
		ON DELETE SET NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Position') AND name = 'Legal_class_id')
BEGIN
	ALTER TABLE Position ADD Legal_class_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Position_LegalClass')
BEGIN
	ALTER TABLE Position
		ADD CONSTRAINT FK_Position_LegalClass
		FOREIGN KEY (Legal_class_id) REFERENCES Legal_class(Legal_class_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 4. CATÉGORIE PROFESSIONNELLE → CLASSE LÉGALE
--    Legal_class.Professional_category_id  =>  filtre des classes légales par catégorie pro
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Legal_class') AND name = 'Professional_category_id')
BEGIN
	ALTER TABLE Legal_class ADD Professional_category_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LegalClass_ProfessionalCategory')
BEGIN
	ALTER TABLE Legal_class
		ADD CONSTRAINT FK_LegalClass_ProfessionalCategory
		FOREIGN KEY (Professional_category_id) REFERENCES Professional_category(Professional_category_id)
		ON DELETE SET NULL;
END
GO

-- =====================================================================
-- 5. CLASSE LÉGALE → INDICE  (+ données de calcul du salaire de base)
--    Indication.Legal_class_id   =>  filtre des indices par classe légale
--    Indication.Indication_value =>  valeur numérique de l'indice
--    Indication.Point_value      =>  valeur du point (taux)
--    Règle :  Salaire de base = Indication_value × Point_value
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Indication') AND name = 'Legal_class_id')
BEGIN
	ALTER TABLE Indication ADD Legal_class_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Indication_LegalClass')
BEGIN
	ALTER TABLE Indication
		ADD CONSTRAINT FK_Indication_LegalClass
		FOREIGN KEY (Legal_class_id) REFERENCES Legal_class(Legal_class_id)
		ON DELETE SET NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Indication') AND name = 'Indication_value')
BEGIN
	ALTER TABLE Indication ADD Indication_value DECIMAL(12,2) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Indication') AND name = 'Point_value')
BEGIN
	ALTER TABLE Indication ADD Point_value DECIMAL(12,2) NULL;
END
GO

-- =====================================================================
-- 6. TYPE DE CONTRAT → MODÈLE DE BULLETIN  (+ taux de déduction pour le net estimé)
--    Newsletter_template.Employee_type_id  =>  filtre des modèles par type de contrat
--    Newsletter_template.Deduction_rate    =>  % de cotisations/charges (estimation du net)
--    Règle :  Salaire net estimé = Base_salary × (1 - Deduction_rate/100)
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Newsletter_template') AND name = 'Employee_type_id')
BEGIN
	ALTER TABLE Newsletter_template ADD Employee_type_id INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NewsletterTemplate_EmployeeType')
BEGIN
	ALTER TABLE Newsletter_template
		ADD CONSTRAINT FK_NewsletterTemplate_EmployeeType
		FOREIGN KEY (Employee_type_id) REFERENCES Employee_type(Employee_type_id)
		ON DELETE SET NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Newsletter_template') AND name = 'Deduction_rate')
BEGIN
	ALTER TABLE Newsletter_template ADD Deduction_rate DECIMAL(5,2) NULL;
END
GO

-- =====================================================================
-- 7. GRILLE MINIMA (règle : Salaire de base >= GrilleMinima(catégorie, classe))
--    Legal_class.Min_salary  =>  minimum conventionnel de la classe légale
--    (combiné avec Professional_category_id pour la grille par catégorie/classe)
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Legal_class') AND name = 'Min_salary')
BEGIN
	ALTER TABLE Legal_class ADD Min_salary DECIMAL(12,2) NULL;
END
GO

-- =====================================================================
-- 8. RIB EMPLOYÉ (règle : si mode de paiement = Virement, vérifier un RIB valide)
--    Employee.Rib_number / Employee.Bank_name
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Employee') AND name = 'Rib_number')
BEGIN
	ALTER TABLE Employee ADD Rib_number NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Employee') AND name = 'Bank_name')
BEGIN
	ALTER TABLE Employee ADD Bank_name NVARCHAR(100) NULL;
END
GO

-- =====================================================================
-- 9. INDEX sur les colonnes de relation (performance des cascades)
-- =====================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Department_Establishment' AND object_id = OBJECT_ID('Department'))
	CREATE INDEX IX_Department_Establishment ON Department(Establishment_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Position_Department' AND object_id = OBJECT_ID('Position'))
	CREATE INDEX IX_Position_Department ON Position(Department_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Position_ProfessionalCategory' AND object_id = OBJECT_ID('Position'))
	CREATE INDEX IX_Position_ProfessionalCategory ON Position(Professional_category_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Position_LegalClass' AND object_id = OBJECT_ID('Position'))
	CREATE INDEX IX_Position_LegalClass ON Position(Legal_class_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LegalClass_ProfessionalCategory' AND object_id = OBJECT_ID('Legal_class'))
	CREATE INDEX IX_LegalClass_ProfessionalCategory ON Legal_class(Professional_category_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Indication_LegalClass' AND object_id = OBJECT_ID('Indication'))
	CREATE INDEX IX_Indication_LegalClass ON Indication(Legal_class_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NewsletterTemplate_EmployeeType' AND object_id = OBJECT_ID('Newsletter_template'))
	CREATE INDEX IX_NewsletterTemplate_EmployeeType ON Newsletter_template(Employee_type_id);
GO

-- =====================================================================
-- 10. (Optionnel) DONNÉES DE DÉMONSTRATION — relations de paramètres
--     À adapter à votre référentiel réel. Ici : quelques exemples types.
-- =====================================================================
/*
-- Exemple : rattacher des départements à un établissement
-- UPDATE Department SET Establishment_id = 1 WHERE Department_id IN (1,2,3);

-- Exemple : rattacher des postes à un département + catégorie/classe par défaut
-- UPDATE Position SET Department_id = 1, Professional_category_id = 1, Legal_class_id = 1 WHERE Position_id = 1;

-- Exemple : définir la valeur d'un indice et le taux du point
-- UPDATE Indication SET Indication_value = 300, Point_value = 50.00 WHERE Indication_id = 1;

-- Exemple : minimum conventionnel d'une classe légale
-- UPDATE Legal_class SET Min_salary = 150000.00, Professional_category_id = 1 WHERE Legal_class_id = 1;

-- Exemple : associer un modèle de bulletin à un type de contrat + taux de charges
-- UPDATE Newsletter_template SET Employee_type_id = 1, Deduction_rate = 15.00 WHERE Newsletter_template_id = 1;
*/

PRINT 'Migration des relations paramètres (Nomination) terminée.';
GO
