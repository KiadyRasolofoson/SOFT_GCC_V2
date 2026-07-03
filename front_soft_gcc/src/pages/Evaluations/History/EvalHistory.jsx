import { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import { ResponsivePie } from '@nivo/pie';
import '../../../assets/css/Evaluations/EvaluationHistory.css';
import api from '../../../helpers/api';
import EvaluationDetailsModal from './EvaluationDetailsModal';
import GlobalPerformanceGraph from './GlobalPerformanceGraph';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFileExcel, FaFilePdf, FaFileCsv, FaDownload, FaSearch, FaUndo } from 'react-icons/fa';
import PropTypes from 'prop-types';

const API_BASE_URL = '/EvaluationHistory';

const KpiCard = ({ title, value, icon, color }) => (
  <div className="kpi-card">
    <h6>{title}</h6>
    <p className="kpi-value" style={{ color: color || 'inherit' }}>
      {value}
    </p>
    {icon && <div className="kpi-icon">{icon}</div>}
  </div>
);

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element,
  color: PropTypes.string
};

// Nouveau composant pour le graphique en camembert
const StatisticsPieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="alert alert-info">
        <h5>{title}</h5>
        <p>Aucune donnée disponible pour afficher le graphique.</p>
      </div>
    );
  }

  return (
    <div className="performance-graph-container">
      <h6 className="text-center mb-2">{title}</h6>
      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        <ResponsivePie
          data={data}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.6}
          cornerRadius={2}
          activeOuterRadiusOffset={8}
          colors={{ scheme: 'yellow_orange_brown' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 56,
              itemWidth: 100,
              itemHeight: 18,
              symbolShape: 'circle',
              symbolSize: 12
            }
          ]}
        />
      </div>
    </div>
  );
};

StatisticsPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string
    })
  ),
  title: PropTypes.string.isRequired
};

const EvaluationHistory = () => {
  const [loadingExport, setLoadingExport] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEvaluations, setTotalEvaluations] = useState(0);

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    department: '',
    evaluationType: '',
    minScore: '',
    maxScore: '',
    year: new Date().getFullYear().toString()
  });

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Nouvel état pour les statistiques globales
  const [globalStats, setGlobalStats] = useState({
    totalEvaluationsCount: 0,
    averageScore: 0,
    completionRate: 0,
    departmentDistribution: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Récupérer les départements et les types d'évaluation
  const fetchMetadata = useCallback(async () => {
    try {
      // Récupérer les départements
      const deptResponse = await api.get(`${API_BASE_URL}/departments`);
      setDepartments(deptResponse.data);
      
      // Récupérer les types d'évaluation
      const evalTypesResponse = await api.get(`${API_BASE_URL}/evaluation-types`);
      if (Array.isArray(evalTypesResponse.data)) {
        setEvaluationTypes(evalTypesResponse.data);
      } else {
        // Si l'API n'est pas disponible, utiliser des valeurs par défaut
        setEvaluationTypes(['Annuelle', 'Trimestrielle', 'Probatoire', 'Promotion']);
      }
      
      // Récupérer la liste des employés pour la recherche avancée
      try {
        const employeesResponse = await api.get(`${API_BASE_URL}/employees`);
        if (Array.isArray(employeesResponse.data)) {
          console.log(`${employeesResponse.data.length} employés chargés`);
          // Vous pouvez stocker les employés dans l'état si nécessaire pour la recherche avancée
          // setEmployees(employeesResponse.data);
        }
      } catch (employeesError) {
        console.error('Erreur lors du chargement des employés:', employeesError);
        // Continuer l'exécution même si la récupération des employés échoue
      }
    } catch (err) {
      console.error('Erreur lors du chargement des métadonnées:', err);
    }
  }, []);

  // Nouvelle fonction pour récupérer les statistiques globales
  const fetchGlobalStatistics = useCallback(async () => {
    setLoadingStats(true);
    try {
      // Appel API pour récupérer les statistiques globales (sans pagination)
      const response = await api.get(`${API_BASE_URL}/global-statistics`, {
        params: {
          // On peut conserver certains filtres pour les statistiques
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          evaluationType: filters.evaluationType || null,
          department: filters.department || null,
          employeeName: searchQuery || null,
          // Mais on n'inclut PAS les paramètres de pagination
        }
      });
      
      if (response.data) {
        setGlobalStats(response.data);
        // Mettre à jour le total des évaluations pour l'affichage global
        setTotalEvaluations(response.data.totalEvaluationsCount || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques globales:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [filters.startDate, filters.endDate, filters.department, filters.evaluationType, searchQuery]);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Récupération des évaluations avec paramètres:", {
        pageNumber: currentPage,
        pageSize: pageSize,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        evaluationType: filters.evaluationType || null,
        department: filters.department || null,
        employeeName: searchQuery || null,
      });
      
      const response = await api.get(`${API_BASE_URL}/evaluation-history-paginated`, {
        params: {
          pageNumber: currentPage,
          pageSize: pageSize,
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          evaluationType: filters.evaluationType || null,
          department: filters.department || null,
          employeeName: searchQuery || null,
        },
      });
      
      console.log("Données d'évaluations reçues:", response.data);
      
      // Filtrer les évaluations null et formater les données
      const formattedEvaluations = response.data.evaluations
        .filter(evaluation => evaluation !== null)
        .map(evaluation => ({
          ...evaluation,
          evaluationType: evaluation.evaluationType || 'Non définie',
          overallScore: evaluation.overallScore || 0,
          status: evaluation.status || 10, // 10 = Planifiée par défaut
        }));

      setEvaluations(formattedEvaluations);
      setTotalPages(response.data.totalPages);
      
      // Ne pas mettre à jour totalEvaluations ici, car cela sera fait par fetchGlobalStatistics
      // setTotalEvaluations(response.data.totalItems || formattedEvaluations.length);
    } catch (fetchError) { 
      console.error('Erreur lors de la récupération des évaluations:', fetchError);
      setError('Erreur lors de la récupération des évaluations.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, filters]);

  // Effet initial pour charger les métadonnées
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Effet pour charger les données quand les filtres changent
  useEffect(() => {
    const loadData = async () => {
      await fetchEvaluations();
    };
    
    loadData();
    // Ne pas inclure fetchEvaluations comme dépendance
    // car cela crée une boucle infinie
  }, [filters.startDate, filters.endDate, filters.department, filters.evaluationType, 
      currentPage, pageSize, searchQuery, selectedEmployee]);
      
  // Nouvel effet pour charger les statistiques globales uniquement quand les filtres principaux changent
  useEffect(() => {
    fetchGlobalStatistics();
  }, [fetchGlobalStatistics]);

  const handleSearchChange = (e) => {
    const query = e.target.value.trim();
    setSearchQuery(query);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      department: '',
      evaluationType: '',
      minScore: '',
      maxScore: '',
      year: ''
    });
    setSearchQuery('');
    setSelectedEmployee(null);
    setCurrentPage(1);
  };

  const handleDetailsClick = async (evaluationId) => {
    try {
      const response = await api.get(`${API_BASE_URL}/detail/${evaluationId}`);
      setSelectedEvaluation(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Erreur lors du chargement des détails :", error);
    }
  };

  const closeModal = () => {
    setSelectedEvaluation(null);
    setShowModal(false);
  };

  const handleExport = async (format) => {
    setLoadingExport(true);
    try {
      // Si format est "client-side", nous utilisons les méthodes intégrées
      if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(evaluations.map(emp => ({
          Nom: `${emp.firstName} ${emp.lastName}`,
          Poste: emp.position,
          "Date d'évaluation": new Date(emp.startDate).toLocaleDateString('fr-FR'),
          "Date de fin": new Date(emp.endDate).toLocaleDateString('fr-FR'),
          Statut: emp.status,
          Note: emp.overallScore,
          "Type d'évaluation": emp.evaluationType,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluations");
        XLSX.writeFile(workbook, "historique_evaluations.xlsx");
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.autoTable({
          head: [['Nom', 'Poste', "Date d'évaluation", 'Note', "Type d'évaluation"]],
          body: evaluations.map(emp => [
            `${emp.firstName} ${emp.lastName}`,
            emp.position,
            new Date(emp.startDate).toLocaleDateString('fr-FR'),
            emp.overallScore,
            emp.evaluationType,
          ]),
        });
        doc.save('historique_evaluations.pdf');
      } else {
        // Sinon, nous utilisons l'API backend pour des exports plus complexes
        const response = await api.get(`${API_BASE_URL}/export`, {
          params: {
            format: format,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
            department: filters.department || '',
            evaluationType: filters.evaluationType || '',
            employeeName: searchQuery || '',
          },
          responseType: 'blob', // Important pour les fichiers binaires
        });
        
        // Créer un URL pour télécharger le fichier
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `evaluations.${format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(`Erreur lors de l'export en ${format}:`, error);
      setError(`Erreur lors de l'exportation en ${format}.`);
    } finally {
      setLoadingExport(false);
      console.log(`Export ${format} terminé, statut d'export: ${loadingExport}`);
    }
  };

  const getStatusClass = (status) => {
    if (!status) return "badge bg-secondary";
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    
    switch(statusCode) {
      case 10: return "badge bg-warning text-dark"; // Planifié
      case 20: return "badge bg-info"; // En cours
      case 30: return "badge bg-success"; // Terminée
      case 40: return "badge bg-danger"; // Annulée
      default: return "badge bg-secondary"; // Autre
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return "Inconnu";
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    
    switch(statusCode) {
      case 10: return "Planifiée";
      case 20: return "En cours";
      case 30: return "Terminée";
      case 40: return "Annulée";
      default: return "Inconnu";
    }
  };

  return (
    <Template>
      <div className="container-fluid mt-4">
        <header className="d-flex justify-content-between align-items-center mb-4">
          <h2>Historique des Évaluations</h2>
          
        </header>
        
        {error && (
          <div className="alert alert-danger mb-4">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        <div className="row mb-4">
          <div className="col-lg-12">
            <div className="card shadow">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Filtres de recherche</h5>
              </div>
              <div className="card-body">
                <div className="filters card p-3 mb-4">
                  <div className="row align-items-center g-3 flex-wrap" style={{ rowGap: '1rem' }}>
                    {/* Champ de recherche */}
                    <div className="col-md-3 mb-2">
                      <div className="input-group">
                        <span className="input-group-text border-end-0" style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}>
                          <FaSearch className="text-primary" />
                        </span>
                        <input
                          type="text"
                          className="form-control ps-0 border-start-0"
                          style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
                          placeholder="Rechercher un employé..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          aria-label="Rechercher un employé"
                        />
                      </div>
                    </div>
                    {/* Filtre par Année */}
                    <div className="col-md-2 mb-2">
                      <select
                        className="form-control"
                        value={filters.year || ''}
                        onChange={e => {
                          const year = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            year: year,
                            startDate: year ? `${year}-01-01` : '',
                            endDate: year ? `${year}-12-31` : ''
                          }));
                        }}
                        style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
                        aria-label="Filtrer par année"
                      >
                        <option value="">Toutes les années</option>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {/* Filtre par Type d'évaluation */}
                    <div className="col-md-2 mb-2">
                      <select
                        name="evaluationType"
                        className="form-control"
                        value={filters.evaluationType}
                        onChange={handleFilterChange}
                        style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
                        aria-label="Filtrer par type d'évaluation"
                      >
                        <option value="">Tous les types</option>
                        {evaluationTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Filtre par Département */}
                    <div className="col-md-2 mb-2">
                      <select
                        name="department"
                        className="form-control"
                        value={filters.department}
                        onChange={handleFilterChange}
                        style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
                        aria-label="Filtrer par département"
                      >
                        <option value="">Tous les départements</option>
                        {departments.map((dep) => (
                          <option key={dep.departmentId} value={dep.name}>
                            {dep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Bouton de réinitialisation */}
                    <div className="col-md-auto mb-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={resetFilters}
                        title="Réinitialiser les filtres"
                        style={{ 
                          backgroundColor: '#f7f9fc',
                          borderColor: '#e9ecef',
                          color: '#6c757d'
                        }}
                      >
                        <FaUndo />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div className="card shadow mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Liste des évaluations</h5>
                <span className="badge rounded-pill fs-6" style={{ backgroundColor: '#D4AC0D', color: 'white', padding: '8px 15px' }}>
                  Total: {totalEvaluations} évaluation(s)
                </span>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                    <p className="mt-2">Chargement des données...</p>
                  </div>
                ) : evaluations.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Employé</th>
                          <th>Poste</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Score</th>
                          <th>Statut</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluations.map((evaluation) => (
                          <tr key={evaluation.evaluationId} className="align-middle">
                            <td>{evaluation.firstName} {evaluation.lastName}</td>
                            <td>{evaluation.position || 'N/A'}</td>
                            <td>
                              {evaluation.startDate ? new Date(evaluation.startDate).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </td>
                            <td>{evaluation.evaluationType}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="me-2"
                                  style={{
                                    width: `${(evaluation.overallScore || 0) * 20}%`,
                                    height: '8px',
                                    backgroundColor: `hsl(${(evaluation.overallScore || 0) * 24}, 70%, 50%)`,
                                    borderRadius: '4px'
                                  }}
                                ></div>
                                <span>{evaluation.overallScore?.toFixed(1) || '0.0'}</span>
                              </div>
                            </td>
                            <td>
                              <span className={getStatusClass(evaluation.status)}>
                                {getStatusLabel(evaluation.status)}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleDetailsClick(evaluation.evaluationId)}
                                style={{ backgroundColor: '#D4AC0D', color: 'white' }}
                              >
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="mb-3">
                      <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-muted">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h6>Aucune évaluation trouvée</h6>
                    <p className="text-muted">
                      Ajustez vos critères de recherche ou essayez une autre période
                    </p>
                  </div>
                )}

                {/* Nouvelle pagination similaire à SalaryListPlanning.jsx */}
                <div className="pagination-controls mt-4">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                  <span>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                  <select
                    className="form-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5 par page</option>
                    <option value={10}>10 par page</option>
                    <option value={25}>25 par page</option>
                    <option value={50}>50 par page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Le graphique de performance est maintenant en dessous de la liste */}
        <div className="row">
          <div className="col-lg-12">
            <div className="card shadow mb-4">
              <div className="card-header">
                <h5 className="mb-0">Évolution des performances</h5>
              </div>
              <div className="card-body p-0">
                {loadingStats ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                    <p className="mt-2">Chargement des statistiques globales...</p>
                  </div>
                ) : (
                  <GlobalPerformanceGraph 
                    filters={{
                      startDate: filters.startDate || undefined,
                      endDate: filters.endDate || undefined,
                      department: filters.department || undefined,
                      evaluationType: filters.evaluationType || undefined
                    }}
                    globalStats={globalStats}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {showModal && selectedEvaluation && (
          <EvaluationDetailsModal
            evaluation={selectedEvaluation}
            onClose={closeModal}
          />
        )}
      </div>
    </Template>
  );
};

export default EvaluationHistory;