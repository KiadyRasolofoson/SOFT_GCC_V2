import { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const EvaluationFill = ({ interview, employeeId, extractedData }) => {
  const [employeeInfo, setEmployeeInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
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
  const [activeTab, setActiveTab] = useState('general');

  // Effet pour le PDF importé
  useEffect(() => {
    if (extractedData && extractedData.url) {
      setPdfUrl(extractedData.url);
    }
  }, [extractedData]);

  // Charger les informations de l'employé et de l'évaluation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les détails de l'employé
        const employeeResponse = await api.get(`/Employee/${employeeId}`);
        
        if (employeeResponse.data) {
          const employee = employeeResponse.data;
          setEmployeeInfo(employee);
          
          // Récupérer l'évaluation
          if (interview && interview.evaluationId) {
            // Récupérer les détails de l'évaluation
            const evaluationResponse = await api.get(`/Evaluation/${interview.evaluationId}`);
            
            if (evaluationResponse.data) {
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
            }
          }
          
          // Charger les compétences associées au poste
          if (employee.positionId) {
            const skillsResponse = await api.get(`/Skill/position/${employee.positionId}`);
            
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
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Impossible de charger les données de l'employé ou de l'évaluation");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [employeeId, interview]);
  
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
  
  // Gestionnaire de changement pour les compétences
  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.skills];
    newSkills[index][field] = value;
    
    setFormData(prev => ({
      ...prev,
      skills: newSkills
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
  
  // Calculer la moyenne des compétences
  const calculateAverageRating = () => {
    const ratings = formData.skills
      .map(skill => skill.rating)
      .filter(rating => rating > 0);
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return (sum / ratings.length).toFixed(1);
  };
  
  // Sauvegarder le formulaire
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Calculer la note moyenne
      const averageRating = calculateAverageRating();
      
      // Préparer les données à envoyer
      const payload = {
        evaluationId: interview.evaluationId,
        employeeId: employeeId,
        interviewDate: formData.general.date,
        notes: JSON.stringify(formData),
        average: averageRating
      };
      
      await api.post(
        '/EvaluationQuestion/evaluation/save-responses',
        payload
      );
      
      toast.success("Données d'entretien sauvegardées avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'entretien:", error);
      toast.error("Erreur lors de la sauvegarde de l'entretien");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour changer d'onglet
  const changeTab = (tabName) => {
    setActiveTab(tabName);
  };
  
  // Grouper les compétences par catégorie pour l'affichage
  const getSkillsByCategory = () => {
    const categories = {};
    
    formData.skills.forEach(skill => {
      const category = skill.category || 'Autres';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(skill);
    });
    
    return Object.entries(categories).map(([name, skills]) => ({ name, skills }));
  };
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <span className="ms-2">Chargement des données...</span>
      </div>
    );
  }
  
  return (
    <div className="evaluation-fill-container">
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <i className="mdi mdi-clipboard-text-outline text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
              Entretien d&apos;évaluation
            </h5>
            <div className="badge bg-primary">
              Note globale: {calculateAverageRating()}/5
            </div>
          </div>
          
          {/* Informations de l'employé */}
          {employeeInfo && (
            <div className="mt-3 p-3 border rounded bg-white">
              <div className="row">
                <div className="col-md-4">
                  <p className="mb-1 text-muted">Employé</p>
                  <p className="mb-0 fw-bold">{employeeInfo.firstName} {employeeInfo.lastName}</p>
                </div>
                <div className="col-md-3">
                  <p className="mb-1 text-muted">Poste</p>
                  <p className="mb-0">{employeeInfo.position || "Non spécifié"}</p>
                </div>
                <div className="col-md-3">
                  <p className="mb-1 text-muted">Département</p>
                  <p className="mb-0">{employeeInfo.department || "Non spécifié"}</p>
                </div>
                <div className="col-md-2">
                  <p className="mb-1 text-muted">En poste depuis</p>
                  <p className="mb-0">{employeeInfo.joinDate ? new Date(employeeInfo.joinDate).toLocaleDateString() : "Non spécifié"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
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
                    className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                    onClick={() => changeTab('skills')}
                  >
                    <i className="mdi mdi-star-outline me-1"></i>
                    Compétences
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
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'development' ? 'active' : ''}`}
                    onClick={() => changeTab('development')}
                  >
                    <i className="mdi mdi-school-outline me-1"></i>
                    Développement
                  </button>
                </li>
              </ul>
              
              {/* Contenu des onglets */}
              <div className="tab-content">
                {/* Onglet Général */}
                {activeTab === 'general' && (
                  <div className="tab-pane fade show active">
                    <div className="row mb-4">
                      <div className="col-md-4">
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
                      <div className="col-md-4">
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
                
                {/* Onglet Compétences */}
                {activeTab === 'skills' && (
                  <div className="tab-pane fade show active">
                    {getSkillsByCategory().length > 0 ? (
                      getSkillsByCategory().map((category, categoryIndex) => (
                        <div key={categoryIndex} className="mb-4">
                          <h5 className="border-bottom pb-2 mb-3">{category.name}</h5>
                          
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th style={{width: '40%'}}>Compétence</th>
                                  <th style={{width: '15%'}}>Évaluation</th>
                                  <th style={{width: '45%'}}>Commentaire</th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.skills.map((skill) => {
                                  // Trouver l'index global de cette compétence
                                  const skillIndex = formData.skills.findIndex(s => s.skillId === skill.skillId);
                                  
                                  return (
                                    <tr key={skill.skillId}>
                                      <td>
                                        <div>
                                          <div className="fw-medium">{skill.name}</div>
                                          <small className="text-muted">{skill.description}</small>
                                        </div>
                                      </td>
                                      <td>
                                        <select 
                                          className="form-select"
                                          value={formData.skills[skillIndex]?.rating || 0}
                                          onChange={e => handleSkillChange(skillIndex, 'rating', parseInt(e.target.value))}
                                        >
                                          <option value="0">Non évalué</option>
                                          <option value="1">1 - Insuffisant</option>
                                          <option value="2">2 - À améliorer</option>
                                          <option value="3">3 - Satisfaisant</option>
                                          <option value="4">4 - Bon</option>
                                          <option value="5">5 - Excellent</option>
                                        </select>
                                      </td>
                                      <td>
                                        <textarea 
                                          className="form-control"
                                          rows="2"
                                          placeholder="Commentaire sur cette compétence..."
                                          value={formData.skills[skillIndex]?.comment || ''}
                                          onChange={e => handleSkillChange(skillIndex, 'comment', e.target.value)}
                                        ></textarea>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-warning">
                        <i className="mdi mdi-information-outline me-2"></i>
                        Aucune compétence n&apos;a été trouvée pour ce poste.
                      </div>
                    )}
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
                
                {/* Onglet Plan de développement */}
                {activeTab === 'development' && (
                  <div className="tab-pane fade show active">
                    <div className="form-group mb-4">
                      <label className="form-label">Besoins en formation</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Identifiez les besoins en formation et développement..."
                        value={formData.developmentPlan.trainingNeeds}
                        onChange={e => handleNestedChange('developmentPlan', 'trainingNeeds', e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="form-label">Aspirations de carrière</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Notez les aspirations de carrière discutées..."
                        value={formData.developmentPlan.careerAspiration}
                        onChange={e => handleNestedChange('developmentPlan', 'careerAspiration', e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Notes additionnelles</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Notes additionnelles concernant le plan de développement..."
                        value={formData.developmentPlan.notes}
                        onChange={e => handleNestedChange('developmentPlan', 'notes', e.target.value)}
                      ></textarea>
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
            
            {/* Prévisualisation du PDF importé */}
            <div className="col-md-4">
              {pdfUrl ? (
                <div className="pdf-preview">
                  <h6 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                    <i className="mdi mdi-file-document-outline text-primary me-2"></i>
                    Fiche d&apos;évaluation importée
                  </h6>
                  <div className="pdf-container" style={{ height: '600px', overflow: 'hidden', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                    <iframe 
                      src={pdfUrl} 
                      width="100%" 
                      height="100%"
                      title="Document PDF"
                      style={{ border: 'none' }}
                    ></iframe>
                  </div>
                  <div className="text-center mt-2">
                    <a 
                      href={pdfUrl} 
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
                <div className="text-center p-4 border rounded bg-light" style={{ marginTop: '42px' }}>
                  <i className="mdi mdi-file-document-outline text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-2 mb-0 text-muted">Aucun document PDF importé</p>
                  <p className="text-muted small">Importez un document dans l&apos;étape précédente pour le visualiser ici</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EvaluationFill.propTypes = {
  interview: PropTypes.object.isRequired,
  employeeId: PropTypes.number.isRequired,
  extractedData: PropTypes.object
};

export default EvaluationFill;
