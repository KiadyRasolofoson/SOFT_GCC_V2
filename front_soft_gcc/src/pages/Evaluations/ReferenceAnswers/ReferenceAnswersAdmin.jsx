import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import Template from '../../Template';
import '../../../assets/css/Common/crud-ui.css';

const ReferenceAnswersAdmin = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [referenceData, setReferenceData] = useState({
    referenceAnswerId: 0,
    questionId: 0,
    referenceText: '',
    evaluationGuidelines: '',
    expectedKeyPoints: '',
    scoreDescription1: '',
    scoreDescription2: '',
    scoreDescription3: '',
    scoreDescription4: '',
    scoreDescription5: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, [currentPage]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/Evaluation/questions/paginated`, {
        params: {
          pageNumber: currentPage,
          pageSize: 10
        }
      });
      
      setQuestions(response.data.items);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des questions:', err);
      setError('Impossible de charger les questions. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handleQuestionSelect = async (question) => {
    setSelectedQuestion(question);
    
    try {
      const response = await api.get(`/ReferenceAnswer/question/${question.questiondId}`);
      
      if (response.status === 200) {
        setReferenceData(response.data);
        setModalMode('edit');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Aucune référence trouvée, créer une nouvelle
        setReferenceData({
          referenceAnswerId: 0,
          questionId: question.questiondId,
          referenceText: '',
          evaluationGuidelines: '',
          expectedKeyPoints: '',
          scoreDescription1: '',
          scoreDescription2: '',
          scoreDescription3: '',
          scoreDescription4: '',
          scoreDescription5: ''
        });
        setModalMode('create');
      } else {
        console.error('Erreur lors de la récupération de la référence:', err);
      }
    }
    
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReferenceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaveStatus('saving');
      
      const response = await api.post('/ReferenceAnswer', referenceData);
      
      if (response.status === 200) {
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus(null);
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Erreur lors de l&apos;enregistrement de la référence:', err);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Template>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Gestion des Références d&apos;Évaluation</h4>
              <p className="card-description">
                Ajoutez ou modifiez les références pour aider les évaluateurs à noter les réponses
              </p>
              
              <div className="filters mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <input
                    type="text"
                    className="form-control w-50"
                    placeholder="Rechercher une question..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Chargement...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Question</th>
                          <th>Type d&apos;évaluation</th>
                          <th>Référence</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map(question => (
                          <tr key={question.questiondId}>
                            <td>{question.questiondId}</td>
                            <td className="text-truncate" style={{ maxWidth: '300px' }}>{question.question}</td>
                            <td>{question.evaluationType?.designation || "Non défini"}</td>
                            <td>
                              <span className="badge badge-pill badge-info">
                                À définir
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleQuestionSelect(question)}
                              >
                                Gérer la référence
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="pagination-controls mt-4">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </button>
                    <span className="mx-3">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal pour éditer/créer une référence */}
      {showModal && selectedQuestion && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === 'create' ? 'Créer une' : 'Modifier la'} référence d&apos;évaluation
                </h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label><strong>Question:</strong></label>
                    <p>{selectedQuestion.question}</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="referenceText">Réponse de référence:</label>
                    <textarea
                      id="referenceText"
                      name="referenceText"
                      className="form-control"
                      rows="4"
                      value={referenceData.referenceText}
                      onChange={handleInputChange}
                      placeholder="Saisissez une réponse de référence..."
                      required
                    />
                    <small className="form-text text-muted">
                      La réponse idéale à cette question que vous attendez de l&apos;employé.
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="evaluationGuidelines">Critères d&apos;évaluation:</label>
                    <textarea
                      id="evaluationGuidelines"
                      name="evaluationGuidelines"
                      className="form-control"
                      rows="3"
                      value={referenceData.evaluationGuidelines}
                      onChange={handleInputChange}
                      placeholder="Saisissez les critères d&apos;évaluation..."
                    />
                    <small className="form-text text-muted">
                      Critères permettant aux évaluateurs de juger la qualité des réponses.
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="expectedKeyPoints">Points clés attendus:</label>
                    <textarea
                      id="expectedKeyPoints"
                      name="expectedKeyPoints"
                      className="form-control"
                      rows="4"
                      value={referenceData.expectedKeyPoints}
                      onChange={handleInputChange}
                      placeholder="- Point 1&#10;- Point 2&#10;- Point 3"
                    />
                    <small className="form-text text-muted">
                      Points essentiels que la réponse devrait contenir (un par ligne, format liste).
                    </small>
                  </div>
                  
                  <h5 className="mt-4">Description des niveaux d&apos;évaluation</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="scoreDescription1">Niveau 1:</label>
                        <input
                          type="text"
                          id="scoreDescription1"
                          name="scoreDescription1"
                          className="form-control"
                          value={referenceData.scoreDescription1}
                          onChange={handleInputChange}
                          placeholder="Description d&apos;une réponse de niveau 1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="scoreDescription2">Niveau 2:</label>
                        <input
                          type="text"
                          id="scoreDescription2"
                          name="scoreDescription2"
                          className="form-control"
                          value={referenceData.scoreDescription2}
                          onChange={handleInputChange}
                          placeholder="Description d&apos;une réponse de niveau 2"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="scoreDescription3">Niveau 3:</label>
                        <input
                          type="text"
                          id="scoreDescription3"
                          name="scoreDescription3"
                          className="form-control"
                          value={referenceData.scoreDescription3}
                          onChange={handleInputChange}
                          placeholder="Description d&apos;une réponse de niveau 3"
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="scoreDescription4">Niveau 4:</label>
                        <input
                          type="text"
                          id="scoreDescription4"
                          name="scoreDescription4"
                          className="form-control"
                          value={referenceData.scoreDescription4}
                          onChange={handleInputChange}
                          placeholder="Description d&apos;une réponse de niveau 4"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="scoreDescription5">Niveau 5:</label>
                        <input
                          type="text"
                          id="scoreDescription5"
                          name="scoreDescription5"
                          className="form-control"
                          value={referenceData.scoreDescription5}
                          onChange={handleInputChange}
                          placeholder="Description d&apos;une réponse de niveau 5"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={saveStatus === 'saving'}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                          Enregistrement...
                        </>
                      ) : 'Enregistrer'}
                    </button>
                  </div>
                  
                  {saveStatus === 'success' && (
                    <div className="alert alert-success mt-3">
                      Référence enregistrée avec succès !
                    </div>
                  )}
                  
                  {saveStatus === 'error' && (
                    <div className="alert alert-danger mt-3">
                      Erreur lors de l&apos;enregistrement. Veuillez réessayer.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay pour le modal */}
      {showModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </Template>
  );
};

export default ReferenceAnswersAdmin; 