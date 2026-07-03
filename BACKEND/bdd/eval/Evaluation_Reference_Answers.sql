-- Script pour ajouter la table des réponses de référence pour les évaluations
-- Cette table permettra aux RH d'avoir des références pour évaluer correctement les réponses

-- Création de la table Evaluation_Reference_Answers si elle n'existe pas déjà
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluation_Reference_Answers')
BEGIN
    CREATE TABLE Evaluation_Reference_Answers (
        ReferenceAnswerId INT PRIMARY KEY IDENTITY(1,1),
        QuestionId INT NOT NULL,
        ReferenceText NVARCHAR(MAX) NOT NULL,
        EvaluationGuidelines NVARCHAR(MAX) NULL,
        ExpectedKeyPoints NVARCHAR(MAX) NULL,
        ScoreDescription1 NVARCHAR(255) NULL, -- Description de ce qu'est une réponse de niveau 1
        ScoreDescription2 NVARCHAR(255) NULL, -- Description de ce qu'est une réponse de niveau 2
        ScoreDescription3 NVARCHAR(255) NULL, -- Description de ce qu'est une réponse de niveau 3
        ScoreDescription4 NVARCHAR(255) NULL, -- Description de ce qu'est une réponse de niveau 4
        ScoreDescription5 NVARCHAR(255) NULL, -- Description de ce qu'est une réponse de niveau 5
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME NULL,
        CreatedById INT NULL,
        UpdatedById INT NULL,
        State INT DEFAULT 1,
        FOREIGN KEY (QuestionId) REFERENCES Evaluation_questions(Question_id),
        FOREIGN KEY (CreatedById) REFERENCES Users(UserId),
        FOREIGN KEY (UpdatedById) REFERENCES Users(UserId)
    );

    -- Ajout d'un index pour accélérer les recherches par question
    CREATE INDEX IX_EvaluationReferenceAnswers_QuestionId
    ON Evaluation_Reference_Answers (QuestionId);
END

-- Suppression des données existantes pour éviter les doublons lors des tests
DELETE FROM Evaluation_Reference_Answers;

-- Insertion de données de référence pour les questions d'évaluation
INSERT INTO Evaluation_Reference_Answers (
    QuestionId, 
    ReferenceText, 
    EvaluationGuidelines, 
    ExpectedKeyPoints,
    ScoreDescription1,
    ScoreDescription2,
    ScoreDescription3,
    ScoreDescription4,
    ScoreDescription5
)
VALUES 
-- Pour la question "Comment évaluez-vous votre maîtrise de Java 8+ et de ses fonctionnalités (streams, lambda, etc.) ?"
(1, 
'Une bonne réponse démontre une compréhension approfondie de Java 8+ incluant: les streams pour traiter les collections de manière fonctionnelle, les expressions lambda pour créer des fonctions anonymes concises, les interfaces fonctionnelles comme Function, Predicate et Consumer, ainsi que d''autres fonctionnalités comme Optional pour gérer les valeurs nulles et la nouvelle API Date/Time.',
'Évaluez la compréhension pratique des fonctionnalités Java 8+ et la capacité à expliquer comment ces fonctionnalités peuvent améliorer la qualité et la maintenabilité du code.',
'- Compréhension des streams et de leur utilisation pour traiter les collections
- Capacité à écrire et utiliser des expressions lambda
- Connaissance des interfaces fonctionnelles principales
- Compréhension d''Optional pour éviter les NullPointerException
- Expérience avec l''API Date/Time
- Mention des méthodes par défaut dans les interfaces',
'Débutant: connaît à peine les concepts de base de Java 8+ et ne peut pas les utiliser concrètement',
'Basique: reconnaît les fonctionnalités de Java 8+ mais rencontre des difficultés pour les implémenter',
'Intermédiaire: utilise correctement streams, lambdas et autres fonctionnalités dans des cas simples',
'Avancé: maîtrise bien les fonctionnalités et peut implémenter des solutions élégantes avec Java 8+',
'Expert: utilisation avancée des fonctionnalités, comprend les mécanismes internes et optimise les performances'),

-- Pour la question "Dans quelle mesure maîtrisez-vous Spring Boot pour le développement d'applications ?"
(2, 
'Une bonne réponse démontre la capacité à créer des applications complètes avec Spring Boot, incluant l''utilisation de l''auto-configuration, les Spring Boot Starters, la gestion des propriétés de configuration, l''intégration avec différentes sources de données, la sécurité, et la capacité à déployer des applications en production.',
'Évaluez la profondeur des connaissances sur Spring Boot, l''expérience pratique avec le framework, et la capacité à résoudre des problèmes complexes ou à optimiser des applications.',
'- Compréhension de l''auto-configuration et comment la personnaliser
- Utilisation des Spring Boot Starters appropriés
- Configuration des applications via application.properties/yaml
- Connaissance des profils Spring pour différents environnements
- Gestion des dépendances et tests efficaces
- Expérience avec les Spring Boot Actuators pour le monitoring',
'Débutant: connaît à peine les bases de Spring Boot, nécessite de l''aide pour les tâches simples',
'Basique: peut configurer une application simple mais a du mal avec les concepts avancés',
'Intermédiaire: développe des applications fonctionnelles avec Spring Boot et comprend les mécanismes de base',
'Avancé: maîtrise bien les configurations complexes et peut optimiser les performances',
'Expert: expertise approfondie, peut créer des applications hautement personnalisées et solides'),

-- Pour la question "Êtes-vous à l'aise avec la configuration et l'optimisation de JPA/Hibernate ?"
(3, 
'Une bonne réponse montre une compréhension approfondie de JPA/Hibernate, incluant les bonnes pratiques de mapping objet-relationnel, la gestion efficace des relations entre entités, l''optimisation des requêtes avec les techniques appropriées (lazy/eager loading, caching), et la capacité à résoudre les problèmes courants comme le N+1.',
'Évaluez la connaissance des concepts JPA/Hibernate, l''expérience pratique avec différents types de mappings, et la capacité à optimiser les performances des applications.',
'- Compréhension du mapping entité-relation (OneToMany, ManyToOne, etc.)
- Connaissance des stratégies de chargement lazy/eager
- Utilisation efficace du cache Hibernate
- Optimisation des requêtes JPQL/HQL
- Gestion des transactions et de la concurrence
- Résolution des problèmes courants (N+1, LazyInitializationException)',
'Débutant: connaissances basiques du mapping ORM sans expérience d''optimisation',
'Basique: peut configurer des entités simples mais peu d''expérience avec les cas complexes',
'Intermédiaire: bonne compréhension des mappings et quelques techniques d''optimisation',
'Avancé: maîtrise les techniques d''optimisation et peut diagnostiquer les problèmes courants',
'Expert: connaissance approfondie de l''architecture interne et des stratégies d''optimisation avancées'),

-- Pour la question "Comment évaluez-vous vos compétences dans le développement d'applications avec Symfony ?"
(4, 
'Une bonne réponse démontre une compréhension solide de l''architecture MVC de Symfony, l''utilisation des composants clés (Routing, Controller, Twig, Forms, Security), la capacité à créer des applications modulaires et extensibles, et l''expérience avec l''écosystème Symfony (Doctrine, Messenger, etc.).',
'Évaluez la profondeur de la connaissance de Symfony, l''expérience avec les différentes versions, et la capacité à suivre les bonnes pratiques de développement.',
'- Maîtrise de l''architecture MVC et des composants principaux
- Expérience avec Doctrine ORM pour la persistance des données
- Développement de formulaires complexes et validation
- Mise en place de la sécurité et gestion des utilisateurs
- Utilisation des services et injection de dépendances
- Connaissances des bonnes pratiques (PSR, tests unitaires)',
'Débutant: peut à peine créer un contrôleur et afficher une page simple',
'Basique: comprend les bases de Symfony mais manque d''expérience pratique',
'Intermédiaire: développe des applications fonctionnelles et utilise correctement les composants principaux',
'Avancé: maîtrise bien le framework et peut créer des applications complexes et optimisées',
'Expert: connaissance approfondie de l''architecture interne, contribue à l''écosystème'),

-- Pour la question "Quel est votre niveau de maîtrise de Doctrine ORM pour la gestion des données ?"
(5, 
'Une bonne réponse montre une compréhension approfondie de Doctrine ORM, incluant le mapping des entités, la gestion des relations, l''optimisation des requêtes DQL, l''utilisation du QueryBuilder, les stratégies de cache, et la gestion des migrations de base de données.',
'Évaluez la connaissance des concepts de Doctrine, l''expérience pratique avec différents types de mappings, et la capacité à optimiser les performances des requêtes.',
'- Mapping des entités et annotations/attributs
- Gestion des relations entre entités
- Utilisation efficace du QueryBuilder et DQL
- Compréhension des événements du cycle de vie
- Optimisation des performances (lazy loading, caching)
- Gestion des migrations de schéma',
'Débutant: connaissances basiques du mapping entité-relation sans expérience d''optimisation',
'Basique: peut définir des entités simples mais a du mal avec les relations complexes',
'Intermédiaire: bonne utilisation de Doctrine avec compréhension des concepts principaux',
'Avancé: maîtrise les techniques d''optimisation et utilise efficacement le QueryBuilder/DQL',
'Expert: connaissance approfondie de l''architecture interne et peut résoudre des problèmes complexes'),

-- Pour la question "Comment évaluez-vous vos compétences en développement d'interfaces avec React et ses hooks ?"
(6, 
'Une bonne réponse démontre une compréhension approfondie du modèle de composant React, l''utilisation efficace des hooks (useState, useEffect, useContext, useReducer, etc.), la gestion optimale du cycle de vie des composants, et l''expérience avec les patterns avancés comme les render props, HOCs, et les composants contrôlés/non-contrôlés.',
'Évaluez la connaissance des concepts fondamentaux de React, la capacité à structurer une application, et l''expérience avec les hooks et l''écosystème React.',
'- Maîtrise des hooks fondamentaux (useState, useEffect)
- Création de hooks personnalisés réutilisables
- Gestion efficace de l''état et optimisation des performances
- Compréhension des patterns de composants (HOC, render props)
- Structuration appropriée des applications React
- Connaissance des bonnes pratiques (immutabilité, éviter les re-renders)',
'Débutant: connaît à peine la syntaxe JSX et les fondamentaux de React',
'Basique: peut créer des composants simples mais peu d''expérience avec les hooks',
'Intermédiaire: utilise correctement les hooks standards et peut structurer une application',
'Avancé: crée des hooks personnalisés et maîtrise les patterns avancés de composants',
'Expert: maîtrise approfondie de l''écosystème React, optimise les performances, contribue à la communauté'),

-- Pour la question "Êtes-vous à l'aise avec l'utilisation de Redux pour la gestion d'état global ?"
(7, 
'Une bonne réponse démontre une compréhension solide des principes fondamentaux de Redux (store unique, état immuable, actions, reducers), l''utilisation de middleware comme Redux Thunk ou Redux Saga pour les effets secondaires, et la capacité à organiser efficacement une application Redux avec les bonnes pratiques.',
'Évaluez la connaissance des concepts Redux, l''expérience pratique avec différentes approches de gestion d''état, et la capacité à implémenter des solutions efficaces.',
'- Compréhension du flux de données unidirectionnel
- Structuration appropriée des actions et reducers
- Utilisation de middleware pour les effets secondaires
- Organisation du store (normalisation des données)
- Integration avec React (React-Redux)
- Connaissance des alternatives (Context API, Recoil, MobX)',
'Débutant: comprend à peine les concepts de base de Redux',
'Basique: peut implémenter des fonctionnalités simples avec Redux mais de manière non optimale',
'Intermédiaire: applique correctement les patterns Redux et utilise les middlewares courants',
'Avancé: maîtrise bien Redux et ses outils associés, optimise la structure du store',
'Expert: expertise approfondie de l''écosystème Redux, implémente des patterns avancés et des optimisations'),

-- Pour la question "Comment évaluez-vous votre efficacité à résoudre les problèmes techniques des utilisateurs ?"
(15, 
'Une bonne réponse démontre une approche méthodique de résolution de problèmes, incluant l''écoute active des utilisateurs, l''identification systématique des causes racines, la documentation des solutions, et la capacité à expliquer clairement les problèmes et solutions aux utilisateurs de différents niveaux techniques.',
'Évaluez la méthodologie de résolution de problèmes, la communication avec les utilisateurs, et la capacité à résoudre efficacement les problèmes tout en assurant la satisfaction des utilisateurs.',
'- Approche méthodique de diagnostic des problèmes
- Communication efficace avec les utilisateurs
- Priorisation appropriée des incidents
- Documentation des solutions pour référence future
- Suivi des problèmes récurrents pour identifier les tendances
- Proposition d''améliorations systémiques',
'Débutant: résout les problèmes les plus simples, souvent avec assistance',
'Basique: peut résoudre des problèmes courants mais peine avec les cas complexes',
'Intermédiaire: résout efficacement la plupart des problèmes dans son domaine',
'Avancé: résout systématiquement les problèmes complexes avec une approche méthodique',
'Expert: excellence dans la résolution de problèmes, améliore les systèmes pour prévenir les récurrences');

-- Ajout d'autres références selon les besoins
-- Vous pouvez ajouter davantage de références en suivant le même modèle 