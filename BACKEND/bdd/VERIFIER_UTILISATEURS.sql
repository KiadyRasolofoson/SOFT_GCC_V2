-- Vérifier les utilisateurs existants dans la base de données
USE soft_GCC;
GO

-- Compter les utilisateurs
SELECT COUNT(*) AS NombreUtilisateurs FROM Users;

-- Afficher les 10 premiers utilisateurs (sans les mots de passe)
SELECT TOP 10 
    UserId,
    username,
    Email,
    first_name,
    last_name,
    role_id,
    state,
    creation_date
FROM Users
ORDER BY UserId;

-- Vérifier les rôles
SELECT * FROM Roles;
