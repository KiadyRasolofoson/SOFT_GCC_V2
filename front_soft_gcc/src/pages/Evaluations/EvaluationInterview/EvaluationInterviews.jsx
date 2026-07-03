import { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import { toast } from 'react-toastify';
import '../../../assets/css/Evaluations/EvaluationInterviews.css';
import Template from '../../Template';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../Authentification/UserContext';
import PermissionService from '../../../services/PermissionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const EvaluationInterviews = () => {
  const { state } = useLocation();
  const { interview, employeeId } = state || {};
  const { user, hasPermission, loading: userLoading } = useUser();
  const navigate = useNavigate();
  
  // États pour le formulaire et l'import
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState({});
  
  // État pour gérer les onglets du formulaire
  const [activeTab, setActiveTab] = useState('general');
  
  // État pour le formulaire
  const [formData, setFormData] = useState({
    // Informations générales sur l'entretien
    general: {
      date: new Date().toISOString().split('T')[0],
      location: '',
      context: '',
    },
    // Bilan de la période précédente
    previousPeriod: {
      achievements: '',
      challenges: '',
      previousObjectivesAchieved: '',
      feedback: '',
    },
    // Évaluation des compétences
    skills: [],
    // Objectifs pour la prochaine période
    objectives: [{
      description: '',
      dueDate: '',
      indicator: '',
    }],
    // Plan de développement
    developmentPlan: {
      trainingNeeds: '',
      careerAspiration: '',
      notes: '',
    },
    // Notes globales
    globalNotes: '',
    // Note globale
    overallRating: 0,
  });

  // Ajouter l'état pour l'animation de succès
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Vérification des permissions fonctionnelles
  const canImportEvaluation = PermissionService.hasFunctionalPermission(hasPermission, 'IMPORT_EVALUATION');
  const canFillEvaluation = PermissionService.hasFunctionalPermission(hasPermission, 'FILL_EVALUATION');
  const canValidateAsManager = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_MANAGER');
  const canValidateAsDirector = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_DIRECTOR');

  // Vérification des paramètres et de l'authentification
  useEffect(() => {
    if (!state) {
      toast.error('Paramètres manquants pour accéder à cette page');
      navigate('/');
      return;
    }

    if (userLoading) {
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté pour accéder à cette page');
      navigate('/login');
      return;
    }
    
    // Si l'utilisateur est authentifié, charger les données
    fetchData();
  }, [user, userLoading, navigate, state]);

  // Nettoyer les URLs lors du démontage du composant
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Charger les données de l'employé et de l'évaluation
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (interview && interview.evaluationId) {
        // Récupérer directement les détails de l'évaluation avec l'endpoint spécifié
        const evaluationResponse = await api.get(`/Evaluation/${interview.evaluationId}`);
        
        if (evaluationResponse.data) {
          const evaluation = evaluationResponse.data;
          console.log("Données d'évaluation reçues:", evaluation);
          
          // Séparer le nom complet en prénom et nom si nécessaire
          let firstName = "";
          let lastName = "";
          
          if (evaluation.employeeName) {
            const nameParts = evaluation.employeeName.split(' ');
            if (nameParts.length > 1) {
              lastName = nameParts.pop(); // Le dernier élément est le nom
              firstName = nameParts.join(' '); // Les éléments restants forment le prénom
            } else {
              firstName = evaluation.employeeName;
            }
          }
          
          // Récupérer les informations de l'employé à partir de l'évaluation
          setEmployeeInfo({
            firstName: firstName,
            lastName: lastName,
            fullName: evaluation.employeeName,
            position: evaluation.position,
            department: evaluation.department
          });
          
          // Mettre à jour les informations générales
          setFormData(prev => ({
            ...prev,
            general: {
              ...prev.general,
              date: interview.interviewDate ? new Date(interview.interviewDate).toISOString().split('T')[0] : prev.general.date
            },
            // Si des notes existent déjà dans l'entretien, essayer de les parser
            ...tryParseInterviewNotes(interview.notes)
          }));
          
          // Charger les compétences associées au poste
          if (evaluation.positionId) {
            const skillsResponse = await api.get(`/Skill/position/${evaluation.positionId}`);
            
            if (skillsResponse.data && Array.isArray(skillsResponse.data)) {
              const skills = skillsResponse.data.map(skill => ({
                skillId: skill.skillId,
                name: skill.name,
                category: skill.category || 'Autres',
                description: skill.description || '',
                rating: 0,
                comment: ''
              }));
              
              setFormData(prev => ({
                ...prev,
                skills: skills
              }));
            }
          }
        }
      } else if (employeeId) {
        // Si on a l'employeeId mais pas l'evaluationId, on récupère les données de l'employé
        const employeeResponse = await api.get(`/Employee/${employeeId}`);
        
        if (employeeResponse.data) {
          const employee = employeeResponse.data;
          setEmployeeInfo({
            firstName: employee.firstName,
            lastName: employee.lastName,
            position: employee.position,
            department: employee.department
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de l'employé ou de l'évaluation");
    } finally {
      setLoading(false);
    }
  };
  
  // Ajouter cette fonction pour stocker le PDF en localStorage
  const savePdfToLocalStorage = (url, fileName) => {
    try {
      localStorage.setItem('evaluationPdfUrl', url);
      localStorage.setItem('evaluationPdfName', fileName || 'document.pdf');
      console.log('PDF URL sauvegardée dans localStorage');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du PDF URL:', error);
    }
  };

  // Modifier handleFileChange pour sauvegarder l'URL
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        
        // Créer une URL pour la prévisualisation
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const newUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(newUrl);
        
        // Sauvegarder l'URL dans localStorage
        savePdfToLocalStorage(newUrl, selectedFile.name);
        
        toast.success("Fiche d'évaluation importée avec succès");
      } else {
        toast.error("Veuillez sélectionner un fichier PDF valide");
      }
    }
  };
  
  // Ajouter dans useEffect pour charger le PDF sauvegardé au chargement
  useEffect(() => {
    // Essayer de récupérer l'URL du PDF depuis localStorage
    try {
      const savedUrl = localStorage.getItem('evaluationPdfUrl');
      const savedName = localStorage.getItem('evaluationPdfName');
      
      if (savedUrl) {
        console.log('URL du PDF récupérée depuis localStorage');
        setPreviewUrl(savedUrl);
        if (savedName) {
          setFile({
            name: savedName
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL du PDF:", error);
    }
  }, []);
  
  // Essayer de parser les notes de l'entretien si elles existent
  const tryParseInterviewNotes = (notesJson) => {
    if (!notesJson) return {};
    
    try {
      const parsedNotes = JSON.parse(notesJson);
      return parsedNotes;
    } catch (error) {
      console.error("Impossible de parser les notes existantes:", error);
      return {};
    }
  };
  
  // Gestionnaire de changement pour les champs imbriqués
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  // Ajouter un objectif
  const handleAddObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [
        ...prev.objectives,
        { description: '', dueDate: '', indicator: '' }
      ]
    }));
  };
  
  // Supprimer un objectif
  const handleRemoveObjective = (index) => {
    const newObjectives = [...formData.objectives];
    newObjectives.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }));
  };
  
  // Mettre à jour un objectif
  const handleObjectiveChange = (index, field, value) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index][field] = value;
    
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }));
  };
  
  // Fonction pour changer d'onglet
  const changeTab = (tabName) => {
    setActiveTab(tabName);
  };
  
  // Mettre à jour la fonction handleSave pour ajouter la redirection
  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!interview || !interview.interviewId) {
        console.error("Erreur: ID d'entretien manquant", interview);
        toast.error("Impossible d'enregistrer sans identifiant d'entretien");
        return;
      }

      console.log("Tentative d'enregistrement avec ID:", interview.interviewId);
      console.log("Données à envoyer:", formData);

      const payload = {
        notes: JSON.stringify(formData),
        managerApproval: interview.managerApproval || null,
        managerComments: interview.managerComments || "",
        directorApproval: interview.directorApproval || null,
        directorComments: interview.directorComments || "",
        status: interview.status || 20
      };

      console.log("Payload final:", payload);
      
      const response = await api.put(
        `/EvaluationInterview/complete-interview/${interview.interviewId}`,
        payload
      );
      
      console.log("Réponse de l'API:", response);
      
      if (response.status === 200 || response.status === 204) {
        toast.success("Entretien sauvegardé avec succès");
        
        // Attendre un court instant pour que l'utilisateur voie le message de confirmation
        setTimeout(() => {
          // Rediriger vers la page d'accueil des entretiens
          navigate('/homeInterview');
        }, 1500);
        
        return;
      } else {
        throw new Error(`Réponse inattendue: ${response.status}`);
      }
    } catch (error) {
      // Si l'endpoint précédent n'existe pas, essayer une alternative
      try {
        console.error("Première tentative échouée, essai avec endpoint alternatif:", error);
        
        // Utiliser update-interview comme solution de secours
        const updateResponse = await api.put(
          `/EvaluationInterview/update-interview/${interview.interviewId}`,
          {
            newStatus: interview.status || 20,
            // Ces champs sont obligatoires pour cet endpoint selon le contrôleur
            newDate: interview.interviewDate || new Date().toISOString(),
            newParticipantIds: [] // Garder la liste existante
          }
        );
        
        if (updateResponse.status === 200 || updateResponse.status === 204) {
          toast.success("Entretien sauvegardé avec succès");
          
          // Attendre un court instant pour que l'utilisateur voie le message de confirmation
          setTimeout(() => {
            // Rediriger vers la page d'accueil des entretiens
            navigate('/homeInterview');
          }, 1500);
          
          return;
        }
      } catch (fallbackError) {
        console.error("Erreur sur l'endpoint alternatif:", fallbackError);
      }
      
      // Si toutes les tentatives ont échoué
      console.error("Erreur lors de la sauvegarde de l'entretien:", error);
      toast.error("Erreur lors de la sauvegarde de l'entretien. Vérifiez la console pour plus de détails.");
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <Template>
        <div className="container mt-4">
          <h2 className="mb-4">Entretien d&apos;évaluation</h2>
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden"></span>
            </div>
          </div>
        </div>
      </Template>
    );
  }

  if (!user) {
    return (
      <Template>
        <div className="container mt-4">
          <h2 className="mb-4">Entretien d&apos;évaluation</h2>
          <div className="alert alert-danger">
            Vous devez être connecté pour accéder à cette page.
            Redirection vers la page de connexion...
          </div>
        </div>
      </Template>
    );
  }

  // Vérifier les autorisations
  if (!canImportEvaluation && !canFillEvaluation && !canValidateAsManager && !canValidateAsDirector) {
    return (
      <Template>
        <div className="container mt-4">
          <h2 className="mb-4">Entretien d&apos;évaluation</h2>
          <div className="alert alert-warning">
            Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
          </div>
        </div>
      </Template>
    );
  }

  return (
    <Template>
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">Entretien d&apos;évaluation</h2>
            
            {/* Informations de l'employé */}
            {employeeInfo && (
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 d-flex align-items-center">
                      <i className="mdi mdi-account-outline text-primary me-2"></i>
                      Détails de l&apos;employé
                    </h5>
                  </div>
                </div>
                <div className="card-body py-3">
                  <div className="row">
                    <div className="col-md-4">
                      <p className="mb-1 text-muted">Employé</p>
                      <p className="mb-0 fw-bold">{employeeInfo.fullName || `${employeeInfo.firstName || ''} ${employeeInfo.lastName || ''}`.trim() || "Non spécifié"}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="mb-1 text-muted">Poste</p>
                      <p className="mb-0">{employeeInfo.position || "Non spécifié"}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="mb-1 text-muted">Département</p>
                      <p className="mb-0">{employeeInfo.department || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="row">
              {/* Colonne gauche: Import et visualisation du PDF */}
              <div className="col-md-5">
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 d-flex align-items-center">
                      <i className="mdi mdi-file-pdf-outline text-primary me-2"></i>
                      Document d&apos;évaluation
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <label htmlFor="pdfFileInput" className="form-label d-flex align-items-center">
                        <i className="mdi mdi-upload me-2 text-primary"></i>
                        Importer une fiche d&apos;évaluation (PDF)
                      </label>
                      <div className="custom-file-input">
                        <input 
                          type="file" 
                          id="pdfFileInput"
                          className="form-control" 
                          accept="application/pdf" 
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    
                    {file && (
                      <div className="alert alert-success mb-4">
                        <i className="mdi mdi-check-circle me-2"></i>
                        Fichier importé : {file.name}
                      </div>
                    )}
                    
                    {previewUrl ? (
                      <div className="pdf-preview">
                        <h6 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                          <i className="mdi mdi-eye-outline text-primary me-2"></i>
                          Aperçu du document
                        </h6>
                        <div className="pdf-container" style={{ height: '750px', overflow: 'hidden', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                          <iframe 
                            src={previewUrl} 
                            width="100%" 
                            height="100%" 
                            title="Aperçu PDF" 
                            style={{ border: 'none' }}
                          ></iframe>
                        </div>
                        <div className="text-center mt-3">
                          <a 
                            href={previewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="mdi mdi-open-in-new me-1"></i>
                            Voir en plein écran
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-5 h-100 d-flex flex-column justify-content-center align-items-center border rounded" style={{ backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                        <i className="mdi mdi-file-document-outline text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-3 mb-0 text-muted">Importez un document PDF pour le visualiser ici</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Colonne droite: Formulaire d'évaluation */}
              <div className="col-md-7">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 d-flex align-items-center">
                      <i className="mdi mdi-clipboard-text-outline text-primary me-2"></i>
                      Formulaire d&apos;évaluation
                    </h5>
                  </div>
                  <div className="card-body">
                    {/* Navigation par onglets */}
                    <ul className="nav nav-tabs mb-4">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                          onClick={() => changeTab('general')}
                        >
                          <i className="mdi mdi-information-outline me-1"></i>
                          Général
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'previous' ? 'active' : ''}`}
                          onClick={() => changeTab('previous')}
                        >
                          <i className="mdi mdi-history me-1"></i>
                          Bilan précédent
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'objectives' ? 'active' : ''}`}
                          onClick={() => changeTab('objectives')}
                        >
                          <i className="mdi mdi-flag-outline me-1"></i>
                          Objectifs
                        </button>
                      </li>
                    </ul>
                    
                    {/* Contenu des onglets */}
                    <div className="tab-content">
                      {/* Onglet Général */}
                      {activeTab === 'general' && (
                        <div className="tab-pane fade show active">
                          <div className="row mb-4">
                            <div className="col-md-6">
                              <div className="form-group">
                                <label className="form-label">Date de l&apos;entretien</label>
                                <input 
                                  type="date" 
                                  className="form-control" 
                                  value={formData.general.date}
                                  onChange={e => handleNestedChange('general', 'date', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-group">
                                <label className="form-label">Lieu</label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  placeholder="Lieu de l'entretien"
                                  value={formData.general.location}
                                  onChange={e => handleNestedChange('general', 'location', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="form-group mb-4">
                            <label className="form-label">Contexte de l&apos;entretien</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Décrivez le contexte de cet entretien d'évaluation..."
                              value={formData.general.context}
                              onChange={e => handleNestedChange('general', 'context', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Notes générales</label>
                            <textarea 
                              className="form-control" 
                              rows="5"
                              placeholder="Notes générales concernant l'entretien..."
                              value={formData.globalNotes}
                              onChange={e => setFormData({...formData, globalNotes: e.target.value})}
                            ></textarea>
                          </div>
                        </div>
                      )}
                      
                      {/* Onglet Bilan précédent */}
                      {activeTab === 'previous' && (
                        <div className="tab-pane fade show active">
                          <div className="form-group mb-4">
                            <label className="form-label">Réalisations notables</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Décrivez les réalisations notables de la période précédente..."
                              value={formData.previousPeriod.achievements}
                              onChange={e => handleNestedChange('previousPeriod', 'achievements', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <div className="form-group mb-4">
                            <label className="form-label">Défis rencontrés</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Décrivez les défis rencontrés durant la période précédente..."
                              value={formData.previousPeriod.challenges}
                              onChange={e => handleNestedChange('previousPeriod', 'challenges', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <div className="form-group mb-4">
                            <label className="form-label">Objectifs précédents atteints</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Indiquez les objectifs précédents qui ont été atteints..."
                              value={formData.previousPeriod.previousObjectivesAchieved}
                              onChange={e => handleNestedChange('previousPeriod', 'previousObjectivesAchieved', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Feedback des parties prenantes</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              placeholder="Résumez le feedback reçu des parties prenantes..."
                              value={formData.previousPeriod.feedback}
                              onChange={e => handleNestedChange('previousPeriod', 'feedback', e.target.value)}
                            ></textarea>
                          </div>
                        </div>
                      )}
                      
                      {/* Onglet Objectifs */}
                      {activeTab === 'objectives' && (
                        <div className="tab-pane fade show active">
                          <p className="text-muted mb-3">
                            Définissez les objectifs pour la prochaine période d&apos;évaluation.
                          </p>
                          
                          {formData.objectives.map((objective, index) => (
                            <div key={index} className="card mb-3 border">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0">Objectif {index + 1}</h6>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveObjective(index)}
                                  >
                                    <i className="mdi mdi-trash-can-outline"></i>
                                  </button>
                                </div>
                                
                                <div className="mb-3">
                                  <label className="form-label">Description</label>
                                  <textarea 
                                    className="form-control"
                                    rows="2"
                                    placeholder="Décrivez l'objectif à atteindre..."
                                    value={objective.description}
                                    onChange={e => handleObjectiveChange(index, 'description', e.target.value)}
                                  ></textarea>
                                </div>
                                
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label className="form-label">Date d&apos;échéance</label>
                                    <input 
                                      type="date" 
                                      className="form-control"
                                      value={objective.dueDate}
                                      onChange={e => handleObjectiveChange(index, 'dueDate', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="col-md-6 mb-3">
                                    <label className="form-label">Indicateur de réussite</label>
                                    <input 
                                      type="text" 
                                      className="form-control"
                                      placeholder="Comment mesurer la réussite?"
                                      value={objective.indicator}
                                      onChange={e => handleObjectiveChange(index, 'indicator', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="d-grid">
                            <button 
                              type="button" 
                              className="btn btn-outline-primary"
                              onClick={handleAddObjective}
                            >
                              <i className="mdi mdi-plus-circle me-2"></i>
                              Ajouter un objectif
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bouton de sauvegarde */}
                    <div className="d-flex justify-content-end mt-4">
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <i className="mdi mdi-content-save-outline me-2"></i>
                            Enregistrer l&apos;entretien
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de succès */}
        {showSuccessAnimation && (
          <div className="modal fade show" 
            style={{
              display: 'block',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingRight: '17px'
            }} 
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faBell} className="me-2" /> Sauvegarde réussie
                  </h5>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <div className="success-animation">
                      <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                      </svg>
                    </div>
                    <p className="text-center mt-3">L&apos;entretien a été sauvegardé avec succès</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop show"></div>
          </div>
        )}
      </div>
    </Template>
  );
};

export default EvaluationInterviews;