namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public enum InterviewStatus
    {
        Planned = 10,       // L'entretien est planifié mais pas encore commencé
        InProgress = 20,    // L'entretien est en cours
        Completed = 30,     // L'entretien est terminé avec succès
        Rejected = 40,      // L'entretien est rejeté (par le Manager ou le Directeur)
        Cancelled = 50 ,     // L'entretien a été annulé
        PendingValidation = 25 // en attente de validation
    }
}
