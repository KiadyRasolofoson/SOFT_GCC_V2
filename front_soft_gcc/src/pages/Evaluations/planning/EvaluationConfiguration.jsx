import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../../helpers/api';
import '../../../assets/css/Evaluations/EvaluationConfiguration.css';

function EvaluationConfiguration({ selectedEmployees, employees, onBack, onComplete, onRemoveEmployee, autoReminderEnabled }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [selectedEvaluationType, setSelectedEvaluationType] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(''); // Nouveau state pour la durée
  const [competenceLines, setCompetenceLines] = useState({});
  const [questions, setQuestions] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [loading, setLoading] = useState(false);
  const [durationRecommendation, setDurationRecommendation] = useState(null);

  // États pour les erreurs
  const [errors, setErrors] = useState({
    evaluationType: '',
    supervisors: '',
    dates: '',
    employees: '',
    duration: ''
  });

  // Fonction pour calculer les dates basées sur la durée
  const calculateDatesFromDuration = (weeks) => {
    if (!weeks || weeks <= 0) return { start: '', end: '' };
    
    const today = new Date();
    const startDate = new Date(today);
    
    // Calculer la date de fin (durée en semaines * 7 jours)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (weeks * 7) - 1); // -1 pour inclure le jour de début
    
    // Formatter les dates pour les inputs datetime-local
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = '09'; // Heure de début par défaut
      const minutes = '00';
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return {
      start: formatDateTime(startDate),
      end: formatDateTime(endDate)
    };
  };

  // Gestionnaire pour le changement de durée
  const handleDurationChange = (weeks) => {
    setDurationWeeks(weeks);
    setErrors(prev => ({ ...prev, duration: '', dates: '' }));
    
    if (weeks && weeks > 0) {
      const { start, end } = calculateDatesFromDuration(parseInt(weeks, 10));
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Fonction pour calculer la durée à partir des dates
  const calculateDurationFromDates = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return '';
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (end <= start) return '';
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
    const weeks = Math.ceil(diffDays / 7);
    
    return weeks.toString();
  };

  // Gestionnaire pour le changement de date de début
  const handleStartDateChange = (dateStr) => {
    setStartDate(dateStr);
    setErrors(prev => ({ ...prev, dates: '' }));
    
    if (dateStr && endDate) {
      const calculatedWeeks = calculateDurationFromDates(dateStr, endDate);
      setDurationWeeks(calculatedWeeks);
      
      const error = validateDates(dateStr, endDate);
      if (error) {
        setErrors(prev => ({ ...prev, dates: error }));
      }
    }
  };

  // Gestionnaire pour le changement de date de fin
  const handleEndDateChange = (dateStr) => {
    setEndDate(dateStr);
    setErrors(prev => ({ ...prev, dates: '' }));
    
    if (startDate && dateStr) {
      const calculatedWeeks = calculateDurationFromDates(startDate, dateStr);
      setDurationWeeks(calculatedWeeks);
      
      const error = validateDates(startDate, dateStr);
      if (error) {
        setErrors(prev => ({ ...prev, dates: error }));
      }
    }
  };

  // Chargement des données initiales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [evalTypesRes, supervisorsRes] = await Promise.all([
          api.get('/Evaluation/types'),
          api.get('/User/managers-directors')
        ]);

        setEvaluationTypes(evalTypesRes.data);
        setSupervisors(supervisorsRes.data);

        // Charger les compétences pour chaque employé
        const competencePromises = selectedEmployees.map(async (employeeId) => {
          const employee = employees.find(e => e.employeeId === employeeId);
          if (!employee) return null;

          const response = await api.get(`/CompetenceLine/position/${employee.positionId}`);
          console.log(`Données de compétences pour l'employé ${employeeId}:`, response.data);
          return { employeeId, competences: response.data };
        });

        const competenceResults = await Promise.all(competencePromises);
        const competenceMap = {};
        competenceResults.forEach(result => {
          if (result) {
            competenceMap[result.employeeId] = result.competences;
          }
        });
        setCompetenceLines(competenceMap);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedEmployees, employees]);

  // Chargement des questions lorsqu'un type d'évaluation est sélectionné
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedEvaluationType) {
        console.log('Aucun type d\'évaluation sélectionné');
        return;
      }

      try {
        setLoading(true);
        const questionsMap = {};

        for (const employeeId of selectedEmployees) {
          const employeeCompetences = competenceLines[employeeId] || [];
          console.log('Compétences pour l\'employé:', {
            employeeId,
            competences: employeeCompetences
          });

          questionsMap[employeeId] = {};

          for (const competence of employeeCompetences) {
            try {
              console.log('Récupération des questions pour:', {
                evaluationTypeId: selectedEvaluationType,
                positionId: competence.positionId,
                competenceLineId: competence.competenceLineId
              });

              const response = await api.get(
                `/Evaluation/questions`,
                {
                  params: {
                    evaluationTypeId: selectedEvaluationType,
                    positionId: competence.positionId,
                    competenceLineId: competence.competenceLineId
                  }
                }
              );

              console.log('Questions reçues:', response.data);
              if (Array.isArray(response.data) && response.data.length > 0) {
                questionsMap[employeeId][competence.competenceLineId] = response.data;
              } else {
                console.warn('Aucune question reçue pour:', {
                  employeeId,
                  competenceLineId: competence.competenceLineId
                });
              }
            } catch (error) {
              console.error('Erreur lors de la récupération des questions pour la compétence:', {
                employeeId,
                competenceLineId: competence.competenceLineId,
                error: error.response?.data || error.message
              });
            }
          }
        }

        console.log('Map finale des questions:', questionsMap);
        setQuestions(questionsMap);
      } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedEvaluationType, competenceLines, selectedEmployees]);

  // Gestion des superviseurs
  const handleAddSupervisor = (supervisorId) => {
    if (!supervisorId) return;

    const numericId = parseInt(supervisorId, 10);

    if (!selectedSupervisors.includes(numericId)) {
      const newSelectedSupervisors = [...selectedSupervisors, numericId];
      setSelectedSupervisors(newSelectedSupervisors);
      
      // Recalculer la durée recommandée si un type d'évaluation est sélectionné
      if (selectedEvaluationType && selectedEmployees.length > 0) {
        fetchRecommendedDuration().catch(err => {
          console.error('Erreur lors du recalcul de la durée recommandée:', err);
        });
      }
    }
  };

  const handleRemoveSupervisor = (supervisorId) => {
    const newSelectedSupervisors = selectedSupervisors.filter(id => id !== supervisorId);
    setSelectedSupervisors(newSelectedSupervisors);
    
    // Recalculer la durée recommandée si un type d'évaluation est sélectionné
    if (selectedEvaluationType && selectedEmployees.length > 0) {
      fetchRecommendedDuration().catch(err => {
        console.error('Erreur lors du recalcul de la durée recommandée:', err);
      });
    }
  };

  // Gestion des questions
  const handleQuestionSelection = (employeeId, competenceLineId, questionId, isSelected) => {
    console.log('Sélection de question:', {
      employeeId,
      competenceLineId,
      questionId,
      isSelected,
      type: typeof questionId
    });

    setSelectedQuestions(prev => {
      const newSelection = { ...prev };

      if (!newSelection[employeeId]) {
        newSelection[employeeId] = {};
      }
      if (!newSelection[employeeId][competenceLineId]) {
        newSelection[employeeId][competenceLineId] = [];
      }

      if (isSelected) {
        if (!newSelection[employeeId][competenceLineId].includes(questionId)) {
          newSelection[employeeId][competenceLineId].push(questionId);
        }
      } else {
        newSelection[employeeId][competenceLineId] = newSelection[employeeId][competenceLineId]
          .filter(id => id !== questionId);
      }

      console.log('Après mise à jour:', newSelection[employeeId][competenceLineId]);

      return newSelection;
    });
  };

  // Ajouter une fonction pour sélectionner/désélectionner toutes les questions d'une compétence
  const handleSelectAllQuestionsForCompetence = (employeeId, competenceLineId, questions, shouldSelect) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };

      if (!newSelection[employeeId]) {
        newSelection[employeeId] = {};
      }
      
      if (!newSelection[employeeId][competenceLineId]) {
        newSelection[employeeId][competenceLineId] = [];
      }

      if (shouldSelect) {
        // Sélectionner toutes les questions
        const questionIds = questions.map(q => q.questionId);
        newSelection[employeeId][competenceLineId] = questionIds;
      } else {
        // Désélectionner toutes les questions
        newSelection[employeeId][competenceLineId] = [];
      }

      return newSelection;
    });
  };

  // Fonction pour vérifier si une question est déjà sélectionnée pour un autre employé
  const isQuestionSelectedForOtherEmployee = (questionId, currentEmployeeId) => {
    for (const employeeId in selectedQuestions) {
      if (employeeId !== currentEmployeeId.toString()) {
        for (const compId in selectedQuestions[employeeId]) {
          if (selectedQuestions[employeeId][compId].includes(questionId)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Ajouter une fonction pour sélectionner aléatoirement N questions uniques pour un employé
  const handleRandomSelection = (employeeId, competenceLineId, questions, count) => {
    // Mélanger les questions
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    
    // Prendre les N premières (ou toutes si moins de N)
    const selectedCount = Math.min(count, shuffled.length);
    const selectedQuestionIds = shuffled.slice(0, selectedCount).map(q => q.questionId);
    
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };

      if (!newSelection[employeeId]) {
        newSelection[employeeId] = {};
      }
      
      if (!newSelection[employeeId][competenceLineId]) {
        newSelection[employeeId][competenceLineId] = [];
      }

      newSelection[employeeId][competenceLineId] = selectedQuestionIds;
      return newSelection;
    });
  };

  // Remplacer les fonctions getBaseDuration et calculateRecommendedDuration par une fonction qui appelle l'API
  const fetchRecommendedDuration = async () => {
    try {
      // Récupérer le nombre total de questions sélectionnées pour tous les employés
      let totalSelectedQuestions = 0;
      let totalCompetences = 0;
      let uniqueCompetences = new Set();
      let positionIds = [];
      
      for (const employeeId of selectedEmployees) {
        // Récupérer la position de l'employé
        const employee = employees.find(e => e.employeeId === employeeId);
        if (employee && employee.positionId) {
          positionIds.push(parseInt(employee.positionId, 10));
        }
        
        if (competenceLines[employeeId]) {
          // Compter les compétences uniques pour cet employé
          competenceLines[employeeId].forEach(competence => {
            uniqueCompetences.add(competence.competenceLineId);
          });
          
          // Compter les questions pour cet employé
          const employeeQuestions = questions[employeeId] || {};
          totalSelectedQuestions += Object.values(employeeQuestions).flat().length;
        }
      }
      
      totalCompetences = uniqueCompetences.size;
      
      // Calculer le nombre moyen de questions par employé
      const averageQuestionCount = totalSelectedQuestions > 0 && selectedEmployees.length > 0 
        ? Math.ceil(totalSelectedQuestions / selectedEmployees.length) 
        : 10; // Valeur par défaut si pas de questions encore
      
      // Calculer la durée actuelle en jours si les dates sont définies
      let currentDurationDays = null;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        currentDurationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
      }
      
      // Préparer les données pour l'API
      const requestData = {
        employeeCount: selectedEmployees.length,
        evaluationTypeId: selectedEvaluationType ? parseInt(selectedEvaluationType, 10) : 1,
        positionIds: positionIds,
        currentDurationDays: currentDurationDays,
        averageQuestionsPerEmployee: averageQuestionCount,
        totalCompetences: totalCompetences,
        supervisorCount: selectedSupervisors.length || 1
      };
      
      console.log('Envoi de la requête de calcul de durée:', requestData);
      
      // Appeler l'API
      const response = await api.post(
        '/EvaluationPlanning/calculate-recommended-duration',
        requestData
      );
      
      console.log('Réponse du calcul de durée:', response.data);
      
      // Stocker la recommandation
      setDurationRecommendation(response.data);
      
      // Retourner les données pour pouvoir les utiliser immédiatement
      return response.data;
    } catch (error) {
      console.error('Erreur lors du calcul de la durée recommandée:', error);
      
      // En cas d'erreur, utiliser une valeur par défaut simplifiée
      return {
        days: Math.max(7, selectedEmployees.length * 3),
        weeks: Math.max(1, Math.ceil(selectedEmployees.length * 3 / 7)),
        isCurrentDurationSufficient: false,
        justification: 'Une erreur est survenue lors du calcul de la durée recommandée.'
      };
    }
  };

  // Modifier la validation des dates pour utiliser l'API
  const validateDates = (startDateStr, endDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    let error = '';

    if (!startDate || !endDate) {
      error = 'Les deux dates doivent être définies.';
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (startDate < today) {
        error = 'La date de début ne peut pas être antérieure à aujourd\'hui.';
      } else if (endDate < startDate) {
        error = 'La date de fin ne peut pas être antérieure à la date de début.';
      } else {
        const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
        
        // Utiliser la recommandation de durée déjà stockée dans le state
        if (durationRecommendation && durationInDays < durationRecommendation.days) {
          error = `La durée planifiée (${durationInDays} jours) est inférieure à la durée recommandée (${durationRecommendation.days} jours, soit ${durationRecommendation.weeksDisplay || `${durationRecommendation.weeks} semaine${durationRecommendation.weeks > 1 ? 's' : ''}`}) pour ce type d'évaluation avec ${selectedEmployees.length} employé(s). Veuillez augmenter la durée ou réduire le nombre d'employés.`;
        }
      }
    }

    return error;
  };

  // Modification de la validation de la configuration
  const validateConfiguration = () => {
    const newErrors = {
      evaluationType: '',
      supervisors: '',
      dates: '',
      employees: '',
      duration: ''
    };

    let hasErrors = false;

    if (!selectedEvaluationType) {
      newErrors.evaluationType = 'Veuillez sélectionner un type d\'évaluation';
      hasErrors = true;
    }

    if (selectedSupervisors.length === 0) {
      newErrors.supervisors = 'Veuillez sélectionner au moins un superviseur';
      hasErrors = true;
    }

    if (!durationWeeks || parseInt(durationWeeks, 10) <= 0) {
      newErrors.duration = 'Veuillez définir une durée valide';
      hasErrors = true;
    }

    // Appel synchrone à validateDates
    const dateError = validateDates(startDate, endDate);
    if (dateError) {
      newErrors.dates = dateError;
      hasErrors = true;
    }

    if (selectedEmployees.length === 0) {
      newErrors.employees = 'Veuillez sélectionner au moins un employé';
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSave = () => {
    if (!validateConfiguration()) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Ajouter un effet pour calculer la recommandation quand les paramètres importants changent
  useEffect(() => {
    // Ne calculer que si on a à la fois des employés et un type d'évaluation
    if (selectedEmployees.length > 0 && selectedEvaluationType) {
      fetchRecommendedDuration().catch(err => {
        console.error('Erreur lors du calcul initial de la durée recommandée:', err);
      });
    }
  }, [selectedEmployees.length, selectedEvaluationType, selectedSupervisors.length]);

  const validateQuestions = () => {
    for (const employeeId of selectedEmployees) {
      const employeeQuestions = selectedQuestions[employeeId];
      if (!employeeQuestions || Object.values(employeeQuestions).flat().length === 0) {
        const employee = employees.find(e => e.employeeId === employeeId);
        alert(`Veuillez sélectionner au moins une question pour ${employee?.firstName} ${employee?.lastName}`);
        return false;
      }
    }
    return true;
  };

  const handleFinalizePlanning = async () => {
    try {
      if (!validateQuestions()) {
        return;
      }

      setLoading(true);

      const planningData = {
        evaluationTypeId: parseInt(selectedEvaluationType, 10),
        supervisorIds: selectedSupervisors.map(id => parseInt(id, 10)),
        startDate,
        endDate,
        enableReminders: autoReminderEnabled,
        employeeQuestions: selectedEmployees.map(employeeId => {
          const employee = employees.find(e => e.employeeId === employeeId);
          const employeeQuestions = selectedQuestions[employeeId] || {};

          const selectedQuestionIds = Object.values(employeeQuestions).flat();

          const questionsWithCompetence = selectedQuestionIds.map(questionId => {
            const competenceLineId = Object.entries(employeeQuestions).find(entry => 
              entry[1].includes(questionId)
            )?.[0];

            return {
              questionId: parseInt(questionId, 10),
              competenceLineId: competenceLineId ? parseInt(competenceLineId, 10) : null
            };
          });

          return {
            employeeId: parseInt(employeeId, 10),
            evaluationTypeId: parseInt(selectedEvaluationType, 10),
            positionId: parseInt(employee.positionId, 10),
            selectedQuestions: questionsWithCompetence
          };
        })
      };

      console.log('Données envoyées pour la planification:', planningData);

      const response = await api.post('/EvaluationPlanning/create-evaluation-with-questions', planningData);
      console.log('Réponse du serveur:', response.data);

      if (autoReminderEnabled && response.data && response.data.evaluationIds) {
        try {
        await api.post('/EvaluationPlanning/configure-reminders', {
            evaluationIds: response.data.evaluationIds,
            isEnabled: true
          });
          console.log('Rappels automatiques configurés avec succès');
        } catch (reminderError) {
          console.error("Erreur lors de la configuration des rappels automatiques:", reminderError);
        }
      }

      onComplete();
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      if (error.response?.data?.error) {
        alert(`Erreur lors de la planification: ${error.response.data.error}`);
      } else {
        alert('Une erreur est survenue lors de la planification des évaluations');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modification du rendu de l'étape 1
  const renderStep1Content = () => (
    <div className="step-content">
      <h3>Configuration de l&apos;évaluation</h3>

      {/* Liste des employés sélectionnés */}
      <div className="form-group">
        <label>Employés sélectionnés</label>
        <div className="selected-employees">
          {selectedEmployees.map(employeeId => {
            const employee = employees.find(e => e.employeeId === employeeId);
            return employee ? (
              <div key={employeeId} className="employee-tag">
                {employee.firstName} {employee.lastName}
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemoveEmployee(employeeId)}
                >
                  ×
                </button>
              </div>
            ) : null;
          })}
        </div>
        {errors.employees && <div className="error-message">{errors.employees}</div>}
      </div>

      {/* Type d'évaluation */}
      <div className="form-group">
        <label>Type d&apos;évaluation</label>
        <select
          className={`form-control ${errors.evaluationType ? 'is-invalid' : ''}`}
          value={selectedEvaluationType || ''}
          onChange={(e) => {
            setSelectedEvaluationType(e.target.value);
            setErrors(prev => ({ ...prev, evaluationType: '' }));
          }}
        >
          <option value="">Sélectionner un type</option>
          {evaluationTypes.map(type => (
            <option key={type.evaluationTypeId} value={type.evaluationTypeId}>
              {type.designation}
            </option>
          ))}
        </select>
        {errors.evaluationType && <div className="error-message">{errors.evaluationType}</div>}
      </div>

      {/* Gestion des superviseurs */}
      <div className="form-group">
        <label>Superviseurs</label>
        <div className="supervisor-selection">
          <div className="d-flex align-items-center gap-2">
            <select
              className={`form-control ${errors.supervisors ? 'is-invalid' : ''}`}
              onChange={(e) => {
                handleAddSupervisor(e.target.value);
                setErrors(prev => ({ ...prev, supervisors: '' }));
              }}
              value=""
            >
              <option value="">Ajouter un superviseur</option>
              {supervisors
                .filter(s => !selectedSupervisors.includes(parseInt(s.id, 10)))
                .map(supervisor => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.firstName} {supervisor.lastName}
                  </option>
                ))}
            </select>
          </div>
          <div className="selected-supervisors mt-2">
            {selectedSupervisors.map(supervisorId => {
              const supervisor = supervisors.find(s => parseInt(s.id, 10) === supervisorId);
              return supervisor ? (
                <div key={supervisorId} className="supervisor-tag">
                  {supervisor.firstName} {supervisor.lastName}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveSupervisor(supervisorId)}
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
        {errors.supervisors && <div className="error-message">{errors.supervisors}</div>}
      </div>

      {/* Durée et Dates */}
      <div className="form-group">
        
        {/* Champ durée en semaines */}
        <div className="duration-input mb-3">
          <label>Durée (en semaines)</label>
          <input
            type="number"
            min="1"
            max="52"
            className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
            value={durationWeeks}
            placeholder="Ex: 3"
            onChange={(e) => handleDurationChange(e.target.value)}
          />
          {errors.duration && <div className="error-message">{errors.duration}</div>}
          <small className="text-muted">La durée sera automatiquement convertie en dates avec heures</small>
        </div>

        {/* Dates avec heures */}
        <div className="date-range">
          <div className="date-input">
            <label>Date et heure de début</label>
            <input
              type="datetime-local"
              className={`form-control ${errors.dates ? 'is-invalid' : ''}`}
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>Date et heure de fin</label>
            <input
              type="datetime-local"
              className={`form-control ${errors.dates ? 'is-invalid' : ''}`}
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>
        </div>
        {errors.dates && <div className="error-message">{errors.dates}</div>}
        
        {/* <div className="mt-3 alert alert-secondary">
          <h6><i className="mdi mdi-information-outline mr-1"></i> Comment les durées sont-elles calculées ?</h6>
          <p className="mb-1">
            La durée représente la <strong>période totale</strong> pendant laquelle toutes les évaluations devront être réalisées.
            Tous les employés sélectionnés auront la même période d&apos;évaluation (même date de début et de fin).
          </p>
          <p className="mb-0">
            Les facteurs pris en compte sont :
            <ul className="mb-0">
              <li>Le nombre d&apos;employés à évaluer (plus d&apos;employés = plus de temps pour les responsables)</li>
              <li>Le type d&apos;évaluation (annuelle, performance, progression...)</li>
              <li>Le nombre et la complexité des questions à traiter</li>
              <li>Le nombre de compétences à évaluer</li>
            </ul>
          </p>
        </div> */}
        {selectedEvaluationType && selectedEmployees.length > 0 && selectedSupervisors.length > 0 && durationRecommendation && (
          <div className="alert alert-info mt-2">
            <i className="mdi mdi-chart-timeline-variant mr-1"></i>
            <strong>Recommandation actuelle:</strong> {durationRecommendation.days} jours ({durationRecommendation.weeksDisplay || `${durationRecommendation.weeks} semaine${durationRecommendation.weeks > 1 ? 's' : ''}`}) pour évaluer {selectedEmployees.length} employé{selectedEmployees.length > 1 ? 's' : ''} avec {selectedSupervisors.length} superviseur{selectedSupervisors.length > 1 ? 's' : ''}.
            {selectedSupervisors.length > 1 && (
              <div className="mt-1"><small><i className="mdi mdi-information-outline"></i> Le nombre de superviseurs réduit la durée recommandée car la charge de travail est répartie.</small></div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleRemoveEmployee = (employeeId) => {
    onRemoveEmployee(employeeId);
  };

  // Rendu des étapes
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1Content();
      case 2:
        return (
          <div className="step-content">
            <h3>Sélection des questions</h3>
            {selectedEmployees.map(employeeId => {
              const employee = employees.find(e => e.employeeId === employeeId);
              console.log('Rendu des questions pour l\'employé:', {
                employeeId,
                employee,
                competenceLines: competenceLines[employeeId],
                questions: questions[employeeId]
              });

              return (
                <div key={`employee-${employeeId}`} className="employee-questions">
                  <h4 className="employee-name mb-3">
                    <i className="mdi mdi-account-circle mr-2"></i>
                    {employee?.firstName} {employee?.lastName}
                  </h4>
                  
                  <div className="accordion" id={`accordion-${employeeId}`}>
                  {competenceLines[employeeId]?.map(competence => {
                      // Récupérer uniquement les questions pour cette compétence spécifique
                      const competenceQuestions = questions[employeeId]?.[competence.competenceLineId] || [];
                      
                      // Filtrer les questions pour n'avoir que celles qui correspondent exactement à cette compétence
                      const filteredQuestions = competenceQuestions.filter(q => 
                        q.competenceLineId === competence.competenceLineId
                      );

                      // Ne pas afficher cette compétence si elle n'a pas de questions
                      if (filteredQuestions.length === 0) {
                        return null;
                      }

                      // Générer un ID unique pour cet accordéon
                      const accordionId = `collapse-${employeeId}-${competence.competenceLineId}`;
                      const headingId = `heading-${employeeId}-${competence.competenceLineId}`;
                      const selectedCount = selectedQuestions[employeeId]?.[competence.competenceLineId]?.length || 0;

                    return (
                        <div key={`competence-${employeeId}-${competence.competenceLineId}`} className="competence-card mb-2">
                          <div className="competence-header" id={headingId}>
                            <button 
                              className="competence-toggle" 
                              data-toggle="collapse" 
                              data-target={`#${accordionId}`} 
                              aria-expanded="false" 
                              aria-controls={accordionId}
                            >
                              <div className="d-flex align-items-center">
                                <div className="competence-name">
                                  {competence.skillName || `Compétence #${competence.competenceLineId}`}
                                </div>
                                <div className="competence-badge">
                                  {filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''}
                                </div>
                              </div>
                              <i className="mdi mdi-chevron-down toggle-icon"></i>
                            </button>
                          </div>
                          
                          <div 
                            id={accordionId} 
                            className="collapse" 
                            aria-labelledby={headingId} 
                            data-parent={`#accordion-${employeeId}`}
                          >
                            <div className="competence-body">
                              <div className="competence-description mb-3">
                                {competence.description}
                              </div>
                              
                              <div className="selection-counter mb-3">
                                <span className={`selection-badge ${selectedCount > 0 ? 'active' : ''}`}>
                                  {selectedCount}/{filteredQuestions.length} sélectionnée{selectedCount > 1 ? 's' : ''}
                                </span>

                                <div className="selection-actions">
                                  <button 
                                    className="btn-selection"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSelectAllQuestionsForCompetence(employeeId, competence.competenceLineId, filteredQuestions, true);
                                    }}
                                  >
                                    <i className="mdi mdi-checkbox-marked"></i> Tout sélectionner
                                  </button>
                                  <button 
                                    className="btn-selection"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSelectAllQuestionsForCompetence(employeeId, competence.competenceLineId, filteredQuestions, false);
                                    }}
                                  >
                                    <i className="mdi mdi-checkbox-blank-outline"></i> Tout désélectionner
                                  </button>
                                  <button 
                                    className="btn-selection"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRandomSelection(employeeId, competence.competenceLineId, filteredQuestions, 2);
                                    }}
                                  >
                                    <i className="mdi mdi-shuffle-variant"></i> Aléatoire (2)
                                  </button>
                                </div>
                              </div>

                              <div className="questions-container">
                                {filteredQuestions.map(question => {
                                  if (!question || !question.questionId) {
                                return null;
                              }

                                  const questionKey = `question-${employeeId}-${competence.competenceLineId}-${question.questionId}`;
                                  const isChecked = selectedQuestions[employeeId]?.[competence.competenceLineId]?.includes(question.questionId) || false;
                                  const isUsedByOtherEmployee = isQuestionSelectedForOtherEmployee(question.questionId, employeeId);

                              return (
                                    <div 
                                      key={questionKey} 
                                      className={`question-item ${isUsedByOtherEmployee ? 'duplicate-warning' : ''} ${isChecked ? 'selected' : ''}`}
                                    >
                                      <div className="question-checkbox">
                                    <input
                                      type="checkbox"
                                      id={questionKey}
                                      checked={isChecked}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleQuestionSelection(
                                        employeeId,
                                        competence.competenceLineId,
                                              question.questionId,
                                        e.target.checked
                                            );
                                          }}
                                    />
                                        <label htmlFor={questionKey} className="checkbox-label">
                                          <i className="mdi mdi-pencil"></i>
                                    </label>
                                  </div>
                                      <div className="question-content">
                                        <div className="question-text">
                                          {question.question}
                                </div>
                                        {isUsedByOtherEmployee && (
                                          <div className="duplicate-alert">
                                            <i className="mdi mdi-alert"></i>
                                            Déjà sélectionnée pour un autre employé
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {competenceLines[employeeId]?.length > 0 && 
                    !competenceLines[employeeId]?.some(competence => {
                      const competenceQuestions = questions[employeeId]?.[competence.competenceLineId] || [];
                      const filteredQuestions = competenceQuestions.filter(q => 
                        q.competenceLineId === competence.competenceLineId
                      );
                      return filteredQuestions.length > 0;
                    }) && (
                      <div className="alert alert-info">
                        <i className="mdi mdi-information mr-2"></i>
                        Aucune question disponible pour cet employé. Veuillez vérifier les critères de sélection.
                      </div>
                    )
                  }
                </div>
              );
            })}
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3>Résumé de la configuration</h3>
            <div className="configuration-summary">
              <div className="summary-section">
                <h4>Type d&apos;évaluation</h4>
                <p>
                  {evaluationTypes.find(type => type.evaluationTypeId === parseInt(selectedEvaluationType, 10))?.designation}
                </p>
              </div>

              <div className="summary-section">
                <h4>Superviseurs sélectionnés</h4>
                <ul>
                  {selectedSupervisors.map(supervisorId => {
                    const supervisor = supervisors.find(s => parseInt(s.id, 10) === supervisorId);
                    return (
                      <li key={supervisorId}>
                        {supervisor?.firstName} {supervisor?.lastName}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="summary-section">
                <p>
                  <strong>Durée de l'évaluation:</strong> 
                  {/* {durationWeeks} semaine{parseInt(durationWeeks, 10) > 1 ? 's' : ''} */}
                </p>
                <p>
                  <strong>Du:</strong> {startDate ? new Date(startDate).toLocaleString() : 'Non défini'}<br/>
                  <strong>Au:</strong> {endDate ? new Date(endDate).toLocaleString() : 'Non défini'}
                </p>
              </div>

              <div className="summary-section">
                <h4>Employés et questions sélectionnées</h4>
                {selectedEmployees.map(employeeId => {
                  const employee = employees.find(e => e.employeeId === employeeId);
                  const employeeQuestions = selectedQuestions[employeeId] || {};
                  const employeeCompetenceLines = Object.entries(employeeQuestions).map(([competenceLineId, questionIds]) => {
                    const competence = competenceLines[employeeId]?.find(c => c.competenceLineId === parseInt(competenceLineId, 10));
                    return {
                      competenceName: competence?.skillName || 'Compétence inconnue',
                      questionCount: questionIds.length
                    };
                  });

                  return (
                    <div key={employeeId} className="employee-summary">
                      <h5>{employee?.firstName} {employee?.lastName}</h5>
                      <div className="competence-summary">
                        {employeeCompetenceLines.map((comp, index) => (
                        <div key={index} className="competence-item">
                          <strong>{comp.competenceName}:</strong> {comp.questionCount} questions
                        </div>
                      ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    return (
      <div className="action-buttons">
        <button
          className="btn btn-secondary"
          onClick={onBack}
          disabled={loading}
        >
          Retour
        </button>
        {currentStep < 3 ? (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            Suivant
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleFinalizePlanning}
            disabled={loading}
          >
            Planifier les évaluations
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="evaluation-configuration">
      {/* Barre de progression */}
      <div className="progress-steps">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
          1. Configuration
        </div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
          2. Sélection des questions
        </div>
        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>
          3. Résumé de la configuration
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="step-content-container">
        {renderStepContent()}
      </div>

      {/* Boutons d'action */}
      {renderActionButtons()}
    </div>
  );
}

EvaluationConfiguration.propTypes = {
  selectedEmployees: PropTypes.array.isRequired,
  employees: PropTypes.array.isRequired,
  onBack: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  autoReminderEnabled: PropTypes.bool
};

EvaluationConfiguration.defaultProps = {
  autoReminderEnabled: false
};

export default EvaluationConfiguration; 