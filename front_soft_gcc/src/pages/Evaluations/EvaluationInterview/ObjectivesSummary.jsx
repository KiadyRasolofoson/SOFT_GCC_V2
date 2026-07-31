import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import '../../../assets/css/Evaluations/SalaryListPlanning.css';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faUndo, faCheckCircle, faSpinner, faClock, faTimesCircle, faHourglassStart, faEdit, faSave, faBullseye, faChartBar, faHistory, faChevronDown, faChevronUp, faTrophy } from '@fortawesome/free-solid-svg-icons';
import PermissionService from '../../../services/PermissionService';

const OBJECTIVE_STATUS = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  ACHIEVED: 'Atteint',
  NOT_ACHIEVED: 'Non atteint',
};

const STATUS_COLORS = {
  [OBJECTIVE_STATUS.ACHIEVED]: 'success',
  [OBJECTIVE_STATUS.IN_PROGRESS]: 'primary',
  [OBJECTIVE_STATUS.NOT_STARTED]: 'secondary',
  [OBJECTIVE_STATUS.NOT_ACHIEVED]: 'danger',
};

function ObjectivesSummary() {
  const { user, hasPermission, loading: userLoading } = useUser();

  // États
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [statistics, setStatistics] = useState({
    totalObjectives: 0,
    achievedObjectives: 0,
    inProgressObjectives: 0,
    notStartedObjectives: 0,
    notAchievedObjectives: 0,
    averageCompletionRate: 0,
    globalAchievementRate: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    departmentId: '',
    employeeId: '',
    statusFilter: '',
  });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Édition inline
  const [editingObjective, setEditingObjective] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCompletionRate, setEditCompletionRate] = useState(0);
  const [savingObjective, setSavingObjective] = useState(null);

  // Historique de progression
  const [expandedHistory, setExpandedHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [progressHistoryCache, setProgressHistoryCache] = useState({});

  // ====== FONCTIONS DE RÉCUPÉRATION ======

  const fetchObjectives = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: pageSize,
        ...(filters.departmentId && { departmentId: Number(filters.departmentId) }),
        ...(filters.employeeId && { employeeId: Number(filters.employeeId) }),
        ...(filters.statusFilter && { statusFilter: filters.statusFilter }),
        ...(searchQuery && { searchQuery }),
      };

      const response = await api.get('/EvaluationInterview/objectives-summary', { params });
      
      if (response.data) {
        setObjectives(response.data.objectives || []);
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
        const total = response.data.totalCount || response.data.statistics?.totalObjectives || 0;
        setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      toast.error('Erreur lors du chargement des objectifs.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, searchQuery, user]);

  const fetchFilterOptions = useCallback(async () => {
    if (!user) return;
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get('/EvaluationInterview/departments'),
        api.get('/Employee'),
      ]);
      setDepartments(deptRes.data || []);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error('Erreur chargement filtres:', error);
    }
  }, [user]);

  // ====== EFFETS ======

  useEffect(() => {
    if (!userLoading && user) {
      fetchObjectives();
      fetchFilterOptions();
    }
  }, [fetchObjectives, fetchFilterOptions, userLoading, user]);

  // ====== GESTION DES ÉVÉNEMENTS ======

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({ departmentId: '', employeeId: '', statusFilter: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Édition inline d'un objectif
  const startEditing = (objective) => {
    setEditingObjective(objective);
    setEditStatus(objective.status || OBJECTIVE_STATUS.NOT_STARTED);
    setEditCompletionRate(objective.completionRate || 0);
  };

  const cancelEditing = () => {
    setEditingObjective(null);
    setEditStatus('');
    setEditCompletionRate(0);
  };

  // Gestion du changement de statut avec auto-synchro
  const handleStatusChange = (newStatus) => {
    setEditStatus(newStatus);
    // Auto-synchro : statut → taux
    if (newStatus === OBJECTIVE_STATUS.ACHIEVED) {
      setEditCompletionRate(100);
    } else if (newStatus === OBJECTIVE_STATUS.NOT_STARTED || newStatus === OBJECTIVE_STATUS.NOT_ACHIEVED) {
      setEditCompletionRate(0);
    }
  };

  // Gestion du changement de taux avec auto-synchro
  const handleRateChange = (newRate) => {
    setEditCompletionRate(newRate);
    // Auto-synchro : taux → statut
    if (newRate >= 100) {
      setEditStatus(OBJECTIVE_STATUS.ACHIEVED);
    } else if (newRate > 0 && editStatus === OBJECTIVE_STATUS.NOT_STARTED) {
      setEditStatus(OBJECTIVE_STATUS.IN_PROGRESS);
    } else if (newRate === 0 && editStatus === OBJECTIVE_STATUS.ACHIEVED) {
      setEditStatus(OBJECTIVE_STATUS.IN_PROGRESS);
    }
  };

  const saveObjectiveStatus = async (objective) => {
    setSavingObjective(objective.interviewId + '_' + objective.objectiveIndex);
    try {
      const response = await api.put(`/EvaluationInterview/objectives/${objective.interviewId}`, {
        objectiveIndex: objective.objectiveIndex,
        status: editStatus,
        completionRate: editCompletionRate,
      });
      
      // Utiliser les valeurs effectives retournées par le backend (après auto-synchro)
      if (response.data) {
        toast.success(`Objectif mis à jour : ${response.data.status} (${response.data.completionRate}%)`);
      } else {
        toast.success('Objectif mis à jour avec succès.');
      }
      cancelEditing();
      fetchObjectives(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'objectif.');
    } finally {
      setSavingObjective(null);
    }
  };

  // Charger l'historique de progression d'un objectif
  const toggleHistory = async (objective) => {
    const key = `${objective.interviewId}_${objective.objectiveIndex}`;
    
    if (expandedHistory[key]) {
      setExpandedHistory(prev => ({ ...prev, [key]: false }));
      return;
    }

    // Si déjà en cache, on affiche directement
    if (progressHistoryCache[key]) {
      setExpandedHistory(prev => ({ ...prev, [key]: true }));
      return;
    }

    // Charger depuis l'API
    setLoadingHistory(prev => ({ ...prev, [key]: true }));
    try {
      const response = await api.get(`/EvaluationInterview/objectives/${objective.interviewId}/history/${objective.objectiveIndex}`);
      if (response.data) {
        setProgressHistoryCache(prev => ({ ...prev, [key]: response.data }));
        setExpandedHistory(prev => ({ ...prev, [key]: true }));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('Impossible de charger l\'historique de progression.');
    } finally {
      setLoadingHistory(prev => ({ ...prev, [key]: false }));
    }
  };

  // Pagination
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-controls d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center">
          <span className="me-2">Lignes par page:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: '80px' }}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                &laquo;
              </button>
            </li>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                &lsaquo;
              </button>
            </li>
            {pages.map(page => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(page)}>
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                &rsaquo;
              </button>
            </li>
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  // Barre de progression
  const renderProgressBar = (rate) => {
    const color = rate >= 80 ? 'bg-success' : rate >= 40 ? 'bg-primary' : rate > 0 ? 'bg-warning' : 'bg-secondary';
    return (
      <div className="progress" style={{ height: '6px', minWidth: '60px' }}>
        <div
          className={`progress-bar ${color}`}
          role="progressbar"
          style={{ width: `${rate}%` }}
          aria-valuenow={rate}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    );
  };

  // Badge de statut
  const renderStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || 'secondary';
    const icons = {
      [OBJECTIVE_STATUS.ACHIEVED]: faCheckCircle,
      [OBJECTIVE_STATUS.IN_PROGRESS]: faSpinner,
      [OBJECTIVE_STATUS.NOT_STARTED]: faHourglassStart,
      [OBJECTIVE_STATUS.NOT_ACHIEVED]: faTimesCircle,
    };
    return (
      <span className={`badge bg-${color} bg-opacity-75`} style={{ fontSize: '0.8rem' }}>
        <FontAwesomeIcon icon={icons[status] || faBullseye} className="me-1" />
        {status}
      </span>
    );
  };

  if (userLoading || loading) {
    return (
      <Template>
        <div className="container mt-4">
          <div className="loading-spinner text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-2 text-muted">Chargement des objectifs...</p>
          </div>
        </div>
      </Template>
    );
  }

  if (!user) {
    return (
      <Template>
        <div className="container mt-4">
          <div className="alert alert-danger">
            Vous devez être connecté pour accéder à cette page.
          </div>
        </div>
      </Template>
    );
  }

  return (
    <Template>
      <div className="salary-list-planning">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="title mb-0">
            <FontAwesomeIcon icon={faBullseye} className="me-2 text-primary" />
            Récapitulatif des objectifs
          </h4>
        </div>

        {/* Cartes de statistiques */}
        <div className="row mb-4">
          <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-left-primary shadow-sm h-100">
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>TOTAL</p>
                    <h4 className="mb-0 fw-bold">{statistics.totalObjectives}</h4>
                  </div>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                    <FontAwesomeIcon icon={faBullseye} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-left-success shadow-sm h-100">
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>ATTEINTS</p>
                    <h4 className="mb-0 fw-bold text-success">{statistics.achievedObjectives}</h4>
                  </div>
                  <div className="rounded-circle bg-success bg-opacity-10 p-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-left-primary shadow-sm h-100">
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>EN COURS</p>
                    <h4 className="mb-0 fw-bold text-primary">{statistics.inProgressObjectives}</h4>
                  </div>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                    <FontAwesomeIcon icon={faSpinner} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-left-warning shadow-sm h-100">
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>TAUX RÉUSSITE</p>
                    <h4 className="mb-0 fw-bold text-warning">{statistics.globalAchievementRate}%</h4>
                  </div>
                  <div className="rounded-circle bg-warning bg-opacity-10 p-2">
                    <FontAwesomeIcon icon={faTrophy} className="text-warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-lg-4 col-md-6 mb-3">
            <div className="card border-left-info shadow-sm h-100">
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>TAUX MOYEN</p>
                    <h4 className="mb-0 fw-bold text-info">{statistics.averageCompletionRate}%</h4>
                  </div>
                  <div className="rounded-circle bg-info bg-opacity-10 p-2">
                    <FontAwesomeIcon icon={faChartBar} className="text-info" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="card p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faSearch} className="me-1" /> Recherche
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nom, description, indicateur..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faFilter} className="me-1" /> Département
              </label>
              <select
                className="form-select"
                name="departmentId"
                value={filters.departmentId}
                onChange={handleFilterChange}
              >
                <option value="">Tous</option>
                {departments.map(dept => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faFilter} className="me-1" /> Employé
              </label>
              <select
                className="form-select"
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">Tous</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faFilter} className="me-1" /> Statut
              </label>
              <select
                className="form-select"
                name="statusFilter"
                value={filters.statusFilter}
                onChange={handleFilterChange}
              >
                <option value="">Tous</option>
                <option value={OBJECTIVE_STATUS.NOT_STARTED}>Non commencé</option>
                <option value={OBJECTIVE_STATUS.IN_PROGRESS}>En cours</option>
                <option value={OBJECTIVE_STATUS.ACHIEVED}>Atteint</option>
                <option value={OBJECTIVE_STATUS.NOT_ACHIEVED}>Non atteint</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-6 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary"
                onClick={handleResetFilters}
                title="Réinitialiser les filtres"
              >
                <FontAwesomeIcon icon={faUndo} className="me-1" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des objectifs */}
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '16%' }}>Employé</th>
                    <th style={{ width: '10%' }}>Département</th>
                    <th style={{ width: '8%' }}>Poste</th>
                    <th style={{ width: '20%' }}>Objectif</th>
                    <th style={{ width: '7%' }}>Échéance</th>
                    <th style={{ width: '10%' }}>Statut</th>
                    <th style={{ width: '8%' }}>Progression</th>
                    <th style={{ width: '9%' }}>Modifié le</th>
                    <th style={{ width: '12%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {objectives.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        <FontAwesomeIcon icon={faBullseye} style={{ fontSize: '2rem' }} className="mb-2 d-block" />
                        Aucun objectif trouvé.
                        {searchQuery || filters.departmentId || filters.employeeId || filters.statusFilter
                          ? ' Essayez de modifier vos filtres.'
                          : ' Les objectifs seront affichés ici une fois les entretiens complétés.'}
                      </td>
                    </tr>
                  ) : (
                    objectives.map((obj) => {
                      const isEditing = editingObjective &&
                        editingObjective.interviewId === obj.interviewId &&
                        editingObjective.objectiveIndex === obj.objectiveIndex;
                      const isSaving = savingObjective === obj.interviewId + '_' + obj.objectiveIndex;
                      const historyKey = `${obj.interviewId}_${obj.objectiveIndex}`;
                      const isHistoryExpanded = expandedHistory[historyKey];
                      const isLoadingHistory = loadingHistory[historyKey];
                      const historyData = progressHistoryCache[historyKey];

                      return (
                        <React.Fragment key={historyKey}>
                        <tr>
                          <td>
                            <span className="fw-semibold">{obj.employeeName}</span>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{obj.department}</span>
                          </td>
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{obj.position}</span>
                          </td>
                          <td>
                            <div className="fw-medium" style={{ fontSize: '0.9rem' }}>{obj.description}</div>
                            {obj.indicator && (
                              <small className="text-muted">
                                <i className="mdi mdi-target me-1"></i>
                                {obj.indicator}
                              </small>
                            )}
                          </td>
                          <td>
                            <small>{obj.dueDate ? new Date(obj.dueDate).toLocaleDateString('fr-FR') : '-'}</small>
                          </td>
                          <td>
                            {isEditing ? (
                              <select
                                className="form-select form-select-sm"
                                value={editStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                              >
                                <option value={OBJECTIVE_STATUS.NOT_STARTED}>Non commencé</option>
                                <option value={OBJECTIVE_STATUS.IN_PROGRESS}>En cours</option>
                                <option value={OBJECTIVE_STATUS.ACHIEVED}>Atteint</option>
                                <option value={OBJECTIVE_STATUS.NOT_ACHIEVED}>Non atteint</option>
                              </select>
                            ) : (
                              renderStatusBadge(obj.status)
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="range"
                                  className="form-range form-range-sm"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={editCompletionRate}
                                  onChange={(e) => handleRateChange(Number(e.target.value))}
                                  style={{ width: '80px' }}
                                />
                                <small className="fw-bold">{editCompletionRate}%</small>
                              </div>
                            ) : (
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  {renderProgressBar(obj.completionRate)}
                                  <small className="fw-semibold" style={{ fontSize: '0.8rem' }}>{obj.completionRate}%</small>
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {obj.lastModified
                                ? new Date(obj.lastModified).toLocaleDateString('fr-FR')
                                : '-'}
                            </small>
                          </td>
                          <td>
                            {isEditing ? (
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => saveObjectiveStatus(obj)}
                                  disabled={isSaving}
                                  title="Sauvegarder"
                                >
                                  {isSaving ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <FontAwesomeIcon icon={faSave} />
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                  title="Annuler"
                                >
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => startEditing(obj)}
                                  title="Modifier le statut"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className={`btn btn-sm ${isHistoryExpanded ? 'btn-info' : 'btn-outline-info'}`}
                                  onClick={() => toggleHistory(obj)}
                                  title="Historique de progression"
                                  disabled={isLoadingHistory}
                                >
                                  {isLoadingHistory ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faHistory} />
                                      {obj.progressHistoryCount > 0 && (
                                        <span className="badge bg-info ms-1" style={{ fontSize: '0.6rem' }}>
                                          {obj.progressHistoryCount}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {/* Ligne d'historique de progression (expandable) */}
                        {isHistoryExpanded && historyData && (
                          <tr key={`${historyKey}_history`}>
                            <td colSpan="9" className="bg-light p-0">
                              <div className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">
                                    <FontAwesomeIcon icon={faHistory} className="me-2 text-info" />
                                    Historique de progression
                                  </h6>
                                  <small className="text-muted">
                                    Statut actuel : {renderStatusBadge(historyData.currentStatus)} — {historyData.currentCompletionRate}%
                                  </small>
                                </div>
                                {historyData.progressHistory && historyData.progressHistory.length > 0 ? (
                                  <div className="timeline">
                                    {historyData.progressHistory.map((entry, i) => (
                                      <div key={i} className="d-flex align-items-start mb-2 pb-2 border-bottom">
                                        <div className="me-3 text-muted" style={{ minWidth: '130px', fontSize: '0.8rem' }}>
                                          <FontAwesomeIcon icon={faClock} className="me-1" />
                                          {new Date(entry.date).toLocaleDateString('fr-FR')} {new Date(entry.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                          {renderStatusBadge(entry.oldStatus)}
                                          <FontAwesomeIcon icon={faChevronDown} className="text-muted" style={{ transform: 'rotate(-90deg)' }} />
                                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{entry.oldCompletionRate}%</span>
                                          <span className="fw-bold text-primary mx-1">→</span>
                                          {renderStatusBadge(entry.newStatus)}
                                          <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{entry.newCompletionRate}%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                    Aucun changement enregistré. L'historique sera créé lors de la première modification.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="card-footer bg-white">
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </Template>
  );
}

export default ObjectivesSummary;
