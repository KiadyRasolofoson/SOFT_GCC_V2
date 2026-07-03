import React, { useState } from 'react';
import '../../../assets/css/Evaluations/Steps.css'; // Pour le style spécifique

function SectionA({ notes, setNotes }) {
  
  // Fonction pour gérer la sélection de note
  const handleNoteChange = (question, value) => {
    setNotes({
      ...notes,
      [question]: value
    });
  };

  return (
    <div className="sectionA-container">
      <h4>Évaluation de l'employé</h4>

      {/* Question 1 */}
      <div className="question">
        <p>1. Effectuer par quinzaine la consolidation comptable avec la Direction Générale, les analyses, contrôles et les régularisations dans la comptabilité de la DIR</p>
        <div className="note-selection">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
            <label key={`q1-${num}`}>
              <input
                type="radio"
                name="question1"
                value={num}
                checked={notes.question1 === num}
                onChange={() => handleNoteChange('question1', num)}
              />
              {num}
            </label>
          ))}
        </div>
      </div>

      {/* Question 2 */}
      <div className="question">
        <p>2. Traiter les opérations comptables de la Direction Inter Régionale, effectuer et mettre à jour les marchés</p>
        <div className="note-selection">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
            <label key={`q2-${num}`}>
              <input
                type="radio"
                name="question2"
                value={num}
                checked={notes.question2 === num}
                onChange={() => handleNoteChange('question2', num)}
              />
              {num}
            </label>
          ))}
        </div>
      </div>

      {/* Question 3 */}
      <div className="question">
        <p>3. Établir la situation de trésorerie hebdomadaire des comptes bancaires et le rapprochement bancaire des comptes de la DIR</p>
        <div className="note-selection">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
            <label key={`q3-${num}`}>
              <input
                type="radio"
                name="question3"
                value={num}
                checked={notes.question3 === num}
                onChange={() => handleNoteChange('question3', num)}
              />
              {num}
            </label>
          ))}
        </div>
      </div>

      {/* Question 4 */}
      <div className="question">
        <p>4. Effectuer le classement des pièces comptables</p>
        <div className="note-selection">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
            <label key={`q4-${num}`}>
              <input
                type="radio"
                name="question4"
                value={num}
                checked={notes.question4 === num}
                onChange={() => handleNoteChange('question4', num)}
              />
              {num}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SectionA;

