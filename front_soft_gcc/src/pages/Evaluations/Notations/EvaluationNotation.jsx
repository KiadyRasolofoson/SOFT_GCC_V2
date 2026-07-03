import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../helpers/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Template from '../../Template';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import '../../../assets/css/Evaluations/notationModal.css';
import '../../../assets/css/Evaluations/Questions.css';
import '../../../assets/css/Evaluations/Steps.css';

const EvaluationNotation = () => {
  const { employeeId, evaluationId } = useParams();
  const navigate = useNavigate();
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEvaluationType, setSelectedEvaluationType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [remarks, setRemarks] = useState({
    strengths: '',
    weaknesses: '',
    generalEvaluation: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour la validation de l'évaluation
  const [validationData, setValidationData] = useState({
    serviceApproved: false, // Représente la validation technique par l'évaluateur expert
    dgApproved: false,      // Représente la prise de connaissance hiérarchique
    serviceDate: '',        // Date de validation technique
    dgDate: ''              // Date de prise de connaissance
  });

  // Ajout d'un drapeau pour tracer si une génération PDF est explicitement demandée par l'utilisateur
  const [userRequestedPdf, setUserRequestedPdf] = useState(false);
  
  // Référence pour éviter les appels multiples du useEffect
  const navigationTriggered = useRef(false);

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les détails de l'employé si employeeId est fourni
        if (employeeId) {
          try {
            // Essayer d'abord avec l'API vemployee-details-paginated qui contient plus d'informations
            const employeeListResponse = await api.get('/User/vemployee-details-paginated', {
              params: { pageNumber: 1, pageSize: 100 } // Utiliser une taille suffisamment grande
            });
            
            // Chercher l'employé dans la liste par son ID
            const foundEmployee = employeeListResponse.data.employees?.find(emp => emp.employeeId === parseInt(employeeId));
            console.log('Employé trouvé dans la liste:', foundEmployee);
            
            if (foundEmployee) {
              setSelectedEmployee({
                firstName: foundEmployee.firstName || '',
                lastName: foundEmployee.lastName || '',
                position: foundEmployee.position || '',
                department: foundEmployee.department || '',
                evaluationId: foundEmployee.evaluationId || null
              });
            } else {
              // Si non trouvé dans la liste, essayer l'API User directe
              const employeeResponse = await api.get(`/User/${employeeId}`);
              console.log('Données employé reçues via API directe:', employeeResponse.data);
              
              setSelectedEmployee({
                firstName: employeeResponse.data.firstName || '',
                lastName: employeeResponse.data.lastName || '',
                position: employeeResponse.data.position || '',
                department: employeeResponse.data.department || '',
                evaluationId: employeeResponse.data.evaluationId || null
              });
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données employé:', error);
            setError("Impossible de charger les données de l'employé");
          }
        }
        // Sinon, essayer de récupérer l'évaluation directement
        else if (evaluationId) {
          try {
            // D'abord essayer de récupérer les informations complètes via l'API vemployee-details-paginated
            const employeeListResponse = await api.get('/User/vemployee-details-paginated', {
              params: { pageNumber: 1, pageSize: 100 }
            });
            
            // Chercher l'évaluation dans la liste par son ID
            const foundEvaluation = employeeListResponse.data.employees?.find(emp => emp.evaluationId === parseInt(evaluationId));
            console.log('Évaluation trouvée dans la liste:', foundEvaluation);
            
            if (foundEvaluation) {
              setSelectedEmployee({
                firstName: foundEvaluation.firstName || '',
                lastName: foundEvaluation.lastName || '',
                position: foundEvaluation.position || '',
                department: foundEvaluation.department || '',
                evaluationId: parseInt(evaluationId)
              });
            } else {
              // Si non trouvée, essayer l'API Evaluation directe
              const evaluationResponse = await api.get(`/Evaluation/${evaluationId}`);
              console.log('Données évaluation reçues via API directe:', evaluationResponse.data);
              
              if (evaluationResponse.data) {
                setSelectedEmployee({
                  firstName: evaluationResponse.data.firstName || '',
                  lastName: evaluationResponse.data.lastName || '',
                  position: evaluationResponse.data.position || '',
                  department: evaluationResponse.data.department || '',
                  evaluationId: parseInt(evaluationId)
                });
                
                // Si les informations sont incomplètes, essayer de récupérer via l'userId
                if (!evaluationResponse.data.firstName || !evaluationResponse.data.position || !evaluationResponse.data.department) {
                  const employeeId = evaluationResponse.data.userId || evaluationResponse.data.employeeId;
                  if (employeeId) {
                    const employeeDetails = await api.get(`/User/${employeeId}`);
                    console.log('Données complémentaires employé:', employeeDetails.data);
                    
                    setSelectedEmployee({
                      firstName: employeeDetails.data.firstName || '',
                      lastName: employeeDetails.data.lastName || '',
                      position: employeeDetails.data.position || '',
                      department: employeeDetails.data.department || '',
                      evaluationId: parseInt(evaluationId)
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données d\'évaluation:', error);
            setError("Impossible de charger les données de l'évaluation");
          }
        }
        else {
          throw new Error("ID d&apos;employé ou d&apos;évaluation non fourni");
        }

        // Récupérer les types d'évaluation
        try {
          const evalTypesResponse = await api.get('/Evaluation/types');
          if (evalTypesResponse.data && evalTypesResponse.data.length > 0) {
            setSelectedEvaluationType(evalTypesResponse.data[0]);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des types d\'évaluation:', error);
        }

        // Récupérer les questions pour cette évaluation si evaluationId est disponible
        if (evaluationId) {
          try {
            const questionsResponse = await api.get(`/Evaluation/evaluation/${evaluationId}/selected-questions`);
            // Les questions viennent maintenant avec les réponses formatées correctement (texte de l'option pour QCM)
            const formattedQuestions = questionsResponse.data.map(item => ({
              questionId: item.questionId,
              text: item.questionText,
              responseType: item.responseType,
              responseValue: item.responseValue,
              isCorrect: item.isCorrect
            }));
            
            setQuestions(formattedQuestions);
            
            // Initialiser les ratings avec les valeurs existantes si disponibles
            const initialRatings = {};
            formattedQuestions.forEach(question => {
              if (question.responseValue) {
                initialRatings[question.questionId] = question.responseValue;
              }
            });
            
            if (Object.keys(initialRatings).length > 0) {
              setRatings(initialRatings);
            }
          } catch (questionsError) {
            console.error("Erreur lors du chargement des questions:", questionsError);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données. Veuillez réessayer.");
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, evaluationId]);
  
  // Gestion de la génération du PDF
  useEffect(() => {
    // Ne générer le PDF que si la validation est réussie 
    if (validationSuccess && userRequestedPdf && !navigationTriggered.current) {
      console.log("État de validation atteint, démarrage de la séquence de génération PDF");
      
      // Marquer comme déjà navigué pour éviter les redirections multiples
      navigationTriggered.current = true;
      
      // Générer le PDF immédiatement, une seule fois
      console.log("Génération du PDF en cours...");
      const pdfGenerated = generatePDFAfterValidation();
      console.log("Résultat de la génération du PDF:", pdfGenerated);
      
      // Redirection après un délai pour laisser le temps au téléchargement de démarrer
      const redirectionTimeout = setTimeout(() => {
        console.log("Redirection après tentative de génération PDF");
        navigate('/evaluations/salary-list');
      }, 3000); // Augmenter le délai à 3 secondes
      
      return () => clearTimeout(redirectionTimeout);
    }
  }, [validationSuccess, userRequestedPdf, navigate]); // Ne pas inclure generatePDFAfterValidation dans les dépendances
  
  // Réinitialiser l'état de génération PDF si l'étape change ou si le composant est démonté
  useEffect(() => {
    // Réinitialiser uniquement si nous ne sommes pas à l'étape 3
    if (currentStep !== 3) {
      setUserRequestedPdf(false);
      navigationTriggered.current = false;
    }
    
    // Nettoyage lors du démontage du composant
    return () => {
      navigationTriggered.current = false;
    };
  }, [currentStep]);
  
  // Fonction intégrée pour générer et télécharger un PDF
  const downloadPDF = (employeeData, ratings, average, validationData) => {
    try {
      // Créer un document PDF
      const doc = new jsPDF();
      
      // Définir les coordonnées de base
      let y = 20;
      
      // Titre
      doc.setFontSize(16);
      doc.text('Rapport d\'évaluation des compétences', 105, y, { align: 'center' });
      y += 10;
      
      // Informations sur l'employé
      doc.setFontSize(12);
      doc.text(`Employé: ${employeeData.firstName} ${employeeData.lastName}`, 20, y);
      y += 7;
      doc.text(`Poste: ${employeeData.position}`, 20, y);
      y += 7;
      doc.text(`Département: ${employeeData.department}`, 20, y);
      y += 7;
      doc.text(`Date d'évaluation: ${new Date().toLocaleDateString()}`, 20, y);
      y += 15;
      
      // Note moyenne
      doc.setFontSize(14);
      doc.text(`Note moyenne: ${average}/5`, 20, y);
      y += 15;
      
      // Tableau des notations
      const headers = [['Question', 'Note']];
      const data = Object.entries(ratings).map(([questionId, note]) => [
        `Question #${questionId}`, `${note}/5`
      ]);
      
      doc.autoTable({
        head: headers,
        body: data,
        startY: y,
      });
      
      y = doc.autoTable.previous.finalY + 15;
      
      // Validation
      doc.setFontSize(14);
      doc.text('Validation', 20, y);
      y += 7;
      
      doc.setFontSize(12);
      doc.text(`Chef de service: ${validationData.serviceApproved ? 'Approuvé' : 'Non approuvé'}`, 20, y);
      if (validationData.serviceApproved && validationData.serviceDate) {
        doc.text(`(${validationData.serviceDate})`, 100, y);
      }
      y += 7;
      
      doc.text(`Direction générale: ${validationData.dgApproved ? 'Approuvé' : 'Non approuvé'}`, 20, y);
      if (validationData.dgApproved && validationData.dgDate) {
        doc.text(`(${validationData.dgDate})`, 100, y);
      }
      
      // Générer le nom de fichier
      const fileName = `evaluation_${evaluationId || selectedEmployee?.evaluationId}_${new Date().getTime()}.pdf`;
      
      // Télécharger
      console.log("Téléchargement du PDF:", fileName);
      doc.save(fileName);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      return false;
    }
  };
  
  // Fonction de génération de PDF explicite, appelée après validation
  const generatePDFAfterValidation = () => {
    console.log("*** Tentative de génération du PDF après validation ***");
    
    // Éviter les appels multiples avec un drapeau local
    if (navigationTriggered.current) {
      console.log("*** Génération de PDF déjà en cours, ignorer l'appel ***");
      return true;
    }
    
    // Générer le PDF directement ici
    try {
      console.log("Génération directe du PDF");
      
      // Préparation des données de l'employé
      const employeeDataForPDF = {
        firstName: selectedEmployee?.firstName || 'Employé',
        lastName: selectedEmployee?.lastName || 'Non identifié',
        department: selectedEmployee?.department || 'Département inconnu',
        position: selectedEmployee?.position || 'Poste inconnu'
      };
      
      // Calcul des statistiques
      const averageRating = calculateAverage();
      
      console.log("Données préparées pour la génération PDF:", {
        employeeData: employeeDataForPDF,
        ratingsCount: Object.keys(ratings).length,
        average: averageRating
      });
      
      // Télécharger le PDF directement avec notre implémentation intégrée
      return downloadPDF(employeeDataForPDF, ratings, averageRating, validationData);
      
    } catch (error) {
      console.error("Erreur lors de la génération directe du PDF:", error);
      return false;
    }
  };
  
  const handleCancel = () => {
    if (isSaved || window.confirm('Êtes-vous sûr de vouloir annuler? Les modifications non enregistrées seront perdues.')) {
      navigate('/evaluations/salary-list');
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 3) {
      // À l'étape 3, on soumet les résultats et on valide si la soumission réussit
      try {
        // Désactiver le bouton pendant le traitement (via loading state)
        setLoading(true);
        
        // Marquer que l'utilisateur a demandé le PDF (clic sur "Valider et Générer PDF")
        setUserRequestedPdf(true);
        console.log("Utilisateur a demandé la génération du PDF");

        // Essayer de sauvegarder les résultats
        console.log("Sauvegarde des résultats de l'évaluation...");
        const saveSuccessful = await saveEvaluationResults();
        if (!saveSuccessful) {
          console.error("Échec lors de la sauvegarde des résultats");
          setUserRequestedPdf(false); // Réinitialiser si échec
          setLoading(false);
          return; // Arrêter si la sauvegarde échoue
        }
        console.log("Résultats sauvegardés avec succès");

        // Ensuite essayer de valider l'évaluation
        console.log("Validation de l'évaluation...");
        const validationSuccessful = await validateEvaluation();
        if (!validationSuccessful) {
          console.error("Échec lors de la validation de l'évaluation");
          setUserRequestedPdf(false); // Réinitialiser si échec
          setLoading(false);
          return; // Arrêter si la validation échoue
        }
        
        console.log("Validation réussie, génération directe du PDF...");
        
        // Générer directement le PDF après validation réussie
        generatePDFAfterValidation();
        
        // Indiquer le succès pour l'interface utilisateur
        setValidationSuccess(true);
        
        // Planifier la redirection après le téléchargement
        setTimeout(() => {
          navigate('/evaluations/salary-list');
        }, 3000);
        
      } catch (error) {
        console.error("Erreur pendant le processus de validation:", error);
        setError("Une erreur est survenue lors de la validation. Veuillez réessayer.");
        setUserRequestedPdf(false); // Réinitialiser en cas d'erreur
        setLoading(false);
      }
    } else {
      // Avancer à l'étape suivante sans sauvegarder
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const allQuestionsRated = () => questions.every(q => ratings[q.questionId] !== undefined);

  const calculateAverage = () => {
    const scores = Object.values(ratings);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
  };

  const handleSaveRemarks = (newRemarks) => setRemarks(newRemarks);

  const saveEvaluationResults = async () => {
    if (!selectedEmployee || !selectedEvaluationType || !ratings) {
      console.error('Données incomplètes pour sauvegarder l\'évaluation.');
      return false;
    }

    const average = calculateAverage();
    const data = {
      evaluationId: evaluationId || selectedEmployee.evaluationId,
      ratings,
      overallScore: average,
      strengths: remarks.strengths,
      weaknesses: remarks.weaknesses,
      generalEvaluation: remarks.generalEvaluation,
    };

    try {
      const response = await api.post(
        '/Evaluation/save-evaluation-results',
        data
      );
      console.log('Résultats soumis avec succès :', response.data);
      setIsSaved(true);
      return true;
    } catch (error) {
      console.error('Erreur lors de la soumission des résultats :', error.response?.data || error.message);
      alert('Erreur lors de la soumission des résultats. Veuillez réessayer.');
      return false;
    }
  };

  const validateEvaluation = async () => {
    // Vérifier si des dates sont manquantes quand les validations sont activées
    const errors = [];
    
    if (validationData.serviceApproved && !validationData.serviceDate) {
      errors.push("Date de validation du chef de service manquante");
    }
    
    if (validationData.dgApproved && !validationData.dgDate) {
      errors.push("Date de validation de la direction générale manquante");
    }
    
    // S'il y a des erreurs, on les affiche et on arrête la validation
    if (errors.length > 0) {
      setError("Erreur de validation : " + errors.join(", "));
      return false;
    }
    
    // Préparation des dates au format ISO ou null
    const serviceDate = validationData.serviceApproved && validationData.serviceDate 
      ? new Date(validationData.serviceDate).toISOString() 
      : null;
    
    const dgDate = validationData.dgApproved && validationData.dgDate 
      ? new Date(validationData.dgDate).toISOString() 
      : null;
    
    // Construction du DTO comme attendu par le backend
    const payload = {
      EvaluationId: parseInt(evaluationId || selectedEmployee.evaluationId),
      IsServiceApproved: validationData.serviceApproved,
      IsDgApproved: validationData.dgApproved,
      ServiceApprovalDate: serviceDate,
      DgApprovalDate: dgDate
    };

    console.log('Payload envoyé pour validation:', payload);

    try {
      await api.post('/Evaluation/validate-evaluation', payload);
      console.log("Validation réussie côté serveur");
      setValidationSuccess(true);
      return true;
    } catch (err) {
      console.error('Error validating evaluation:', err);
      console.error('Response data:', err.response?.data);
      setError('Erreur lors de la validation de l\'évaluation. ' + 
              (err.response?.data?.message || err.message || ''));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            evaluationId={parseInt(evaluationId || selectedEmployee?.evaluationId) || 0}
            setRatings={setRatings}
            ratings={ratings}
          />
        );
      case 2:
        return (
          <Step2
            ratings={ratings}
            remarks={remarks}
            setRemarks={setRemarks}
            onSaveRemarks={handleSaveRemarks}
          />
        );
      case 3:
        return (
          <Step3
            ratings={ratings}
            average={calculateAverage()}
            evaluationId={parseInt(evaluationId || selectedEmployee?.evaluationId) || 0}
            validationData={validationData}
            onValidationChange={(field, value) =>
              setValidationData(prev => ({ ...prev, [field]: value }))
            }
          />
        );
      default:
        return null;
    }
  };

  if (loading && !validationSuccess) {
    return (
      <Template>
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
          <p>Chargement des données de l&apos;évaluation...</p>
        </div>
      </Template>
    );
  }

  if (error) {
    return (
      <Template>
        <div className="error-container">
          <div className="alert alert-danger">
            <h4>Une erreur est survenue</h4>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/evaluations/salary-list')}
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </Template>
    );
  }

  return (
    <Template>
      <div className="evaluation-notation-page">
        {validationSuccess ? (
          <div className="validation-success-container">
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h4>Validation réussie !</h4>
            <p>La notation a été effectuée avec succès.</p>
            <p>Génération du PDF en cours...</p>
          </div>
        ) : (
          <>
            <div className="header-section">
              <h2>
                Notation de l&apos;évaluation - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </h2>
              <div className="employee-info">
                <p><strong>Poste :</strong> {selectedEmployee?.position || 'Non défini'}</p>
                <p><strong>Département :</strong> {selectedEmployee?.department || 'Non défini'}</p>
              </div>
            </div>

            <div className="steps-navigation">
              <div className={`step ${currentStep === 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
                <span className="step-number">1</span>
                <span className="step-label">Notation</span>
              </div>
              <div 
                className={`step ${currentStep === 2 ? 'active' : ''} ${allQuestionsRated() ? '' : 'disabled'}`} 
                onClick={() => allQuestionsRated() ? setCurrentStep(2) : null}
              >
                <span className="step-number">2</span>
                <span className="step-label">Commentaires</span>
              </div>
              <div 
                className={`step ${currentStep === 3 ? 'active' : ''} ${isSaved ? '' : 'disabled'}`}
                onClick={() => isSaved ? setCurrentStep(3) : null}
              >
                <span className="step-number">3</span>
                <span className="step-label">Validation</span>
              </div>
            </div>

            <div className="step-content-container">
              {renderStepContent()}
            </div>

            <div className="navigation-buttons">
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Annuler
              </button>
              
              {currentStep > 1 && (
                <button 
                  className="btn btn-light"
                  onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                  disabled={loading}
                >
                  Précédent
                </button>
              )}
              
              <button 
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={((!allQuestionsRated() && currentStep === 1) || loading)}
              >
                {loading ? 
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...</> : 
                  (currentStep === 3 ? 'Valider et Générer PDF' : 'Suivant')}
              </button>
            </div>
          </>
        )}
      </div>
    </Template>
  );
};

export default EvaluationNotation; 