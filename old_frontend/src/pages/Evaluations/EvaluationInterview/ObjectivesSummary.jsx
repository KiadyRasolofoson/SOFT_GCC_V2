import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import '../../../assets/css/Evaluations/ObjectivesSummary.css';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faUndo,
  faCheckCircle,
  faSpinner,
  faClock,
  faTimesCircle,
  faHourglassStart,
  faEdit,
  faSave,
  faBullseye,
  faChartBar,
  faHistory,
  faChevronDown,
  faTrophy,
  faSyncAlt,
  faCalendarAlt,
  faArrowRight,
  faTasks,
  faBuilding,
  faUser
} from '@fortawesome/free-solid-svg-icons';

const OBJECTIVE_STATUS = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  ACHIEVED: 'Atteint',
  NOT_ACHIEVED: 'Non atteint',
};

// Colors helper for avatar generation
const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
];

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarBackground(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function ObjectivesSummary() {
  const { user, loading: userLoading } = useUser();

  // États
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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
  const [searchInput, setSearchInput] = useState('');   // valeur instantanée (affichée dans le champ)
  const [searchQuery, setSearchQuery] = useState('');   // valeur déboncée (envoyée à l'API)
  const debounceRef = useRef(null);
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

  const fetchObjectives = useCallback(async (showRefreshing = false) => {
    if (!user) return;
    if (showRefreshing) setIsRefreshing(true);
    else setLoading(true);

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
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      toast.error('Erreur lors du chargement des objectifs.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
    // Met à jour uniquement l'affichage du champ — pas d'appel API
    setSearchInput(e.target.value);
  };

  // Déclenche la recherche (bouton ou touche Entrée uniquement)
  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleQuickStatusFilter = (status) => {
    setFilters((prev) => ({ ...prev, statusFilter: prev.statusFilter === status ? '' : status }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
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

  const handleStatusChange = (newStatus) => {
    setEditStatus(newStatus);
    if (newStatus === OBJECTIVE_STATUS.ACHIEVED) {
      setEditCompletionRate(100);
    } else if (newStatus === OBJECTIVE_STATUS.NOT_STARTED || newStatus === OBJECTIVE_STATUS.NOT_ACHIEVED) {
      setEditCompletionRate(0);
    }
  };

  const handleRateChange = (newRate) => {
    setEditCompletionRate(newRate);
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

      if (response.data) {
        toast.success(`Objectif mis à jour : ${response.data.status} (${response.data.completionRate}%)`);
      } else {
        toast.success('Objectif mis à jour avec succès.');
      }
      cancelEditing();
      fetchObjectives();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'objectif.');
    } finally {
      setSavingObjective(null);
    }
  };

  // Charger l'historique de progression
  const toggleHistory = async (objective) => {
    const key = `${objective.interviewId}_${objective.objectiveIndex}`;

    if (expandedHistory[key]) {
      setExpandedHistory((prev) => ({ ...prev, [key]: false }));
      return;
    }

    if (progressHistoryCache[key]) {
      setExpandedHistory((prev) => ({ ...prev, [key]: true }));
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await api.get(`/EvaluationInterview/objectives/${objective.interviewId}/history/${objective.objectiveIndex}`);
      if (response.data) {
        setProgressHistoryCache((prev) => ({ ...prev, [key]: response.data }));
        setExpandedHistory((prev) => ({ ...prev, [key]: true }));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('Impossible de charger l\'historique de progression.');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Rendu du Badge de Statut
  const renderStatusBadge = (status) => {
    switch (status) {
      case OBJECTIVE_STATUS.ACHIEVED:
        return (
          <span className="obj-status-badge achieved">
            <FontAwesomeIcon icon={faCheckCircle} />
            {OBJECTIVE_STATUS.ACHIEVED}
          </span>
        );
      case OBJECTIVE_STATUS.IN_PROGRESS:
        return (
          <span className="obj-status-badge in-progress">
            <FontAwesomeIcon icon={faSpinner} spin />
            {OBJECTIVE_STATUS.IN_PROGRESS}
          </span>
        );
      case OBJECTIVE_STATUS.NOT_ACHIEVED:
        return (
          <span className="obj-status-badge not-achieved">
            <FontAwesomeIcon icon={faTimesCircle} />
            {OBJECTIVE_STATUS.NOT_ACHIEVED}
          </span>
        );
      case OBJECTIVE_STATUS.NOT_STARTED:
      default:
        return (
          <span className="obj-status-badge not-started">
            <FontAwesomeIcon icon={faHourglassStart} />
            {status || OBJECTIVE_STATUS.NOT_STARTED}
          </span>
        );
    }
  };

  // Rendu de la barre de progression
  const renderProgressBar = (rate) => {
    const numRate = Number(rate) || 0;
    let fillClass = 'fill-zero';
    if (numRate >= 80) fillClass = 'fill-high';
    else if (numRate >= 40) fillClass = 'fill-mid';
    else if (numRate > 0) fillClass = 'fill-low';

    return (
      <div className="obj-progress-wrapper">
        <div className="obj-progress-track">
          <div
            className={`obj-progress-fill ${fillClass}`}
            style={{ width: `${Math.min(100, Math.max(0, numRate))}%` }}
          />
        </div>
        <span className="obj-progress-percent">{numRate}%</span>
      </div>
    );
  };

  // Rendu de la pagination
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

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="obj-pagination-footer">
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Affichage de <strong>{startItem}</strong> à <strong>{endItem}</strong> sur <strong>{totalCount}</strong> objectifs
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Lignes:</span>
            <select
              className="form-select form-select-sm custom-select"
              style={{ width: '75px', padding: '0.2rem 0.5rem' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link page-link-custom"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                title="Première page"
              >
                &laquo;
              </button>
            </li>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link page-link-custom"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Page précédente"
              >
                &lsaquo;
              </button>
            </li>
            {pages.map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button className="page-link page-link-custom" onClick={() => handlePageChange(page)}>
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link page-link-custom"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Page suivante"
              >
                &rsaquo;
              </button>
            </li>
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link page-link-custom"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                title="Dernière page"
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  const hasActiveFilters = searchInput !== '' || filters.departmentId !== '' || filters.employeeId !== '' || filters.statusFilter !== '';

  if (userLoading || loading) {
    return (
      <Template>
        <div className="objectives-summary-container">
          <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold" style={{ fontSize: '0.95rem' }}>
              Chargement des objectifs et statistiques...
            </p>
          </div>
        </div>
      </Template>
    );
  }

  if (!user) {
    return (
      <Template>
        <div className="objectives-summary-container">
          <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4 text-center">
            <h5 className="alert-heading fw-bold">Accès restreint</h5>
            <p className="mb-0">Vous devez être connecté pour accéder au suivi des objectifs.</p>
          </div>
        </div>
      </Template>
    );
  }

  return (
    <Template>
      <div className="objectives-summary-container">
        {/* Page Header */}
        <div className="obj-header-card mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="obj-header-icon">
                <FontAwesomeIcon icon={faBullseye} />
              </div>
              <div>
                <h4 className="obj-header-title">Récapitulatif & Suivi des Objectifs</h4>
                <p className="obj-header-subtitle">
                  Suivi des performances, indicateurs d'atteinte et gestion de la progression des collaborateurs
                </p>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
              onClick={() => fetchObjectives(true)}
              disabled={isRefreshing}
            >
              <FontAwesomeIcon icon={faSyncAlt} spin={isRefreshing} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          {/* Total Objectifs */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Total Objectifs</span>
              <div className="kpi-icon-box total">
                <FontAwesomeIcon icon={faTasks} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{statistics.totalObjectives}</span>
            </div>
            <div className="kpi-mini-bar">
              <div className="kpi-mini-bar-fill" style={{ width: '100%', backgroundColor: '#6366f1' }} />
            </div>
          </div>

          {/* Atteints */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Atteints</span>
              <div className="kpi-icon-box achieved">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value text-achieved">{statistics.achievedObjectives}</span>
              {statistics.totalObjectives > 0 && (
                <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>
                  ({Math.round((statistics.achievedObjectives / statistics.totalObjectives) * 100)}%)
                </small>
              )}
            </div>
            <div className="kpi-mini-bar">
              <div
                className="kpi-mini-bar-fill"
                style={{
                  width: statistics.totalObjectives > 0 ? `${(statistics.achievedObjectives / statistics.totalObjectives) * 100}%` : '0%',
                  backgroundColor: '#10b981',
                }}
              />
            </div>
          </div>

          {/* En cours */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">En Cours</span>
              <div className="kpi-icon-box in-progress">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value text-in-progress">{statistics.inProgressObjectives}</span>
              {statistics.totalObjectives > 0 && (
                <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>
                  ({Math.round((statistics.inProgressObjectives / statistics.totalObjectives) * 100)}%)
                </small>
              )}
            </div>
            <div className="kpi-mini-bar">
              <div
                className="kpi-mini-bar-fill"
                style={{
                  width: statistics.totalObjectives > 0 ? `${(statistics.inProgressObjectives / statistics.totalObjectives) * 100}%` : '0%',
                  backgroundColor: '#0284c7',
                }}
              />
            </div>
          </div>

          {/* Taux Réussite Global */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Taux Réussite</span>
              <div className="kpi-icon-box achievement-rate">
                <FontAwesomeIcon icon={faTrophy} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value text-rate">{statistics.globalAchievementRate}%</span>
            </div>
            <div className="kpi-mini-bar">
              <div
                className="kpi-mini-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, statistics.globalAchievementRate))}%`,
                  backgroundColor: '#f59e0b',
                }}
              />
            </div>
          </div>

          {/* Taux Moyen */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Taux Moyen</span>
              <div className="kpi-icon-box avg-rate">
                <FontAwesomeIcon icon={faChartBar} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value text-avg">{statistics.averageCompletionRate}%</span>
            </div>
            <div className="kpi-mini-bar">
              <div
                className="kpi-mini-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, statistics.averageCompletionRate))}%`,
                  backgroundColor: '#8b5cf6',
                }}
              />
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="filter-card">
          {/* Quick Filter Status Pills */}
          <div className="quick-status-pills">
            <button
              className={`status-pill-btn ${filters.statusFilter === '' ? 'active' : ''}`}
              onClick={() => handleQuickStatusFilter('')}
            >
              Tous
              <span className="status-pill-count">{statistics.totalObjectives}</span>
            </button>
            <button
              className={`status-pill-btn ${filters.statusFilter === OBJECTIVE_STATUS.ACHIEVED ? 'active' : ''}`}
              onClick={() => handleQuickStatusFilter(OBJECTIVE_STATUS.ACHIEVED)}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-success ms-1" />
              Atteints
              <span className="status-pill-count">{statistics.achievedObjectives}</span>
            </button>
            <button
              className={`status-pill-btn ${filters.statusFilter === OBJECTIVE_STATUS.IN_PROGRESS ? 'active' : ''}`}
              onClick={() => handleQuickStatusFilter(OBJECTIVE_STATUS.IN_PROGRESS)}
            >
              <FontAwesomeIcon icon={faSpinner} className="text-primary ms-1" />
              En cours
              <span className="status-pill-count">{statistics.inProgressObjectives}</span>
            </button>
            <button
              className={`status-pill-btn ${filters.statusFilter === OBJECTIVE_STATUS.NOT_STARTED ? 'active' : ''}`}
              onClick={() => handleQuickStatusFilter(OBJECTIVE_STATUS.NOT_STARTED)}
            >
              <FontAwesomeIcon icon={faHourglassStart} className="text-secondary ms-1" />
              Non commencés
              <span className="status-pill-count">{statistics.notStartedObjectives}</span>
            </button>
            <button
              className={`status-pill-btn ${filters.statusFilter === OBJECTIVE_STATUS.NOT_ACHIEVED ? 'active' : ''}`}
              onClick={() => handleQuickStatusFilter(OBJECTIVE_STATUS.NOT_ACHIEVED)}
            >
              <FontAwesomeIcon icon={faTimesCircle} className="text-danger ms-1" />
              Non atteints
              <span className="status-pill-count">{statistics.notAchievedObjectives}</span>
            </button>
          </div>

          {/* Form Inputs Grid */}
          <div className="row g-3 align-items-end">
            {/* Recherche */}
            <div className="col-lg-4 col-md-6">
              <label className="form-label fw-semibold text-muted d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                <FontAwesomeIcon icon={faSearch} className="filter-label-icon" />
                Recherche par mot-clé
              </label>
              <div className="search-field-row">
                <div className="custom-input-group flex-grow-1">
                  <FontAwesomeIcon icon={faSearch} className="obj-search-input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par employé, description, indicateur..."
                    value={searchInput}
                    onChange={handleSearch}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => {
                        if (debounceRef.current) clearTimeout(debounceRef.current);
                        setSearchInput('');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      title="Effacer la recherche"
                      aria-label="Effacer"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-search-submit"
                  onClick={handleSearchSubmit}
                  title="Lancer la recherche"
                  aria-label="Rechercher"
                >
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </div>
            </div>

            {/* Département */}
            <div className="col-lg-3 col-md-6">
              <label className="form-label fw-semibold text-muted d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                <FontAwesomeIcon icon={faBuilding} className="filter-label-icon" />
                Département
              </label>
              <select
                className="form-select custom-select"
                name="departmentId"
                value={filters.departmentId}
                onChange={handleFilterChange}
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employé */}
            <div className="col-lg-3 col-md-6">
              <label className="form-label fw-semibold text-muted d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                <FontAwesomeIcon icon={faUser} className="filter-label-icon" />
                Employé
              </label>
              <select
                className="form-select custom-select"
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">Tous les employés</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="col-lg-2 col-md-6">
              <button
                className={`btn btn-reset-filters w-100 d-inline-flex align-items-center justify-content-center gap-2 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                title="Réinitialiser tous les filtres"
              >
                <FontAwesomeIcon icon={faUndo} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Table Container Card */}
        <div className="obj-table-card">
          <div className="obj-table-header">
            <h5 className="obj-table-title">Liste des Objectifs</h5>
            <span className="obj-table-count-badge">
              {objectives.length} objectif{objectives.length > 1 ? 's' : ''} affiché{objectives.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="table-responsive">
            <table className="obj-custom-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Collaborateur</th>
                  <th style={{ width: '28%' }}>Objectif & Indicateur</th>
                  <th style={{ width: '10%' }}>Échéance</th>
                  <th style={{ width: '13%' }}>Statut</th>
                  <th style={{ width: '14%' }}>Progression</th>
                  <th style={{ width: '8%' }}>Modifié le</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {objectives.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state-container">
                        <div className="empty-state-icon">
                          <FontAwesomeIcon icon={faBullseye} />
                        </div>
                        <h6 className="empty-state-title">Aucun objectif trouvé</h6>
                        <p className="empty-state-desc">
                          {hasActiveFilters
                            ? 'Aucun résultat ne correspond aux filtres appliqués. Essayez de réinitialiser votre recherche.'
                            : 'Aucun objectif n\'a encore été défini dans les entretiens d\'évaluation.'}
                        </p>
                        {hasActiveFilters && (
                          <button className="btn btn-sm btn-outline-primary mt-3 rounded-pill px-4" onClick={handleResetFilters}>
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  objectives.map((obj) => {
                    const isEditing =
                      editingObjective &&
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
                          {/* Collaborateur (Name, Department, Position) */}
                          <td>
                            <div className="employee-cell">
                              <div
                                className="employee-avatar"
                                style={{ background: getAvatarBackground(obj.employeeName) }}
                              >
                                {getInitials(obj.employeeName)}
                              </div>
                              <div className="d-flex flex-column justify-content-center">
                                <div className="employee-name">{obj.employeeName}</div>
                                <div className="employee-dept-tag">
                                  {obj.position ? `${obj.position}${obj.department ? ` (${obj.department})` : ''}` : (obj.department || '')}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Objectif & Indicateur */}
                          <td>
                            <div className="objective-desc">{obj.description}</div>
                            {obj.indicator && (
                              <div className="objective-indicator">
                                <FontAwesomeIcon icon={faBullseye} className="text-primary me-1" />
                                {obj.indicator}
                              </div>
                            )}
                          </td>

                          {/* Échéance */}
                          <td>
                            <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.825rem' }}>
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-primary opacity-75 me-2" />
                              <span>{obj.dueDate ? new Date(obj.dueDate).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                          </td>

                          {/* Statut */}
                          <td>
                            {isEditing ? (
                              <select
                                className="form-select form-select-sm custom-select"
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

                          {/* Progression */}
                          <td>
                            {isEditing ? (
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <input
                                    type="range"
                                    className="form-range form-range-sm"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={editCompletionRate}
                                    onChange={(e) => handleRateChange(Number(e.target.value))}
                                  />
                                  <span className="fw-bold text-primary" style={{ fontSize: '0.85rem', width: '35px' }}>
                                    {editCompletionRate}%
                                  </span>
                                </div>
                                {/* Presets rapides */}
                                <div className="d-flex gap-1 flex-wrap">
                                  {[0, 25, 50, 75, 100].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      className={`rate-preset-btn ${editCompletionRate === preset ? 'active' : ''}`}
                                      onClick={() => handleRateChange(preset)}
                                    >
                                      {preset}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              renderProgressBar(obj.completionRate)
                            )}
                          </td>

                          {/* Modifié le */}
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.785rem' }}>
                              {obj.lastModified
                                ? new Date(obj.lastModified).toLocaleDateString('fr-FR')
                                : '-'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td>
                            {isEditing ? (
                              <div className="d-flex gap-1 justify-content-center">
                                <button
                                  className="btn btn-sm btn-success p-1 px-2"
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
                                  className="btn btn-sm btn-outline-secondary p-1 px-2"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                  title="Annuler"
                                >
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-1 justify-content-center">
                                <button
                                  className="obj-action-btn"
                                  onClick={() => startEditing(obj)}
                                  title="Modifier le statut"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className={`obj-action-btn btn-history ${isHistoryExpanded ? 'active-history' : ''}`}
                                  onClick={() => toggleHistory(obj)}
                                  title="Historique de progression"
                                  disabled={isLoadingHistory}
                                >
                                  {isLoadingHistory ? (
                                    <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                                  ) : (
                                    <FontAwesomeIcon icon={faHistory} />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Ligne d'historique de progression (expandable) */}
                        {isHistoryExpanded && historyData && (
                          <tr key={`${historyKey}_history`} className="history-expanded-row">
                            <td colSpan="7">
                              <div className="history-timeline-box">
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                  <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <FontAwesomeIcon icon={faHistory} className="text-info" />
                                    Historique de progression de l'objectif
                                  </h6>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>État actuel :</span>
                                    {renderStatusBadge(historyData.currentStatus)}
                                    <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                      {historyData.currentCompletionRate}%
                                    </span>
                                  </div>
                                </div>

                                {historyData.progressHistory && historyData.progressHistory.length > 0 ? (
                                  <div className="mt-2">
                                    {historyData.progressHistory.map((entry, i) => (
                                      <div key={i} className="timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-date">
                                          <FontAwesomeIcon icon={faClock} className="me-1" />
                                          {new Date(entry.date).toLocaleDateString('fr-FR')} à{' '}
                                          {new Date(entry.date).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </div>
                                        <div className="timeline-change-card">
                                          {renderStatusBadge(entry.oldStatus)}
                                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            ({entry.oldCompletionRate}%)
                                          </span>
                                          <FontAwesomeIcon icon={faArrowRight} className="text-muted mx-1" style={{ fontSize: '0.75rem' }} />
                                          {renderStatusBadge(entry.newStatus)}
                                          <span className="fw-bold text-primary" style={{ fontSize: '0.8rem' }}>
                                            ({entry.newCompletionRate}%)
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted mb-0 py-2" style={{ fontSize: '0.85rem' }}>
                                    Aucun changement précédent enregistré. L'historique conserve le détail des modifications futures.
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

          {/* Footer & Pagination */}
          {totalPages > 0 && renderPagination()}
        </div>
      </div>
    </Template>
  );
}

export default ObjectivesSummary;
