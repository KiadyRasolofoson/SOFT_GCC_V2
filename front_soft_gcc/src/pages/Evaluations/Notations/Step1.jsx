import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../../helpers/api';
import './Step1.css';

const Step1 = ({ evaluationId, setRatings }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localRatings, setLocalRatings] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [comments, setComments] = useState({});
  const [references, setReferences] = useState({});
  const [expandedReferences, setExpandedReferences] = useState({});
  const [questionOptions, setQuestionOptions] = useState({});
  const [evaluationType, setEvaluationType] = useState(null);

  
  const evaluationCriteria = [
    { id: 'global', label: 'Note globale' }
    // { id: 'relevance', label: 'Pertinence de la réponse' },
    // { id: 'technical', label: 'Niveau technique' },
    // { id: 'clarity', label: 'Clarté d\'expression' }
  ];

  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!evaluationId) {
          setError("ID d'évaluation non spécifié");
          setLoading(false);
          return;
        }

        // Récupérer le type d'évaluation
        try {
          const evalResponse = await api.get(`/Evaluation/${evaluationId}`);
          if (evalResponse.data && evalResponse.data.evaluationTypeId) {
            setEvaluationType(evalResponse.data.evaluationTypeId);
          }
        } catch (err) {
          console.warn("Erreur lors de la récupération du type d'évaluation:", err);
        }

        const questionsResponse = await api.get(`/Evaluation/evaluation/${evaluationId}/selected-questions`);
        
        // Vérifier les doublons potentiels par ID de question
        const questionIds = questionsResponse.data.map(q => q.questionId);
        const uniqueIds = [...new Set(questionIds)];
        if (questionIds.length !== uniqueIds.length) {
          console.warn('Doublons détectés dans les IDs de questions:', 
            questionIds.filter((id, index) => questionIds.indexOf(id) !== index));
        }
        
        // Filtrer pour n'avoir que des questions uniques par ID
        const uniqueQuestions = [];
        const seenIds = new Set();
        
        questionsResponse.data.forEach(item => {
          if (!seenIds.has(item.questionId)) {
            seenIds.add(item.questionId);
            uniqueQuestions.push(item);
          }
        });

        const formattedQuestions = uniqueQuestions.map(item => ({
          questionId: item.questionId,
          text: item.questionText,
          competenceLineId: item.competenceLineId,
          competenceName: item.competenceName || '',
          response: item.responseValue ? { responseValue: item.responseValue } : null,
          responseType: item.responseType,
          isCorrect: item.isCorrect
        }));

        setSelectedQuestions(formattedQuestions);

        const newRatings = {};
        const newCriteriaRatings = {};
        const newComments = {};

        formattedQuestions.forEach(question => {
          // Si nous avons déjà une réponse formatée, l'utiliser
          if (question.response) {
            const responseValue = question.response.responseValue || "";
            
            if (question.responseType === 'QCM') {
              const isCorrect = question.isCorrect;
              newRatings[question.questionId] = isCorrect ? 5 : 0;
              
              newComments[question.questionId] = '';
            } else {
              try {
                const cleanedResponse = responseValue.replace(/^"|"$/g, '');
                
                const parsedValue = cleanedResponse && cleanedResponse.startsWith("{")
                  ? JSON.parse(cleanedResponse)
                  : null;

                if (parsedValue && typeof parsedValue === 'object') {
                  evaluationCriteria.forEach(criteria => {
                    const criteriaKey = `${question.questionId}-${criteria.id}`;
                    newCriteriaRatings[criteriaKey] = parsedValue[criteria.id] || 0;
                  });

                  newComments[question.questionId] = parsedValue.comment || '';

                  const criteriaValues = evaluationCriteria
                    .map(c => parsedValue[c.id] || 0)
                    .filter(v => v > 0);

                  newRatings[question.questionId] = criteriaValues.length
                    ? Math.round(criteriaValues.reduce((sum, val) => sum + val, 0) / criteriaValues.length)
                    : 0;
                } else {
                  newRatings[question.questionId] = parseInt(cleanedResponse) || 0;
                  newComments[question.questionId] = '';
                }
              } catch {
                const cleanedResponse = responseValue.replace(/^"|"$/g, '');
                newRatings[question.questionId] = parseInt(cleanedResponse) || 0;
                newComments[question.questionId] = '';
              }
            }
          }
        });

        setLocalRatings(newRatings);
        setCriteriaRatings(newCriteriaRatings);
        setComments(newComments);
        setRatings(newRatings);

        if (formattedQuestions.length > 0) {
          try {
            const questionIds = formattedQuestions.map(q => q.questionId);
            
            const referencesResponse = await api.post(
              '/ReferenceAnswer/questions', 
              questionIds,
              { 
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                } 
              }
            );
            
            setReferences(referencesResponse.data);
            
            // Initialiser l'état des références (toutes cachées par défaut)
            const initialExpandedState = {};
            questionIds.forEach(id => {
              initialExpandedState[id] = false;
            });
            setExpandedReferences(initialExpandedState);
          }
          catch (refError) {
            console.error('Erreur lors de la récupération des références:', refError);
            // Ne pas bloquer le flux principal en cas d'erreur de références
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
        setLoading(false);
      }
    };

    if (evaluationId) {
      fetchEvaluationDetails();
    }
  }, [evaluationId]);

  useEffect(() => {
    const fetchQuestionOptions = async () => {
      try {
        if (!evaluationId) return;
        
        // Récupérer les options de questions pour les questions QCM
        const optionsResponse = await api.get(`/evaluation/${evaluationId}/options`);
        setQuestionOptions(optionsResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des options:", error);
      }
    };
    
    fetchQuestionOptions();
  }, [evaluationId]);

  const handleCriteriaRatingChange = (questionId, criteriaId, rating) => {
    const criteriaKey = `${questionId}-${criteriaId}`;
    setCriteriaRatings(prev => {
      const updated = { ...prev, [criteriaKey]: rating };
      
      // Si nous utilisons un seul critère global, utilisons directement cette note
      if (evaluationCriteria.length === 1 && evaluationCriteria[0].id === 'global') {
        setLocalRatings(lr => {
          const newRatings = { ...lr, [questionId]: rating };
          setRatings(newRatings);
          return newRatings;
        });
        return updated;
      }

      // Sinon, calculer la moyenne des critères
      const questionCriteriaKeys = evaluationCriteria.map(c => `${questionId}-${c.id}`);
      const criteriaValues = questionCriteriaKeys
        .map(key => updated[key] || 0)
        .filter(v => v > 0);
      const average = criteriaValues.length
        ? Math.round(criteriaValues.reduce((sum, val) => sum + val, 0) / criteriaValues.length)
        : 0;
      
      setLocalRatings(lr => {
        const newRatings = { ...lr, [questionId]: average };
        setRatings(newRatings);
        return newRatings;
      });
      return updated;
    });
  };

  const handleCommentChange = (questionId, comment) => {
    setComments(prev => ({ ...prev, [questionId]: comment }));
  };
  
  const getCriteriaRating = (questionId, criteriaId) => {
    return criteriaRatings[`${questionId}-${criteriaId}`] || 0;
  };

  // Fonction utilitaire pour obtenir la classe de couleur en fonction de la note
  const getRatingColorClass = (rating) => {
    if (!rating) return '';
    if (rating <= 2) return 'rating-low';
    if (rating === 3) return 'rating-medium';
    return 'rating-high';
  };

  // Fonction pour afficher les points clés attendus sous forme de liste
  const renderKeyPoints = (keyPoints) => {
    if (!keyPoints) return null;
    
    // Si keyPoints est un string, le diviser en lignes
    if (typeof keyPoints === 'string') {
      const lines = keyPoints.split('\n').filter(line => line.trim() !== '');
      
      return (
        <ul>
          {lines.map((line, index) => (
            <li key={index}>{line.replace(/^-\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    
    // Si c'est un tableau
    if (Array.isArray(keyPoints)) {
      return (
        <ul>
          {keyPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      );
    }
    
    // Par défaut, afficher tel quel
    return <p>{keyPoints}</p>;
  };

  // Fonction pour basculer l'affichage de la référence
  const toggleReferenceExpand = (questionId) => {
    setExpandedReferences(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="step1-container">
      <h2>Étape 1 : Notation</h2>

      {selectedQuestions.length > 0 ? (
        <div className="questions-section">
          <h3>Questions</h3>
          {selectedQuestions.map((question, index) => (
            <div key={`question-${question.questionId}-${index}`} className={`question-item ${evaluationType === 1 && question.responseType === 'QCM' ? 'annual-qcm-question' : ''}`}>
              {/* Nouvelle section pour la réponse de référence */}
              {references[question.questionId] && !(evaluationType === 1 && question.responseType === 'QCM') && (
                <div className="reference-section-container">
                  <button 
                    className={`reference-toggle-btn ${expandedReferences[question.questionId] ? 'active' : ''}`}
                    onClick={() => toggleReferenceExpand(question.questionId)}
                    title={expandedReferences[question.questionId] ? "Masquer la réponse de référence" : "Voir la réponse de référence"}
                  >
                    <span className="reference-icon">
                      {expandedReferences[question.questionId] ? '✕' : 'ℹ'}
                    </span>
                  </button>
                  
                  <div className={`reference-side-panel ${expandedReferences[question.questionId] ? 'expanded' : ''}`}>
                    <div className="reference-panel-header">
                      <h5>Réponse de référence</h5>
                    </div>
                    <div className="reference-panel-content">
                      <p className="reference-text">{references[question.questionId].referenceText}</p>
                      {references[question.questionId].keyPoints && (
                        <div className="key-points">
                          <h6>Points clés attendus :</h6>
                          {renderKeyPoints(references[question.questionId].keyPoints)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="question-response-section">
                <div className="question-header">
                  <div className="question-title">
                    <h4>Question {index + 1}</h4>
                    {question.competenceName && (
                      <span className="competence-tag">
                        {question.competenceName}
                      </span>
                    )}
                  </div>
                  <div className={`question-rating ${getRatingColorClass(localRatings[question.questionId])}`}>
                    <span className="rating-value">{localRatings[question.questionId] || 0}</span>
                    <span className="rating-label">/5</span>
                  </div>
                </div>
                
                <div className="question-content">
                  <p>{question.text}</p>
                </div>

                {/* Afficher la réponse donnée par l'employé */}
                {question.response && (
                  <div className="employee-response">
                    <h5>Réponse de l&apos;employé :</h5>
                    <div className="response-content">
                      {question.responseType === 'QCM' ? (
                        <div className="qcm-response">
                          {(() => {
                            // Essayer de nettoyer la valeur de réponse des guillemets potentiels
                            const cleanResponseValue = question.response.responseValue.replace(/^"|"$/g, '');
                            const optionId = parseInt(cleanResponseValue, 10);
                            
                            // Si nous avons les options pour cette question et l'ID est valide
                            if (questionOptions[question.questionId] && !isNaN(optionId)) {
                              // Chercher l'option correspondante
                              const option = questionOptions[question.questionId].find(opt => opt.optionId === optionId);
                              if (option) {
                                // Pour les évaluations annuelles (type 1), afficher simplement la réponse sans indication
                                if (evaluationType === 1) {
                                  return (
                                    <p className="annual-qcm-response">{option.optionText}</p>
                                  );
                                } 
                                // Pour les autres types d'évaluation, conserver l'affichage original
                                else {
                                  return (
                                    <>
                                      <div className="qcm-response-line">
                                        <span className={`option-text ${question.isCorrect ? 'correct-answer' : 'incorrect-answer'}`}>
                                          {option.optionText}
                                        </span>
                                        {question.isCorrect ? 
                                          <span className="correct-indicator">✓ Correct</span> : 
                                          <span className="incorrect-indicator">✗ Incorrect</span>
                                        }
                                      </div>
                                      
                                      {/* Afficher la réponse correcte si la réponse est incorrecte */}
                                      {!question.isCorrect && questionOptions[question.questionId] && (
                                        <div className="correct-option-info">
                                          <span className="correct-option-label">Réponse correcte :</span>
                                          {(() => {
                                            const correctOption = questionOptions[question.questionId].find(opt => opt.isCorrect);
                                            return correctOption ? (
                                              <span className="correct-option-text">{correctOption.optionText}</span>
                                            ) : (
                                              <span className="no-correct-option">Aucune option correcte définie</span>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </>
                                  );
                                }
                              }
                            }
                            
                            // Affichage par défaut si l'option n'est pas trouvée
                            return <span className="option-text">{cleanResponseValue}</span>;
                          })()}
                        </div>
                      ) : (
                        <p>{question.response.responseValue.replace(/^"|"$/g, '')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Section de notation */}
                <div className="rating-section">
                  <h5>Notation :</h5>
                  <div className="criteria-list">
                    {evaluationCriteria.map(criteria => (
                      <div key={criteria.id} className="criteria-item">
                        <div className="criteria-label">{criteria.label}</div>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              className={`star ${getCriteriaRating(question.questionId, criteria.id) >= star ? 'active' : ''}`}
                              onClick={() => handleCriteriaRatingChange(question.questionId, criteria.id, star)}
                            >
                              ★
                            </span>
              ))}
            </div>
          </div>
        ))}
      </div>
                  <div className="comment-section">
                    <label htmlFor={`comment-${question.questionId}`}>Commentaire :</label>
                    <textarea
                      id={`comment-${question.questionId}`}
                      value={comments[question.questionId] || ''}
                      onChange={(e) => handleCommentChange(question.questionId, e.target.value)}
                      placeholder="Ajouter un commentaire sur cette réponse..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-questions-message">
          Aucune question n&apos;a été sélectionnée pour cette évaluation.
        </div>
      )}
    </div>
  );
};

Step1.propTypes = {
  evaluationId: PropTypes.number.isRequired,
  setRatings: PropTypes.func.isRequired
};

export default Step1;