-- Seed de 40 notifications de test pour SQL Server
-- Usage :
--   1. Remplacer la valeur de @UserId par un utilisateur existant.
--   2. Exécuter le script.
--   3. Ouvrir le frontend et tester le rendu, la pagination et la réactivité.

DECLARE @UserId INT = 4;
DECLARE @Now DATETIME2 = SYSUTCDATETIME();

IF NOT EXISTS (SELECT 1 FROM users WHERE UserId = @UserId)
BEGIN
    THROW 50001, 'Utilisateur introuvable. Vérifiez la valeur de @UserId.', 1;
END;

;WITH NotificationSeed AS (
    SELECT *
    FROM (VALUES
        (1,  'evaluation_assigned',  'Evaluation annuelle planifiée',        'Évaluation créée pour le cycle annuel RH 2026.',                                                      '/evaluations',                             0,  1),
        (2,  'evaluation_validated', 'Evaluation validée',                    'Votre dernière évaluation annuelle a été validée par le superviseur.',                                '/evaluations/history',                     0,  2),
        (3,  'career_updated',       'Plan de carrière mis à jour',           'Le plan de carrière de votre collaborateur a été actualisé.',                                          '/careers',                                 1,  3),
        (4,  'wish_status_changed',  'Souhait d''évolution traité',           'Le statut du souhait d''évolution a changé : en cours de validation.',                                '/wish-evolution',                          0,  4),
        (5,  'sync_completed',       'Synchronisation terminée',              'La synchronisation des référentiels RH est terminée sans erreur.',                                     '/dashboard',                               1,  5),
        (6,  'license_expiring',     'Licence bientôt expirée',               'Une licence arrivera à expiration dans moins de 15 jours.',                                            '/licenses',                                0,  6),
        (7,  'evaluation_assigned',  'Entretien d''essai programmé',          'Une évaluation de période d''essai a été ajoutée au calendrier.',                                      '/evaluations',                             0,  7),
        (8,  'evaluation_validated', 'Entretien confirmé',                    'Le planning d''entretien a été confirmé par le manager.',                                              '/evaluations/calendar',                    1,  8),
        (9,  'career_updated',       'Mobilité interne enregistrée',          'Une nouvelle mobilité interne a été ajoutée au dossier carrière.',                                     '/careers/mobility',                        0,  9),
        (10, 'wish_status_changed',  'Souhait approuvé',                      'Le souhait d''évolution a été approuvé et passe à l''étape suivante.',                                 '/wish-evolution/history',                  1, 10),
        (11, 'sync_completed',       'Import collaborateurs terminé',         'L''import des collaborateurs a abouti avec succès.',                                                   '/employees',                               0, 11),
        (12, 'license_expiring',     'Rappel de renouvellement',              'Pensez à renouveler une licence associée au module RH.',                                               '/licenses',                                1, 12),
        (13, 'evaluation_assigned',  'Evaluation projet planifiée',           'Une évaluation projet a été affectée à un collaborateur.',                                             '/evaluations/project',                     0, 13),
        (14, 'evaluation_validated', 'Campagne d''évaluation clôturée',       'Une campagne d''évaluation a été clôturée avec succès.',                                                '/evaluations/history',                     1, 14),
        (15, 'career_updated',       'Historique carrière enrichi',           'Une étape supplémentaire a été ajoutée à l''historique carrière.',                                     '/careers/history',                         0, 15),
        (16, 'wish_status_changed',  'Demande rejetée',                       'Une demande d''évolution a été refusée avec commentaire du superviseur.',                             '/wish-evolution',                          1, 16),
        (17, 'sync_completed',       'Référentiel compétences synchronisé',   'Le référentiel des compétences est désormais à jour.',                                                 '/skills',                                  0, 17),
        (18, 'license_expiring',     'Alerte contrat de licence',             'Le contrat de licence d''un service partenaire approche de son échéance.',                            '/licenses/contracts',                      0, 18),
        (19, 'evaluation_assigned',  'Nouvelle session d''évaluation',        'Une session d''évaluation collective a été planifiée pour votre équipe.',                             '/evaluations/session',                     1, 19),
        (20, 'evaluation_validated', 'Résultats confirmés',                   'Les résultats d''évaluation ont été validés et publiés.',                                              '/evaluations/results',                     0, 20),
        (21, 'career_updated',       'Affectation mise à jour',               'Une affectation de poste a été mise à jour dans le parcours carrière.',                                '/careers/assignments',                     1, 21),
        (22, 'wish_status_changed',  'Souhait en attente RH',                 'Le dossier est en attente de traitement par les Ressources Humaines.',                                 '/wish-evolution/pending',                  0, 22),
        (23, 'sync_completed',       'Synchronisation terminée avec avertissements', 'La synchronisation s''est terminée avec quelques éléments à vérifier.',                          '/dashboard',                               1, 23),
        (24, 'license_expiring',     'Licence critique',                      'Une licence essentielle expire dans moins de 7 jours.',                                                '/licenses',                                0, 24),
        (25, 'evaluation_assigned',  'Evaluation exceptionnelle créée',       'Une évaluation exceptionnelle a été créée suite à une mobilité récente.',                              '/evaluations/exceptional',                 1, 25),
        (26, 'evaluation_validated', 'Validation RH obtenue',                 'Le service RH a validé la dernière campagne concernée.',                                               '/evaluations/history',                     0, 26),
        (27, 'career_updated',       'Compétence liée au poste mise à jour',  'Le niveau de compétence attendu a été ajusté pour un poste.',                                          '/positions',                               0, 27),
        (28, 'wish_status_changed',  'Souhait clôturé',                       'Le souhait d''évolution a été clôturé après décision finale.',                                         '/wish-evolution/history',                  1, 28),
        (29, 'sync_completed',       'Import organigramme terminé',           'L''organigramme a été resynchronisé avec les données sources.',                                        '/organizational-chart',                    0, 29),
        (30, 'license_expiring',     'Renouvellement à préparer',             'Le renouvellement d''une licence doit être préparé ce mois-ci.',                                       '/licenses',                                1, 30),
        (31, 'evaluation_assigned',  'Evaluation annuelle relancée',          'Une relance a été envoyée pour une évaluation annuelle non finalisée.',                                '/evaluations/follow-up',                   0, 31),
        (32, 'evaluation_validated', 'Entretien final approuvé',              'L''entretien final a été approuvé et archivé.',                                                        '/evaluations/archive',                     1, 32),
        (33, 'career_updated',       'Parcours professionnel mis à jour',     'Le parcours professionnel d''un employé a été complété.',                                              '/employees',                               0, 33),
        (34, 'wish_status_changed',  'Demande transmise au manager',          'La demande d''évolution a été transmise au manager pour avis.',                                        '/wish-evolution',                          1, 34),
        (35, 'sync_completed',       'Mise à jour des utilisateurs terminée', 'Les comptes utilisateurs ont été synchronisés avec succès.',                                            '/settings/users',                          0, 35),
        (36, 'license_expiring',     'Vérification de conformité requise',    'Une vérification de conformité est requise avant expiration de licence.',                             '/licenses/compliance',                     0, 36),
        (37, 'evaluation_assigned',  'Evaluation manager planifiée',          'Une évaluation manager a été ajoutée au planning de la semaine prochaine.',                            '/evaluations/manager',                     1, 37),
        (38, 'evaluation_validated', 'Bilan validé',                          'Le bilan final a été validé et rendu disponible.',                                                     '/evaluations/results',                     0, 38),
        (39, 'career_updated',       'Objectif carrière revu',                'Un objectif carrière a été révisé à la hausse.',                                                       '/careers/objectives',                      1, 39),
        (40, 'wish_status_changed',  'Souhait enregistré',                    'Un nouveau souhait d''évolution a été enregistré et attend un premier traitement.',                    '/wish-evolution',                          0, 40)
    ) AS v(seed_no, type, title, message, link, is_read, days_ago)
)
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    payload,
    is_read,
    created_at,
    read_at
)
SELECT
    @UserId,
    s.type,
    s.title,
    s.message,
    s.link,
    CONCAT(
        '{"seedNo":', s.seed_no,
        ',"scenario":"notifications-performance-test"',
        ',"generatedAt":"', CONVERT(VARCHAR(33), @Now, 127), '"}'
    ),
    CAST(s.is_read AS bit),
    DATEADD(DAY, -s.days_ago, @Now),
    CASE
        WHEN s.is_read = 1 THEN DATEADD(HOUR, 6, DATEADD(DAY, -s.days_ago, @Now))
        ELSE NULL
    END
FROM NotificationSeed AS s
ORDER BY s.seed_no;

SELECT
    notification_id,
    user_id,
    type,
    title,
    is_read,
    created_at
FROM notifications
WHERE user_id = @UserId
ORDER BY created_at DESC;
