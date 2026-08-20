namespace SoftGcc.Domain.Enums
{
    /// <summary>
    /// Statuts du workflow d'évaluation.
    /// Les valeurs correspondent à la colonne existante Evaluation.state (int).
    /// </summary>
    public enum EvaluationStatus
    {
        /// <summary>Brouillon / Initial — valeur par défaut (DEFAULT 0 en DDL SQL)</summary>
        Brouillon = 0,

        /// <summary>Évaluation planifiée, pas encore démarrée</summary>
        Planifiee = 10,

        /// <summary>Évaluation en cours de remplissage</summary>
        EnCours = 15,

        /// <summary>Évaluation terminée / validée</summary>
        Terminee = 20,

        /// <summary>Évaluation archivée</summary>
        Archivee = 30,

        /// <summary>Évaluation annulée</summary>
        Annulee = 40
    }
}
