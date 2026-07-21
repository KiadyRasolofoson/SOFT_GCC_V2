/*
	Date : 21 juillet 2026
	Description : Ajout des colonnes Nif et Stat dans la table Establishment
*/

USE Soft_GCC;

ALTER TABLE Establishment
ADD Nif NVARCHAR(50) NULL,
    Stat NVARCHAR(50) NULL;
