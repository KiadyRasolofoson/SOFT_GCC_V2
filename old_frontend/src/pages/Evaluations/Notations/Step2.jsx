import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../../assets/css/Evaluations/Steps.css'; // Styles spécifiques
import './Step2.css';

const Step2 = ({ ratings, remarks, onSaveRemarks }) => {
  const [localRemarks, setLocalRemarks] = useState({
    strengths: '',
    weaknesses: '',
    generalEvaluation: '',
  });

  useEffect(() => {
    if (remarks) {
      setLocalRemarks(remarks);
    }
  }, [remarks]);

  const handleChange = (field, value) => {
    const updatedRemarks = { ...localRemarks, [field]: value };
    setLocalRemarks(updatedRemarks);
    onSaveRemarks(updatedRemarks);
  };

  // Calculer la note moyenne
  const calculateAverage = () => {
    const scores = Object.values(ratings);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
  };

  // Obtenir une classe CSS en fonction de la note moyenne
  const getRatingClass = (average) => {
    if (average >= 4) return 'excellent';
    if (average >= 3) return 'good';
    if (average >= 2) return 'average';
    return 'poor';
  };

  const average = calculateAverage();
  const ratingClass = getRatingClass(average);

  return (
    <div className="step2-container">
      <h3>Étape 2 : Commentaires d&apos;évaluation</h3>
      
      <div className="average-score-container">
        <div className={`average-score ${ratingClass}`}>
          <h4>Note moyenne: {average}/5</h4>
          <div className="rating-description">
            {average >= 4 && <p>Excellente performance</p>}
            {average >= 3 && average < 4 && <p>Bonne performance</p>}
            {average >= 2 && average < 3 && <p>Performance moyenne</p>}
            {average < 2 && <p>Performance à améliorer</p>}
          </div>
        </div>
      </div>

      <div className="remarks-section">
        <div className="remarks-field">
          <label htmlFor="strengths">Points forts :</label>
          <textarea
            id="strengths"
            value={localRemarks.strengths}
            onChange={(e) => handleChange('strengths', e.target.value)}
            placeholder="Décrivez les points forts constatés durant l'évaluation..."
            rows={4}
          />
        </div>

        <div className="remarks-field">
          <label htmlFor="weaknesses">Points à améliorer :</label>
          <textarea
            id="weaknesses"
            value={localRemarks.weaknesses}
            onChange={(e) => handleChange('weaknesses', e.target.value)}
            placeholder="Décrivez les points à améliorer identifiés durant l'évaluation..."
            rows={4}
          />
        </div>

        <div className="remarks-field">
          <label htmlFor="generalEvaluation">Commentaire général :</label>
          <textarea
            id="generalEvaluation"
            value={localRemarks.generalEvaluation}
            onChange={(e) => handleChange('generalEvaluation', e.target.value)}
            placeholder="Rédigez un commentaire général sur la performance globale..."
            rows={6}
          />
        </div>
      </div>

      <div className="guidance-box">
        <h5>Guide pour la rédaction des commentaires</h5>
        <ul>
          <li>Soyez spécifique et objectif dans vos observations</li>
          <li>Utilisez des exemples concrets pour justifier votre évaluation</li>
          <li>Équilibrez les commentaires positifs et les axes d&apos;amélioration</li>
          <li>Privilégiez les suggestions constructives</li>
          <li>Alignez vos commentaires avec les compétences évaluées</li>
        </ul>
      </div>
    </div>
  );
};

Step2.propTypes = {
  ratings: PropTypes.object.isRequired,
  remarks: PropTypes.object,
  onSaveRemarks: PropTypes.func.isRequired,
};

Step2.defaultProps = {
  remarks: {
    strengths: '',
    weaknesses: '',
    generalEvaluation: '',
  },
};

export default Step2;
