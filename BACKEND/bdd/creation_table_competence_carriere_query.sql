/*
	Auteur : Inssa Chalman
	Date : 25 septembre 2024
	Description : Script de cr�ation base de donnees et des tables pour Soft_carriere_competences
	dans la module competences salaries et suivi carriere
	Version : 1.0


	Regle de clean code : 
		- Le nom des tables et colonnes commenceront par une lettre majuscule et utiliser le 
		camelcase pour les conventions de nommage
		- Le nom des tables et colonnes seront ecrit en anglais
		- Ajouter des commentaires en francais en haut de chaque script important
*/

USE Soft_GCC;

----------------------------------------- TABLES POUR COMPETENCES SALARIES -----------------------------------------------------------------------
-- Civilite
CREATE TABLE Civilite (
	Civilite_id INT PRIMARY KEY IDENTITY(1,1),
	Civilite_name NVARCHAR(50)
);

INSERT INTO Civilite(Civilite_name) VALUES ('Monsieur'), ('Madame');

-- Creation de la table departement(id, designation)
CREATE TABLE Department (
    Department_id INT PRIMARY KEY IDENTITY(1,1),
    Department_name NVARCHAR(50),
    Photo VARBINARY(MAX) NULL
);

-- Creation de la table employe(id, matricule, nom, prenom, date_embauche) simule
CREATE TABLE Employee (
	Employee_id INT PRIMARY KEY IDENTITY(1,1),
	Registration_number NVARCHAR(100) NOT NULL UNIQUE,
	Name NVARCHAR(100) NOT NULL,
	FirstName NVARCHAR(100) NOT NULL,
	Birthday DATE NOT NULL,
	Hiring_date DATE NOT NULL,
	Department_id INT NOT NULL REFERENCES Department(Department_id),
	Civilite_id INT NOT NULL REFERENCES Civilite(Civilite_id),
	Manager_id INT NULL REFERENCES Employee(Employee_id) ON DELETE NO ACTION,
	Photo VARBINARY(MAX) NULL,
	Email NVARCHAR(255) NULL
);



-- Insérer des employés avec des données de test
-- Pour cet exemple, nous allons supposer que l'Employee_id 1 est un manager
--INSERT INTO Employee (Registration_number, Name, FirstName, Birthday, Hiring_date, Department_id, 
--Civilite_id, Manager_id, Photo)
--VALUES 
--('REG001', 'Dupont', 'Jean', '1985-01-15', '2020-06-01', 3, 1, NULL, NULL),
--('REG002', 'Martin', 'Sophie', '1990-03-22', '2021-07-15', 2, 2, 1, NULL),
--('REG003', 'Bernard', 'Pierre', '1988-05-30', '2019-05-20', 3, 1, 1, NULL),
--('REG004', 'Durand', 'Claire', '1992-07-12', '2022-01-10', 4, 2, 1, NULL),
--('REG005', 'Leroy', 'Luc', '1980-09-25', '2018-11-05', 5, 1, 1, NULL),
--('REG006', 'Moreau', 'Alice', '1995-11-18', '2020-02-20', 1, 2, 1, NULL),
--('REG007', 'Simon', 'Julien', '1983-12-05', '2017-03-15', 2, 1, 2, NULL),
--('REG008', 'Michel', 'Laura', '1991-04-10', '2021-08-01', 3, 2, 3, NULL),
--('REG009', 'Lemoine', 'Thomas', '1987-06-20', '2019-09-30', 4, 1, 4, NULL),
--('REG010', 'Garnier', 'Emma', '1994-08-15', '2020-10-10', 5, 2, 5, NULL),
--('REG011', 'Roux', 'Antoine', '1986-02-28', '2018-12-12', 1, 1, 1, NULL),
--('REG012', 'Blanc', 'Chloé', '1993-03-15', '2021-01-20', 2, 2, 2, NULL),
--('REG013', 'Fournier', 'Nicolas', '1989-05-05', '2019-06-25', 3, 1, 3, NULL),
--('REG014', 'Giraud', 'Camille', '1992-07-30', '2020-04-15', 4, 2, 4, NULL),
--('REG015', 'Lemoine', 'Victor', '1984-09-10', '2018-11-01', 5, 1, 5, NULL),
--('REG016', 'Pires', 'Inès', '1991-10-20', '2019-02-05', 1, 2, 1, NULL),
--('REG017', 'Boucher', 'Louis', '1985-11-30', '2019-03-10', 2, 1, 1, NULL),
--('REG018', 'Gautier', 'Léa', '1990-12-15', '2020-05-25', 3, 2, 3, NULL),
--('REG019', 'Lemoine', 'Paul', '1988-01-05', '2018-07-20', 4, 1, 4, NULL),
--('REG020', 'Lemoine', 'Sarah', '1994-02-10', '2021-09-15', 5, 2, 5, NULL),
--('REG021', 'Renaud', 'Juliette', '1986-03-25', '2019-10-30', 1, 1, 1, NULL),
--('REG022', 'Bourgeois', 'Gabriel', '1993-04-15', '2020-11-05', 2, 2, 2, NULL),
--('REG023', 'Lemoine', 'Anaïs', '1989-05-20', '2018-12-15', 3, 1, 3, NULL),
--('REG024', 'Garnier', 'Maxime', '1992-06-30', '2021-01-10', 4, 2, 4, NULL),
--('REG025', 'Dupuis', 'Sophie', '1985-07-15', '2019-08-20', 5, 1, 5, NULL);
-----

-- Ajout d'une contrainte unique au registration number de employe
--ALTER TABLE Employee
--ADD CONSTRAINT UQ_Employee_RegistrationNumber UNIQUE (Registration_number);

---- Étape 1: Ajouter la colonne Manager_id
--ALTER TABLE Employee
--ADD Manager_id INT NULL;

--ALTER TABLE Employee
--ADD Photo VARBINARY(MAX) NULL;

-- Étape 2: Ajouter la contrainte de clé étrangère
--ALTER TABLE Employee
--ADD CONSTRAINT FK_Manager_Employee
--FOREIGN KEY (Manager_id)
--REFERENCES Employee(Employee_id)
--ON DELETE SET NULL; -- Optionnel : définit ce qui arrive si le manager est supprimé


-- Creation de la table filiere(id, designation)
CREATE TABLE Study_path (
	Study_path_id INT PRIMARY KEY IDENTITY(1,1),
	Study_path_name NVARCHAR(100) NOT NULL
);

-- Creation de la table diplome(id, designation)
CREATE TABLE Degree (
	Degree_id INT PRIMARY KEY IDENTITY(1,1),
	Degree_name NVARCHAR(100) NOT NULL
);

-- Creation de la table ecole(id, designation, adresse)
CREATE TABLE School (
	School_id INT PRIMARY KEY IDENTITY(1,1),
	School_name NVARCHAR(100) NOT NULL
);

-- Creation de la table education_employee(id, id_filiere, id_diplome, id_ecole, annee, etat)
CREATE TABLE Employee_education (
	Employee_education_id INT PRIMARY KEY IDENTITY(1,1),
	Study_path_id INT NOT NULL REFERENCES Study_path(Study_path_id),
	Degree_id INT NOT NULL REFERENCES Degree(Degree_id),
	School_ID INT NOT NULL REFERENCES School(School_id),
	Year INT,
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME,
	Employee_id INT NOT NULL REFERENCES Employee(Employee_id)
);


-- Creation de la table language(id, designation)
CREATE TABLE Language (
	Language_id INT PRIMARY KEY IDENTITY(1,1),
	Language_name NVARCHAR(100) NOT NULL
);

-- Creation de la table language_employe(id, id_language, id_nivreau_language, etat)
CREATE TABLE Employee_language(
	Employee_language_id INT PRIMARY KEY IDENTITY(1,1),
	Language_id INT NOT NULL REFERENCES Language(Language_id),
	Level DOUBLE PRECISION NOT NULL,
	State INT,
	creation_date DATETIME,
	Updated_date DATETIME,
	Employee_id INT NOT NULL REFERENCES Employee(Employee_id)
);

-- Creation de la table domaine(id, designation)
CREATE TABLE Domain_skill (
	Domain_skill_id INT PRIMARY KEY IDENTITY(1,1),
	Domain_skill_name NVARCHAR(100) NOT NULL
);

-- Creation de la table competence(id, designation)
CREATE TABLE Skill (
	Skill_id INT PRIMARY KEY IDENTITY(1,1),
	Skill_name NVARCHAR(100) NOT NULL
);

-- Creation de la table competence_employe(id, id_domaine, id_competence, etat)
CREATE TABLE Employee_skill (
	Employee_skill_id INT PRIMARY KEY IDENTITY(1,1),
	Domain_skill_id INT NOT NULL REFERENCES Domain_skill(Domain_skill_id),
	Skill_id INT NOT NULL REFERENCES Skill(Skill_id),
	Level DOUBLE PRECISION NOT NULL,
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME,
	Employee_id INT NOT NULL REFERENCES Employee(Employee_id)
);

-- Creation de la table autre_formation_employe(id, formation, etat)
CREATE TABLE Employee_other_formation (
	Employee_other_formation_id INT PRIMARY KEY IDENTITY(1,1),
	Description NVARCHAR(250),
	Start_date DATE NOT NULL,
	End_date DATE NOT NULL,
	Comment TEXT,
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME,
	Employee_id INT NOT NULL REFERENCES Employee(Employee_id)
);

----------------------------------- TABLES POUR CARRIERE  -------------------------------------------------------------------------

-- Creation de la table poste(id, designation)
CREATE TABLE Position (
	Position_id INT PRIMARY KEY IDENTITY(1,1),
	position_name NVARCHAR(100) NOT NULL,
);

-- Creation de la table type_affectation(id, designation)
CREATE TABLE Assignment_type (
	Assignment_type_id INT PRIMARY KEY IDENTITY(1,1),
	Assignment_type_name NVARCHAR(50)
);

-- Creation de la table etablissement(id, designation)
CREATE TABLE Establishment (
	Establishment_id INT PRIMARY KEY IDENTITY(1,1),
	Establishment_name NVARCHAR(50),
	Adress NVARCHAR(250),
	Contact NVARCHAR(250),
	Mail NVARCHAR(250),
	Website NVARCHAR(250),
	Social_network NVARCHAR(250),
	Logo VARBINARY(MAX) NULL,
	Creation_date DATETIME,
	Updated_date DATETIME
);

--Ajouter des nouvelles colonnes sur la table establishmment
--ALTER TABLE Establishment
--ADD 
--    Establishment_name NVARCHAR(50),
--    Adress NVARCHAR(250),
--    Contact NVARCHAR(250),
--    Mail NVARCHAR(250),
--    Website NVARCHAR(250),
--    SocialNetwork NVARCHAR(250),
--	Logo VARBINARY(MAX) NULL,
--	Creation_date DATETIME,
--	Updated_date DATETIME;


-- Creation de la table fonction(id, designation)
CREATE TABLE Fonction (
	Fonction_id INT PRIMARY KEY IDENTITY(1,1),
	Fonction_name NVARCHAR(50)
);

-- Creation de la table type_employee(id, designation)
CREATE TABLE Employee_type (
	Employee_type_id INT PRIMARY KEY IDENTITY(1,1),
	Employee_type_name NVARCHAR(50)
);

-- Creation de la table categorie_socio_professionnelle(id, designation)
CREATE TABLE Socio_category_professional (
	Socio_category_professional_id INT PRIMARY KEY IDENTITY(1,1),
	Socio_category_professional_name NVARCHAR(50)
);

-- Creation de la table indice(id, designation)
CREATE TABLE Indication (
	Indication_id INT PRIMARY KEY IDENTITY(1,1),
	Indication_name NVARCHAR(50)
);

-- Creation de la table category_professionnel(id, designation)
CREATE TABLE Professional_category (
	Professional_category_id INT PRIMARY KEY IDENTITY(1,1),
	Professional_category_name NVARCHAR(50)
);

-- Creation de la table classe_legale(id, designation)
CREATE TABLE legal_class (
	Legal_class_id INT PRIMARY KEY IDENTITY(1,1),
	Legal_class_name NVARCHAR(50)
);

-- Creation de la table Modele_bulletin(id, designation)
CREATE TABLE Newsletter_template (
	Newsletter_template_id INT PRIMARY KEY IDENTITY(1,1),
	Newsletter_template_name NVARCHAR(50)
);

-- Creation de la table method_paiement(id, designation)
CREATE TABLE Payment_method (
	Payment_method_id INT PRIMARY KEY IDENTITY(1,1),
	Payment_method_name NVARCHAR(50)
);

-- Creation de la table Echelon(id, designation)
CREATE TABLE Echelon (
	Echelon_id INT PRIMARY KEY IDENTITY(1,1),
	Echelon_name NVARCHAR(50)
);

-- Creation de la table type_attestation(id, designation)
CREATE TABLE Certificate_type (
	Certificate_type_id INT PRIMARY KEY IDENTITY(1,1),
	Certificate_type_name NVARCHAR(50),
	content TEXT,
	Creation_date DATETIME,
	Updated_date DATETIME
);

--ALTER TABLE Certificate_type
--ADD 
--   content TEXT,
--	Creation_date DATETIME,
--	Updated_date DATETIME;

-- Creation de la table carriere_plan
CREATE TABLE career_plan (
	Career_plan_id INT PRIMARY KEY IDENTITY(1,1),
	Assignment_type_id INT NOT NULL REFERENCES Assignment_type(Assignment_type_id),
	Registration_number NVARCHAR(50) NULL,
	Decision_number NVARCHAR(50) NULL,
	Decision_date DATE NULL,
	Assignment_date DATE NULL,
	Description TEXT NULL,
	Establishment_id INT NULL  REFERENCES Establishment(Establishment_id),
	Department_id INT NULL REFERENCES Department(Department_id),
	Position_id INT NULL REFERENCES Position(Position_id),
	Fonction_id INT NULL REFERENCES Fonction(Fonction_id),
	employee_type_id INT NULL REFERENCES Employee_type(Employee_type_id),
	Socio_category_professional_id INT NULL REFERENCES Socio_category_professional(Socio_category_professional_id),
	Indication_id INT NULL REFERENCES Indication(Indication_id),
	Base_salary DOUBLE PRECISION NULL,
	Net_salary DOUBLE PRECISION NULL,
	Professional_category_id INT NULL REFERENCES Professional_category(Professional_category_id),
	Legal_class_id INT NULL REFERENCES Legal_class(Legal_class_id),
	Newsletter_template_id INT NULL REFERENCES Newsletter_template(Newsletter_template_id),
	Payment_method_id INT NULL REFERENCES Payment_method(Payment_method_id),
	Ending_contract DATE NULL,
	Reason NVARCHAR(50) NULL,
	Assigning_institution NVARCHAR(100) NULL,
	Start_date DATE NULL,
	End_date DATE NULL,
	Echelon_id INT NULL REFERENCES Echelon(Echelon_id),
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME
);


-------------------------------------------- TABLE POUR GERER LES HISTORIQUES ------------------------------------------------------
-- Creation de la table module(id, designation)
CREATE TABLE Module (
	Module_id INT PRIMARY KEY IDENTITY(1,1),
	Module_name NVARCHAR(50)
);

-- Creation de la table historique(id, type, description, date, etat)
CREATE TABLE History (
	History_id INT PRIMARY KEY IDENTITY(1,1),
	Module_id INT NOT NULL REFERENCES Module(Module_id),
	Description NVARCHAR(250),
	Registration_number NVARCHAR(50) NOT NULL,
	State INT,
	Creation_date DATETIME DEFAULT GETDATE()
);

-- Creation de la table historique d'activite
CREATE TABLE Activity_logs (
    Activity_log_id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Module INT NOT NULL REFERENCES Module(Module_id),
    Action NVARCHAR(50) NOT NULL,
    Description NVARCHAR(MAX),
    Creation_date DATETIME NOT NULL DEFAULT GETDATE(),
    Metadata NVARCHAR(MAX)
);

---- Donne d'insertion
INSERT INTO Module(Module_name) VALUES ('Competences');
INSERT INTO Module(Module_name) VALUES ('Carrieres');

-------------------------------------------------- DEPART A LA RETRAITE --------------------------------------------------------------------
CREATE TABLE Retirement_parameter (
	Retirement_parameter_id INT PRIMARY KEY IDENTITY(1,1),
	Woman_age INT NOT NULL,
	Man_age INT NOT NULL
);

INSERT INTO Retirement_parameter (Woman_age, Man_age) VALUES (60, 60);

----------------------------------------------------- SOUHAIT EVOLUTION ----------------------------------------------------------------------
-- Creation de la table 
CREATE TABLE Wish_type (
	Wish_type_id INT PRIMARY KEY IDENTITY(1,1),
	designation NVARCHAR(250) NOT NULL,
);

--INSERT INTO Wish_type (designation) VALUES ('Evolution'), ('Changement de departement');

-- Creation de la table souhaitEvolution pour enregistrer les demandes de souhait d'evolution des employes
CREATE TABLE Wish_evolution_career (
	Wish_evolution_career_id INT PRIMARY KEY IDENTITY(1,1),
	Position_id INT NOT NULL REFERENCES Position(Position_id),
	Employee_id INT NOT NULL REFERENCES Employee(Employee_id),
	Wish_type_id INT NOT NULL REFERENCES Wish_type(Wish_type_id),
	Motivation NVARCHAR(250) NOT NULL,
	Disponibility DATE NOT NULL,
	Priority FLOAT NOT NULL,
	Request_date DATE NOT NULL,
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME
);


--INSERT INTO Wish_evolution_career(Position_id, Employee_id, Wish_type_id, Motivation, Disponibility, Priority, Request_date, State, 
--Creation_date, Updated_date) VALUES 
--(3, 7, 1, 'Etre Chef', '2024/12/14', 5, '2024/12/02', 1, GETDATE(), GETDATE()),
--(2, 8, 1, 'Etre chef', '2024/12/14', 5, '2024/11/25', 1, GETDATE(), GETDATE());

-- Creation de la table simulation pour les competences necessaires dans une poste
CREATE TABLE Skill_position (
	Skill_position_id INT PRIMARY KEY IDENTITY(1,1),
	Position_id INT NOT NULL REFERENCES Position(Position_id),
	Skill_id INT NOT NULL REFERENCES Skill(Skill_id),
	Required_level DOUBLE PRECISION NULL,
	State INT,
	Creation_date DATETIME,
	Updated_date DATETIME
);


--INSERT INTO skill_position (Position_id, Skill_id, State, Creation_date, Updated_date)
--VALUES 
--(1, 1, 1, GETDATE(), GETDATE()),
--(1, 2, 1, GETDATE(), GETDATE()),
--(1, 3, 1, GETDATE(), GETDATE()),
--(2, 4, 1, GETDATE(), GETDATE()),
--(2, 5, 1, GETDATE(), GETDATE()),
--(3, 6, 1, GETDATE(), GETDATE());

---------------------------------- Gestion d'attestation
-- Historique de certification
CREATE TABLE Certificate_history (
	Certificate_history_id INT PRIMARY KEY IDENTITY(1,1),
	Registration_number NVARCHAR(100),
	Certificate_type_id INT NOT NULL REFERENCES Certificate_type(Certificate_type_id),
	Reference NVARCHAR(50) NOT NULL UNIQUE,
	Pdf_file VARBINARY(MAX),
    File_name NVARCHAR(255),
    Content_type NVARCHAR(100),
	State INT,
	Creation_date DATETIME DEFAULT GETDATE(),
	Updated_date DATETIME DEFAULT GETDATE()
);

-- Pour vérifier les attestations
CREATE TABLE Work_certificates (
	Work_certificate_id INT PRIMARY KEY IDENTITY(1,1),
    Employee_name NVARCHAR(100),
    Position NVARCHAR(100),
    Start_date DATE,
    End_date DATE,
    Reference NVARCHAR(50),
    Token NVARCHAR(200) UNIQUE NOT NULL,
	Society NVARCHAR(50),
    Created_at DATETIME DEFAULT GETDATE()
);

--insert into skill_position (Position_id, Skill_id, State, Creation_date, Updated_date) Values
--(7, 45, 1, GETDATE(), GETDATE()),
--(7, 46, 1, GETDATE(), GETDATE()),
--(7, 47, 1, GETDATE(), GETDATE()),
--(7, 48, 1, GETDATE(), GETDATE()),
--(7, 49, 1, GETDATE(), GETDATE()),
--(7, 50, 1, GETDATE(), GETDATE()),
--(7, 52, 1, GETDATE(), GETDATE()),
--(7, 53, 1, GETDATE(), GETDATE()),
--(7, 54, 1, GETDATE(), GETDATE()),
--(7, 55, 1, GETDATE(), GETDATE()),
--(8, 18, 1, GETDATE(), GETDATE()),
--(15, 28, 1, GETDATE(), GETDATE()),
--(36, 45, 1, GETDATE(), GETDATE()),
--(36, 46, 1, GETDATE(), GETDATE()),
--(36, 47, 1, GETDATE(), GETDATE()),
--(36, 48, 1, GETDATE(), GETDATE()),
--(36, 49, 1, GETDATE(), GETDATE()),
--(36, 50, 1, GETDATE(), GETDATE()),
--(36, 52, 1, GETDATE(), GETDATE()),
--(36, 54, 1, GETDATE(), GETDATE()),
--(36, 55, 1, GETDATE(), GETDATE()),
--(36, 56, 1, GETDATE(), GETDATE()),
--(36, 57, 1, GETDATE(), GETDATE()),
--(36, 58, 1, GETDATE(), GETDATE()),
--(36, 59, 1, GETDATE(), GETDATE()),
--(36, 60, 1, GETDATE(), GETDATE()),
--(36, 61, 1, GETDATE(), GETDATE()),
--(3, 1, 1, GETDATE(), GETDATE()),
--(3, 2, 1, GETDATE(), GETDATE()),
--(3, 3, 1, GETDATE(), GETDATE()),
--(3, 4, 1, GETDATE(), GETDATE()),
--(3, 5, 1, GETDATE(), GETDATE()),
--(3, 7, 1, GETDATE(), GETDATE()),
--(3, 9, 1, GETDATE(), GETDATE()),
--(3, 10, 1, GETDATE(), GETDATE()),
--(3, 11, 1, GETDATE(), GETDATE()),
--(3, 12, 1, GETDATE(), GETDATE()),
--(3, 13, 1, GETDATE(), GETDATE()),
--(3, 14, 1, GETDATE(), GETDATE()),
--(3, 15, 1, GETDATE(), GETDATE()),
--(3, 16, 1, GETDATE(), GETDATE()),
--(3, 17, 1, GETDATE(), GETDATE()),
--(3, 19, 1, GETDATE(), GETDATE()),
--(47, 45, 1, GETDATE(), GETDATE()),
--(47, 46, 1, GETDATE(), GETDATE()),
--(47, 47, 1, GETDATE(), GETDATE()),
--(47, 48, 1, GETDATE(), GETDATE()),
--(47, 49, 1, GETDATE(), GETDATE()),
--(47, 50, 1, GETDATE(), GETDATE()),
--(47, 52, 1, GETDATE(), GETDATE()),
--(47, 54, 1, GETDATE(), GETDATE()),
--(47, 55, 1, GETDATE(), GETDATE()),
--(47, 56, 1, GETDATE(), GETDATE()),
--(47, 57, 1, GETDATE(), GETDATE()),
--(47, 58, 1, GETDATE(), GETDATE()),
--(47, 59, 1, GETDATE(), GETDATE()),
--(47, 60, 1, GETDATE(), GETDATE()),
--(47, 61, 1, GETDATE(), GETDATE());