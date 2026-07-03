import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../helpers/api';
import { 
  Container, Typography, Box, Paper, Button, 
  Grid, Radio, RadioGroup, FormControlLabel, 
  TextField, CircularProgress, Alert, Card, CardContent,
  AppBar, Toolbar, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { 
  FaArrowRight, FaArrowLeft, FaPaperPlane,
  FaSpinner, FaBriefcase, FaBuilding,
  FaIdCard, FaSignOutAlt, FaClock, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [timeSpent, setTimeSpent] = useState({});
  const [progress, setProgress] = useState(0);
  const [questionOptions, setQuestionOptions] = useState({});
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [questionTimers, setQuestionTimers] = useState({});
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fonction pour vérifier si le token est expiré
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'expiration du token:', error);
      return true; // En cas d'erreur, considérer le token comme expiré
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('evaluationToken');
    localStorage.removeItem('evaluationId');
    toast.info('Vous avez été déconnecté.');
    navigate('/EvaluationLogin');
  };

  // Gestion du temps
  useEffect(() => {
    if (evaluationData && activeStep < evaluationData.questions.length) {
      const timerStartTime = new Date();
      
      const timer = setInterval(() => {
        const currentTime = new Date();
        const timeDiff = Math.floor((currentTime - timerStartTime) / 1000);
        setTimeSpent(prev => ({
          ...prev,
          [evaluationData.questions[activeStep].questionId]: timeDiff
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeStep, evaluationData]);

  // Calcul de la progression
  useEffect(() => {
    if (evaluationData && evaluationData.questions && evaluationData.questions.length > 0) {
      const totalQuestions = evaluationData.questions.length;
      
      // Ne compter que les questions qui ont réellement une réponse valide
      const answeredQuestions = Object.entries(answers).filter(([/* questionId */, value]) => {
        if (typeof value === 'string') {
          return value.trim() !== ''; // Pour les réponses textuelles
        } else if (typeof value === 'number') {
          return true; // Les valeurs numériques sont toujours considérées comme répondues
        }
        return false; // Autres types de valeurs (null, undefined, etc.) ne sont pas comptés
      }).length;
      
      setProgress((answeredQuestions / totalQuestions) * 100);
    }
  }, [answers, evaluationData]);

  // Ajouter la fonction pour récupérer les options des questions
  const fetchQuestionOptions = async (evaluationId) => {
    try {
      console.log('Récupération des options pour l\'évaluation:', evaluationId);
      const response = await api.get(`/evaluation/${evaluationId}/options`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('evaluationToken')}` }
      });
      console.log('Options récupérées:', response.data);
      setQuestionOptions(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des options:', error);
    }
  };

  // Fonction pour extraire l'ID de l'utilisateur du token JWT
  const getUserIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub; // L'ID de l'utilisateur est stocké dans la propriété 'sub' du token
    } catch (error) {
      console.error('Erreur lors de l\'extraction de l\'ID utilisateur du token:', error);
      return null;
    }
  };

  // Ajouter la fonction pour la sauvegarde automatique
  // Amélioration de la fonction setupAutoSave
  const setupAutoSave = (evaluationId) => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('evaluationToken');
        const userId = getUserIdFromToken(token);

        if (!userId) {
          console.error('Impossible de récupérer l\'ID de l\'utilisateur');
          return;
        }

        const totalQuestions = evaluationData && evaluationData.questions ? evaluationData.questions.length : 0;
        const answeredQuestions = Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== '').length;
        const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

        await api.post(`/evaluation/${evaluationId}/save-progress`, {
          userId: parseInt(userId),
          totalQuestions,
          answeredQuestions,
          progressPercentage
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde automatique:', error);
        toast.error('Erreur lors de la sauvegarde automatique de la progression.');
      }
    }, 30000); // Sauvegarde toutes les 30 secondes

    setAutoSaveInterval(interval);
  };

  // Amélioration de la fonction pour initialiser le timer d'une question
  const initializeQuestionTimer = (questionId, maxTimeInMinutes) => {
    console.log(`Initialisation du timer pour la question ${questionId} avec ${maxTimeInMinutes} minutes`);
    
    // Valeur par défaut de 15 minutes si non spécifié
    const timeInSeconds = (maxTimeInMinutes || 15) * 60;
    
    setQuestionTimers(prev => ({
      ...prev,
      [questionId]: timeInSeconds
    }));
    
    setQuestionTimeRemaining(prev => ({
      ...prev,
      [questionId]: timeInSeconds
    }));
    
    // Enregistrer également un horodatage de début pour des statistiques
    const startTimestamp = new Date().toISOString();
    setTimeSpent(prev => ({
      ...prev,
      [questionId]: {
        seconds: 0,
        startTime: startTimestamp
      }
    }));
  };
  
  // Fonction pour enregistrer les données de temps pour l'analyse ultérieure
  const recordQuestionTimeData = async (evaluationId, questionId, secondsSpent) => {
    try {
      // Si nous voulons implémenter l'envoi des données de temps au backend
      // Cette fonction préparerait et enverrait ces données
      // Pour l'instant, nous les journalisons simplement dans la console
      console.log(`Question ${questionId}: ${secondsSpent} secondes passées`);
      
      // Exemple d'envoi au backend (à implémenter selon les besoins)
      // await axios.post(`/api/evaluation/${evaluationId}/time-metrics`, {
      //   questionId,
      //   secondsSpent
      // });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des données de temps:", error);
    }
  };
  
  // Modifier l'useEffect pour utiliser le temps écoulé dans les réponses
  useEffect(() => {
    if (evaluationData && evaluationData.questions && activeStep < evaluationData.questions.length) {
      const currentQuestion = evaluationData.questions[activeStep];
      
      // Initialiser le timer pour la question courante si ce n'est pas déjà fait
      if (!questionTimers[currentQuestion.questionId]) {
        // Utiliser le temps spécifique de la question ou la valeur par défaut de 15 minutes
        initializeQuestionTimer(currentQuestion.questionId, currentQuestion.maxTimeInMinutes || 15);
      }

      const timer = setInterval(() => {
        // Mettre à jour le temps passé (incrémenter de 1 seconde)
        setTimeSpent(prev => {
          const currentData = prev[currentQuestion.questionId] || { seconds: 0 };
          return {
            ...prev,
            [currentQuestion.questionId]: {
              ...currentData,
              seconds: (currentData.seconds || 0) + 1
            }
          };
        });

        // Mettre à jour le temps restant
        setQuestionTimeRemaining(prev => {
          const remaining = prev[currentQuestion.questionId] - 1;
          
          // Avertir l'utilisateur lorsqu'il reste peu de temps
          if (remaining === 60) { // Alerte à 1 minute restante
            toast.warning("Il vous reste seulement 1 minute pour cette question!", {
              position: "top-right",
              autoClose: 3000
            });
          }
          
          if (remaining <= 0) {
            // Si le temps est écoulé, avertir l'utilisateur et proposer de passer à la question suivante
            clearInterval(timer);
            
            if (activeStep < evaluationData.questions.length - 1) {
              toast.error("Temps écoulé pour cette question!", {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
                closeButton: (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                      toast.dismiss();
                      handleNext();
                    }}
                  >
                    Passer à la suivante
                  </Button>
                )
              });
            } else {
              toast.error("Temps écoulé pour cette question! C'est la dernière question.", {
                position: "top-center",
                autoClose: 5000
              });
            }
            return prev;
          }
          
          return {
            ...prev,
            [currentQuestion.questionId]: remaining
          };
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        
        // Enregistrer le temps passé lorsqu'on quitte la question
        if (timeSpent[currentQuestion.questionId]) {
          const secondsSpent = timeSpent[currentQuestion.questionId].seconds || 0;
          if (secondsSpent > 0) {
            recordQuestionTimeData(
              localStorage.getItem('evaluationId'),
              currentQuestion.questionId,
              secondsSpent
            );
          }
        }
      };
    }
  }, [activeStep, evaluationData]);

  // Modifier le useEffect pour vérifier l'expiration du token
  useEffect(() => {
    const token = localStorage.getItem('evaluationToken');
    const evaluationId = localStorage.getItem('evaluationId');

    console.log('Initialisation avec token:', token ? 'Présent' : 'Absent', 'et evaluationId:', evaluationId);

    if (!token || !evaluationId) {
      navigate('/evaluation-login');
      return;
    }

    // Vérifier si le token est expiré
    if (isTokenExpired(token)) {
      localStorage.removeItem('evaluationToken');
      localStorage.removeItem('evaluationId');
      toast.error('Votre session a expiré. Veuillez vous reconnecter.');
      navigate('/evaluation-login');
      return;
    }

    // Vérifier périodiquement l'expiration du token
    const tokenCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem('evaluationToken');
      if (!currentToken || isTokenExpired(currentToken)) {
        localStorage.removeItem('evaluationToken');
        localStorage.removeItem('evaluationId');
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        navigate('/evaluation-login');
      }
    }, 60000); // Vérifier toutes les minutes

    const fetchEvaluation = async () => {
      try {
        console.log('Récupération des données d\'évaluation pour l\'ID:', evaluationId);
        const response = await api.get(`/evaluation/${evaluationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Données d\'évaluation reçues:', response.data);
        
        // Ajouter un log pour afficher toutes les propriétés disponibles
        console.log('Détail des propriétés disponibles:');
        for (const key in response.data) {
          console.log(`- ${key}: ${JSON.stringify(response.data[key])}`);
        }
        
        // Stocker temporairement les données d'évaluation
        let evaluationInfo = response.data;
        
        // Si les informations de poste ou département sont manquantes ou "non défini", rechercher l'employé par nom
        if (!evaluationInfo.position || evaluationInfo.position === 'Non défini' || 
            !evaluationInfo.department || evaluationInfo.department === 'Non défini') {
          
          try {
            // Extraire le nom complet de l'employé
            const employeeName = evaluationInfo.employeeName;
            
            if (employeeName) {
              console.log('Recherche de l\'utilisateur par nom:', employeeName);
              
              // Utiliser l'endpoint vemployee-details-paginated pour rechercher l'employé
              const employeeListResponse = await api.get('/User/vemployee-details-paginated', {
                params: { 
                  pageNumber: 1, 
                  pageSize: 100,  // Une taille de page suffisamment grande pour trouver l'employé
                },
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Extraire prénom et nom depuis le nom complet
              const nameParts = employeeName.split(' ');
              let firstName = '';
              let lastName = '';
              
              if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ');
              } else {
                firstName = employeeName;
              }
              
              console.log(`Recherche de l'employé avec firstName="${firstName}" et lastName="${lastName}"`);
              
              // Trouver l'employé correspondant dans la liste
              const matchingEmployee = employeeListResponse.data.employees.find(emp => 
                emp.firstName === firstName && emp.lastName === lastName);
              
              if (matchingEmployee) {
                console.log('Employé trouvé dans la liste:', matchingEmployee);
                
                // Enrichir les informations d'évaluation avec les détails de l'employé
                evaluationInfo = {
                  ...evaluationInfo,
                  userId: matchingEmployee.employeeId,
                  position: matchingEmployee.position || evaluationInfo.position,
                  department: matchingEmployee.department || evaluationInfo.department
                };
                
                console.log('Informations d\'évaluation enrichies:', evaluationInfo);
              } else {
                console.warn(`Aucun employé trouvé avec le nom "${employeeName}"`);
              }
            } else {
              console.warn('Nom de l\'employé non disponible dans les données d\'évaluation');
            }
          } catch (employeeError) {
            console.error('Erreur lors de la recherche de l\'employé par nom:', employeeError);
            console.error('Détails de l\'erreur:', employeeError.response?.data);
          }
        }
        
        // Récupérer séparément les questions sélectionnées
        try {
          const questionsResponse = await api.get(`/Evaluation/evaluation/${evaluationId}/selected-questions`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Questions sélectionnées reçues:', questionsResponse.data);
          
          // Formater les questions comme attendu par le composant
          const formattedQuestions = questionsResponse.data.map(item => ({
            questionId: item.questionId,
            text: item.questionText,
            responseType: item.responseType || 'TEXT', // Ajouter un type par défaut
            maxTimeInMinutes: item.maxTimeInMinutes || 30 // Temps par défaut
          }));
          
          // À ce stade, essayons de récupérer les détails de l'employé via un autre endpoint
          try {
            // Nous pouvons extraire l'employeeId à partir du nom complet affiché
            // Mais la meilleure approche est d'utiliser l'endpoint des questions sélectionnées 
            // qui contient plus de détails sur l'évaluation

            const employeeId = questionsResponse.data[0]?.userId || 
                              questionsResponse.data[0]?.employeeId;
            
            if (employeeId) {
              console.log('ID utilisateur trouvé dans les questions:', employeeId);
              
              const employeeDetailsResponse = await api.get(`/User/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              console.log('Détails employé reçus:', employeeDetailsResponse.data);
              
              // Enrichir les informations d'évaluation avec les détails de l'employé
              evaluationInfo = {
                ...evaluationInfo,
                userId: employeeId,
                position: employeeDetailsResponse.data.position || evaluationInfo.position,
                department: employeeDetailsResponse.data.department || evaluationInfo.department
              };
              
              console.log('Informations d\'évaluation enrichies:', evaluationInfo);
            } else {
              console.warn('Impossible de trouver l\'ID de l\'utilisateur dans les données des questions');
            }
          } catch (employeeError) {
            console.error('Erreur lors de la récupération des détails de l\'employé:', employeeError);
          }
          
          // Mettre à jour les données d'évaluation avec les questions
          setEvaluationData({
            ...evaluationInfo,
            questions: formattedQuestions
          });
          
          // Initialiser les réponses
          const initialAnswers = {};
          if (formattedQuestions.length > 0) {
            console.log('Initialisation des réponses pour', formattedQuestions.length, 'questions');
            formattedQuestions.forEach(question => {
              // Simplifié à seulement deux types : TEXT ou QCM
              if (question.responseType === 'TEXT') {
                initialAnswers[question.questionId] = '';
              } else { // Traiter tout le reste comme QCM (y compris les anciens SCORE)
                initialAnswers[question.questionId] = '';
              }
            });
            setAnswers(initialAnswers);
          } else {
            console.warn('Pas de questions disponibles pour cette évaluation');
            // Assurer que questions est au moins un tableau vide
            setEvaluationData({
              ...evaluationInfo,
              questions: [] 
            });
          }
        } catch (questionsError) {
          console.error('Erreur lors de la récupération des questions:', questionsError);
          console.error('Détails de l\'erreur:', questionsError.response?.data);
          toast.error('Impossible de récupérer les questions pour cette évaluation');
          // Assurer que evaluationData a toujours une propriété questions qui est un tableau
          setEvaluationData({
            ...evaluationInfo,
            questions: []
          });
        }
        
        // Récupérer les options des questions
        await fetchQuestionOptions(evaluationId);
        
        // Configurer la sauvegarde automatique
        setupAutoSave(evaluationId);
        
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'évaluation:', error);
        if (error.response) {
          console.error('Détails de l\'erreur:', error.response.data);
          console.error('Statut de l\'erreur:', error.response.status);
        }
        toast.error('Une erreur est survenue lors du chargement de l\'évaluation');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
      clearInterval(tokenCheckInterval);
    };
  }, [navigate]);

  // Modifier handleNext pour inclure les données de temps dans les réponses
  const handleNext = () => {
    if (evaluationData && evaluationData.questions && activeStep < evaluationData.questions.length) {
      const currentQuestion = evaluationData.questions[activeStep];
      const currentAnswer = answers[currentQuestion.questionId];

      // Validation selon le type de question
      if (currentQuestion.responseType === 'QCM') {
        if (!currentAnswer) {
          toast.warning('Veuillez sélectionner une réponse pour cette question.');
          return;
        }
      } else if (currentQuestion.responseType === 'TEXT') {
        if (!currentAnswer || currentAnswer.trim() === '') {
          toast.warning('Veuillez répondre à la question.');
        return;
        }
      }
      
      // Enregistrer le temps passé sur cette question
      const secondsSpent = timeSpent[currentQuestion.questionId]?.seconds || 0;
      if (secondsSpent > 0) {
        recordQuestionTimeData(
          localStorage.getItem('evaluationId'),
          currentQuestion.questionId,
          secondsSpent
        );
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers(prev => {
      if (type === 'QCM') {
        const optionId = parseInt(value, 10);
        return { ...prev, [questionId]: optionId };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const calculateAverageScore = () => {
    if (!evaluationData || !evaluationData.questions) {
      return 0;
    }
    
    const scores = Object.entries(answers)
      .filter(([questionId]) => {
        const questionIdInt = parseInt(questionId);
        const question = evaluationData.questions.find(q => q.questionId === questionIdInt);
        return question && question.responseType === 'QCM' && !isNaN(parseInt(answers[questionId]));
      })
      .map(([, value]) => parseInt(value));

    return scores.length ? (scores.reduce((acc, curr) => acc + curr, 0) / scores.length).toFixed(2) : 0;
  };

  const handleSubmit = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setConfirmDialogOpen(false);
    setSubmitting(true);
    setError('');
    
    const token = localStorage.getItem('evaluationToken');
    const evaluationId = localStorage.getItem('evaluationId');
    
    if (!token || !evaluationId) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      navigate('/evaluation-login');
      return;
    }
    
    try {
      // Préparer les réponses pour l'envoi
      const responses = [];
      
      if (evaluationData && evaluationData.questions && evaluationData.questions.length > 0) {
        for (const [questionId, value] of Object.entries(answers)) {
          const question = evaluationData.questions.find(q => q.questionId === parseInt(questionId));
          if (question) {
            const responseValue = question.responseType === 'QCM' 
              ? value.toString()
              : value;
            
            // S'assurer que timeSpent est correctement extrait et formaté comme un nombre
            const timeInSeconds = typeof timeSpent[questionId] === 'object' 
              ? (timeSpent[questionId]?.seconds || 0) 
              : (timeSpent[questionId] || 0);
            
            // Vérifier que les dates sont valides pour SQL Server (après 1753-01-01)
            const currentTime = new Date();
            
            responses.push({
              questionId: parseInt(questionId),
              responseType: question.responseType,
              responseValue: responseValue,
              timeSpent: timeInSeconds,
              startTime: currentTime.toISOString(),
              endTime: currentTime.toISOString()
            });
          }
        }
      }
      
      const averageScore = calculateAverageScore();
      const payload = {
        responses: responses,
        overallFeedback: overallFeedback,
        averageScore: averageScore,
        completionDate: new Date().toISOString()
      };

      console.log("Payload being sent:", JSON.stringify(payload));

      const response = await api.post(`/evaluation/${evaluationId}/submit`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Évaluation soumise avec succès!');
        localStorage.removeItem('evaluationToken');
        localStorage.removeItem('evaluationId');
        navigate('/EvaluationConfirmation');
      } else {
        setError('Erreur lors de la soumission de l\'évaluation. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);

      if (err.response) {
        console.error('Server response:', err.response.data);
        
        // Affichage plus détaillé des erreurs de validation
        if (err.response.status === 400 && err.response.data.errors) {
          // Récupérer et formater les erreurs de validation
          const validationErrors = Object.entries(err.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          
          setError(`Erreurs de validation:\n${validationErrors}`);
        } else {
        setError(`Erreur du serveur: ${JSON.stringify(err.response.data)}`);
        }
      } else {
      setError('Une erreur est survenue lors de la soumission.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    if (!question) {
      console.error('Tentative de rendu d\'une question undefined');
      return null;
    }
    
    const currentAnswer = answers[question.questionId] || '';

    // Simplifier le switch pour ne gérer que TEXT et QCM
    switch (question.responseType) {
      case 'QCM':
        return (
          <RadioGroup
            value={currentAnswer ? currentAnswer.toString() : ''}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value, 'QCM')}
          >
            {questionOptions && questionOptions[question.questionId] ? 
              questionOptions[question.questionId].map((option) => (
                <FormControlLabel
                  key={option.optionId}
                  value={option.optionId.toString()}
                  control={<Radio />}
                  label={option.optionText}
                />
              )) : <Typography color="error">Aucune option disponible pour cette question</Typography>
            }
          </RadioGroup>
        );
      case 'TEXT':
      default: // Par défaut, afficher un champ texte
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value, 'TEXT')}
            placeholder="Veuillez répondre à la question..."
          />
        );
    }
  };

  // Modifier le composant TimeRemainingDisplay pour un affichage plus visuel
  const TimeRemainingDisplay = () => {
    if (!evaluationData || !evaluationData.questions || !evaluationData.questions[activeStep]) {
      return null;
    }

    const currentQuestion = evaluationData.questions[activeStep];
    if (!currentQuestion) {
      return null;
    }

    const remaining = questionTimeRemaining[currentQuestion.questionId];
    if (remaining === undefined) {
      return null;
    }
    
    // Calculer le pourcentage de temps restant pour la couleur
    const maxTime = currentQuestion.maxTimeInMinutes * 60 || 15 * 60;
    const percentRemaining = (remaining / maxTime) * 100;
    
    // Choisir la couleur en fonction du temps restant
    let timeColor;
    if (percentRemaining > 50) {
      timeColor = '#4caf50'; // Vert quand il reste plus de 50% du temps
    } else if (percentRemaining > 20) {
      timeColor = '#ff9800'; // Orange quand il reste entre 20% et 50% du temps
    } else {
      timeColor = '#f44336'; // Rouge quand il reste moins de 20% du temps
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaClock style={{ color: timeColor }} />
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: timeColor }}>
            {formatTimeRemaining(remaining)}
          </Typography>
        </Box>
        {/* Barre de progression pour visualiser le temps restant */}
        <Box sx={{ width: '100%', mt: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={percentRemaining} 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                backgroundColor: timeColor
              }
            }} 
          />
        </Box>
      </Box>
    );
  };

  // Fonction pour formater le temps restant en format lisible
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Évaluation en Cours
          </Typography>
          <TimeRemainingDisplay />
          <Button color="inherit" onClick={handleLogout} startIcon={<FaSignOutAlt />}>
            Déconnexion
          </Button>
        </Toolbar>
      </AppBar>

      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        {/* Barre de progression */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progression
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {evaluationData && evaluationData.questions ? 
                `${activeStep + 1}/${evaluationData.questions.length} questions` : 
                "Chargement..."}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: '#4caf50',
              }
            }} 
          />
        </Box>

        {/* Informations de l'évaluation */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#3f51b5', fontWeight: 'medium' }}>
            {evaluationData.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {evaluationData.description}
        </Typography>
          
          <Card variant="outlined" sx={{ backgroundColor: '#f5f5f5', mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FaIdCard size={20} style={{ marginRight: '8px', color: '#3f51b5' }} />
                    <Typography variant="body1"><strong>Nom:</strong> {evaluationData.employeeName}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FaBriefcase size={20} style={{ marginRight: '8px', color: '#3f51b5' }} />
                    <Typography variant="body1"><strong>Poste:</strong> {evaluationData.position}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FaBuilding size={20} style={{ marginRight: '8px', color: '#3f51b5' }} />
                    <Typography variant="body1"><strong>Département:</strong> {evaluationData.department}</Typography>
                  </Box>
              </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Contenu principal: affichage des questions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
          {evaluationData && evaluationData.questions && activeStep < evaluationData.questions.length ? (
            <Card variant="outlined" sx={{ mb: 2, position: 'relative', overflow: 'visible' }}>
              <CardContent>
                {/* Numéro de question et temps restant */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: -15, 
                  left: 20, 
                  backgroundColor: '#3f51b5', 
                  color: 'white',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}>
                  {activeStep + 1}
                </Box>
                
                <Box sx={{ mt: 1.5, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#333' }}>
                    {evaluationData.questions[activeStep].text}
                  </Typography>
                </Box>
                
                {renderQuestionInput(evaluationData.questions[activeStep])}
              </CardContent>
            </Card>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Commentaires finaux
                </Typography>
              <TextField
                  label="Avez-vous des commentaires supplémentaires ?"
                variant="outlined"
                fullWidth
                multiline
                  rows={6}
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
              />
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Pagination mini (indicateur visuel des questions) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
          {evaluationData && evaluationData.questions && evaluationData.questions.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: index === activeStep ? '#3f51b5' : 
                                   (answers[evaluationData.questions[index].questionId] ? '#4caf50' : '#e0e0e0'),
                margin: '0 4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                // Permettre la navigation directe uniquement vers des questions déjà répondues ou adjacentes
                if (index === activeStep + 1 || 
                    index === activeStep - 1 || 
                    answers[evaluationData.questions[index].questionId]) {
                  setActiveStep(index);
                }
              }}
            />
          ))}
        </Box>

        {/* Boutons de navigation */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 3,
          borderTop: '1px solid #e0e0e0',
          paddingTop: 2
        }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<FaArrowLeft />}
            disabled={activeStep === 0}
            sx={{ borderRadius: 2 }}
          >
            Précédent
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={activeStep < evaluationData.questions.length - 1 ? handleNext : handleSubmit}
            disabled={submitting}
            endIcon={submitting ? <FaSpinner className="spinner" /> : 
                    activeStep < evaluationData.questions.length - 1 ? <FaArrowRight /> : <FaPaperPlane />}
            sx={{ 
              borderRadius: 2,
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#2e7d32',
              },
            }}
          >
            {activeStep < evaluationData.questions.length - 1 ? 'Suivant' : 'Soumettre'}
          </Button>
        </Box>
      </Paper>

      {/* Modal de confirmation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaExclamationTriangle style={{ color: '#FF9800' }} /> 
          Confirmation de soumission
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Typography paragraph>
              Êtes-vous sûr de vouloir soumettre définitivement cette évaluation ?
            </Typography>
            <Typography paragraph sx={{ fontWeight: 'bold' }}>
              Attention : Cette action est irréversible. Après soumission, vous ne pourrez plus modifier vos réponses.
            </Typography>
            <Typography>
              Assurez-vous d&apos;avoir bien vérifié toutes vos réponses avant de confirmer.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            color="inherit" 
            variant="outlined" 
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmedSubmit} 
            color="primary" 
            variant="contained" 
            autoFocus
            disabled={submitting}
            sx={{ 
              borderRadius: 2, 
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#2e7d32',
              },
            }}
            startIcon={submitting ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
          >
            {submitting ? 'Envoi en cours...' : 'Confirmer la soumission'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EvaluationPage;