import React from 'react';
import { useNavigate } from 'react-router-dom';

// Bouton pour l'historique des competences
function SkillsHistory({ task }) {
  const navigate = useNavigate();

  // Navigation pour les historiques
  const handleClick = () => {
    navigate('/soft-gcc/historique');
  };
  
  return (
    <div className="button-save-profil">
      <button type="button" onClick={handleClick} className="btn btn-success btn-fw">Historiques</button>
    </div>
  );
}

export default SkillsHistory;
