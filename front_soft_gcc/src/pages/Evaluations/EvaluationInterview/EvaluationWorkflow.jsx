import { useState } from "react";
import { useUser } from '../../Authentification/UserContext';
import api from '../../../helpers/api';
import PropTypes from 'prop-types';
import PermissionService from '../../../services/PermissionService';

const EvaluationWorkflow = ({ interview }) => {
  const { hasPermission } = useUser();
  const [comment, setComment] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Vérification des permissions avec notre service
  const canValidateAsManager = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_MANAGER');
  const canValidateAsDirector = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_DIRECTOR');

  const handleSubmit = async (approval) => {
    try {
      if (!comment.trim()) {
        setError("Le commentaire est obligatoire.");
        return;
      }
  
      setError("");
      
      // Créer un objet complet avec toutes les propriétés du DTO
      let body = {
        managerApproval: null,
        managerComments: "",
        directorApproval: null,
        directorComments: "",
        notes: notes.trim() || null
      };
      
      // Remplir uniquement les champs pertinents selon le rôle
      if (canValidateAsManager) {
        body.managerApproval = approval;
        body.managerComments = comment;
      } else if (canValidateAsDirector) {
        body.directorApproval = approval;
        body.directorComments = comment;
      }
      
      console.log("Données envoyées au backend :", body);

      // Requête PUT avec Axios
      const response = await api.put(
        `/EvaluationInterview/complete-interview/${interview.interviewId}`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Réponse du backend :", response.data);

      const message = approval
        ? "Validation réussie."
        : "Refus enregistré avec succès.";
      setSuccess(message);
      alert(message);
    } catch (err) {
      setError("Impossible de soumettre l'évaluation: " + (err.response?.data || err.message));
      console.error("Erreur détaillée:", err);
    }
  };

  // Détermine le rôle à afficher en fonction des permissions
  const getRoleDisplay = () => {
    if (canValidateAsManager) return "Manager";
    if (canValidateAsDirector) return "Director";
    return "Non défini";
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5>Circuit de Validation</h5>
        <p>
          <strong>Rôle actuel :</strong> {getRoleDisplay()}
        </p>
        <div className="form-group">
          <label htmlFor="comment">Commentaire :</label>
          <textarea
            id="comment"
            className="form-control"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="notes">Notes additionnelles (optionnel) :</label>
          <textarea
            id="notes"
            className="form-control"
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <button
            className="btn btn-success me-2"
            onClick={() => handleSubmit(true)}
          >
            Valider
          </button>
          <button
            className="btn btn-danger"
            onClick={() => handleSubmit(false)}
          >
            Refuser
          </button>
        </div>
        {error && <div className="text-danger mt-3">{error}</div>}
        {success && <div className="text-success mt-3">{success}</div>}
      </div>
    </div>
  );
};

EvaluationWorkflow.propTypes = {
  interview: PropTypes.shape({
    interviewId: PropTypes.number.isRequired
  }).isRequired
};

export default EvaluationWorkflow;
