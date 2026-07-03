import { useState, useEffect } from "react";
import PropTypes from 'prop-types';

const ParticipantsSelector = ({
  participantsList,
  selectedParticipants,
  setSelectedParticipants,
  fetchedEmployee
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState('');
  
  // Fonction utilitaire pour obtenir un ID valide
  const getValidId = (participant) => {
    if (!participant) return null;
    
    // Essayer d'obtenir l'ID de différentes façons
    const id = participant.employeeId || participant.id;
    
    // S'assurer que l'ID est un nombre valide
    return id !== undefined && id !== null ? Number(id) : null;
  };
  
  // Récupérer l'employé cible pour l'affichage - vérifier les deux sources
  const targetEmployee = window.selectedEmployeeForModal || fetchedEmployee;
  // Version de secours : essayer de trouver le premier participant s'il n'y a pas d'employé cible
  const targetEmployeeId = getValidId(targetEmployee);
  
  // Effet pour s'assurer que l'employé concerné est dans la liste des participants
  useEffect(() => {
    // Récupérer l'employé depuis la variable globale ou les props
    const effectiveEmployee = window.selectedEmployeeForModal || fetchedEmployee;
    
    if (effectiveEmployee) {
      // Obtenir l'ID de l'employé
      const employeeId = getValidId(effectiveEmployee);
      
      if (employeeId && !selectedParticipants.includes(employeeId)) {
        // Créer une nouvelle liste avec l'employé en premier
        const updatedParticipants = [
          employeeId,
          ...selectedParticipants.filter(id => id !== employeeId && id !== null && !isNaN(id))
        ];
        
        setSelectedParticipants(updatedParticipants);
      }
    }
  }, [fetchedEmployee, selectedParticipants, setSelectedParticipants]);
  
  // Gérer l'ajout d'un participant depuis la liste déroulante
  const handleParticipantAdd = (e) => {
    const participantIdStr = e.target.value;
    if (!participantIdStr) return;
    
    const participantId = Number(participantIdStr);
    
    if (!isNaN(participantId) && !selectedParticipants.includes(participantId)) {
      setSelectedParticipants([...selectedParticipants, participantId]);
    }
    
    // Réinitialiser la sélection
    setSelectedParticipant('');
  };
  
  // Gérer la suppression d'un participant
  const handleRemoveParticipant = (participantId) => {
    // Récupérer l'employé cible
    const effectiveEmployee = window.selectedEmployeeForModal || fetchedEmployee;
    const targetEmployeeId = getValidId(effectiveEmployee);
    
    // Empêcher la suppression de l'employé concerné
    if (targetEmployeeId && participantId === targetEmployeeId) {
      return;
    }
    
    setSelectedParticipants(selectedParticipants.filter(id => id !== participantId));
  };
  
  // Trouver les détails d'un participant par son ID
  const findParticipantById = (participantId) => {
    if (isNaN(participantId)) return null;
    
    // Si c'est l'employé cible, retourner directement les données de l'employé
    if (targetEmployee && getValidId(targetEmployee) === participantId) {
      return targetEmployee;
    }
    
    return participantsList.find(p => {
      const pId = getValidId(p);
      return pId === participantId;
    });
  };
  
  // Les participants qui ne sont pas encore sélectionnés
  const availableParticipants = participantsList.filter(participant => {
    const participantId = getValidId(participant);
    return participantId !== null && !selectedParticipants.includes(participantId);
  });
  
  // Filtrer les participants sélectionnés pour éliminer les valeurs invalides
  const validSelectedParticipants = selectedParticipants.filter(id => id !== null && !isNaN(id));
  
  // Regrouper les participants par fonction pour une meilleure organisation
  const groupedParticipants = {};
  availableParticipants.forEach(participant => {
    const role = participant.role || participant.Role || "Autre";
    if (!groupedParticipants[role]) {
      groupedParticipants[role] = [];
    }
    groupedParticipants[role].push(participant);
  });
  
  return (
    <div className="participants-selector-enhanced">
      {/* Sélecteur de participants amélioré */}
      <div className="input-group mb-3 shadow-sm border-0">
        <div className="input-group-prepend">
          <span className="input-group-text border-end-0" style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}>
            <i className="mdi mdi-account-multiple-plus text-primary" style={{ fontSize: '1.2rem' }}></i>
          </span>
        </div>
        <select 
          className="form-select py-2 ps-0 border-start-0"
          style={{ color: '#495057', backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
          value={selectedParticipant}
          onChange={handleParticipantAdd}
          aria-label="Ajouter un participant"
        >
          <option value="">Ajouter un participant à l&apos;entretien...</option>
          
          {/* Afficher les participants par groupe */}
          {Object.keys(groupedParticipants).map(role => (
            <optgroup key={role} label={role}>
              {groupedParticipants[role].map(participant => {
                const participantId = getValidId(participant);
                if (participantId === null || (targetEmployeeId && participantId === targetEmployeeId)) {
                  return null;
                }
                return (
                  <option key={participantId} value={participantId.toString()}>
                    {participant.firstName || participant.FirstName} {participant.lastName || participant.LastName}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>
      
      {/* Badge indiquant le nombre de participants sélectionnés */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold text-dark">Participants sélectionnés</span>
        <span className="badge bg-primary rounded-pill">{validSelectedParticipants.length}</span>
      </div>
      
      {/* Liste des participants sélectionnés avec cartes individuelles */}
      {validSelectedParticipants.length > 0 && (
        <div className="selected-participants-grid mt-3">
          {targetEmployee && validSelectedParticipants.includes(targetEmployeeId) && (
            <div className="participant-card primary-participant shadow-sm">
              <div className="d-flex align-items-center">
                <div className="avatar-initials me-3" 
                     style={{ backgroundColor: '#D4AC0D', color: 'white' }}
                     title="Employé évalué">
                  {(targetEmployee.firstName || targetEmployee.FirstName || '?').charAt(0).toUpperCase()}
                  {(targetEmployee.lastName || targetEmployee.LastName || '').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fw-bold">{targetEmployee.firstName || targetEmployee.FirstName} {targetEmployee.lastName || targetEmployee.LastName}</div>
                  <span className="badge bg-primary-light text-primary">Employé évalué</span>
                </div>
              </div>
            </div>
          )}
          
          {validSelectedParticipants
            .filter(id => !targetEmployeeId || id !== targetEmployeeId)
            .map(participantId => {
              const participant = findParticipantById(participantId);
              if (!participant) return null;
              
              return (
                <div key={participantId} className="participant-card shadow-sm">
                  <div className="d-flex align-items-center" style={{ width: '100%' }}>
                    <div 
                      className="avatar-initials me-3" 
                      style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white'
                      }}
                      title={`${participant.firstName || participant.FirstName} ${participant.lastName || participant.LastName}`}
                    >
                      {(participant.firstName || participant.FirstName || '?').charAt(0).toUpperCase()}
                      {(participant.lastName || participant.LastName || '').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="fw-bold">{participant.firstName || participant.FirstName} {participant.lastName || participant.LastName}</div>
                      {(participant.role || participant.Role) && (
                        <small className="text-muted">{participant.role || participant.Role}</small>
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-icon btn-light"
                      onClick={() => handleRemoveParticipant(participantId)}
                      aria-label="Retirer le participant"
                      title="Retirer"
                      style={{ marginLeft: '8px' }}
                    >
                      <i className="mdi mdi-close text-danger"></i>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {validSelectedParticipants.length === 0 && (
        <div className="alert alert-light text-center border-dashed mt-3 p-3" style={{ borderColor: '#dee2e6' }}>
          <i className="mdi mdi-information-outline me-2 text-primary"></i> 
          <span className="text-muted">Veuillez ajouter des participants à cet entretien.</span>
        </div>
      )}
    </div>
  );
};

ParticipantsSelector.propTypes = {
  participantsList: PropTypes.array.isRequired,
  selectedParticipants: PropTypes.array.isRequired,
  setSelectedParticipants: PropTypes.func.isRequired,
  fetchedEmployee: PropTypes.object
};

export default ParticipantsSelector;
