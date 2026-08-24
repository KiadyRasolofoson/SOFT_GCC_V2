import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import '../../../assets/css/Evaluations/SalaryListPlanning.css'; // Styles spécifiques
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EvaluationConfiguration from './EvaluationConfiguration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faUndo, faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Styles pour les colonnes triables
const sortableStyles = {
  sortable: {
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    paddingRight: '20px',
    transition: 'background-color 0.2s ease',
  },
  sortableActive: {
    backgroundColor: 'rgba(63, 81, 181, 0.05)',
  },
  sortIcon: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#aaa',
    fontSize: '0.8rem',
    transition: 'transform 0.2s ease, color 0.2s ease',
  },
  sortIconActive: {
    color: '#3f51b5',
    fontSize: '0.9rem',
  }
};

function SalaryListPlanning() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ position: '', department: '' });
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false); // State for automatic reminders

  const [emailSent, setEmailSent] = useState(false); // State for email sent status
  
  // Nouveaux états pour les animations et chargement
  const [planningLoading, setPlanningLoading] = useState(false);

  const [evaluationDetails, setEvaluationDetails] = useState({
    evaluationType: '',
    supervisors: [], // Array pour stocker les superviseurs sélectionnés
    startDate: '',
    endDate: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [planningError, setPlanningError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [dateError, setDateError] = useState(''); // State for date validation error

  //état pour gérer le superviseur en cours de sélection
  const [currentSupervisor, setCurrentSupervisor] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [evaluationTypes, setEvaluationTypes] = useState([]);

  const [showConfiguration, setShowConfiguration] = useState(false);

  // État pour le tri
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });

  // Nouveaux états pour les évaluations planifiées et l'annulation
  const [plannedEvaluations, setPlannedEvaluations] = useState([]);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [evaluationToCancel, setEvaluationToCancel] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [loadingCancel, setLoadingCancel] = useState(false);
  
  // État pour basculer entre les vues
  const [activeView, setActiveView] = useState('employees'); // 'employees' ou 'evaluations'

  // Nouveaux états pour gérer les conflits d'évaluations
  const [employeesWithConflict, setEmployeesWithConflict] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Variable pour la date d'aujourd'hui
  const today = new Date().toISOString().split('T')[0];



  // Gestion du changement de superviseur actuel
  const handleCurrentSupervisorChange = (e) => {
    setCurrentSupervisor(e.target.value);
  };

  // Ajout d'un superviseur à la liste
  const handleAddSupervisor = () => {
    if (!currentSupervisor) return; // Ne rien faire si aucun superviseur n'est sélectionné

    // Vérifier si le superviseur n'est pas déjà dans la liste
    if (!evaluationDetails.supervisors.includes(currentSupervisor)) {
      // S'assurer que le superviseur existe dans la liste des superviseurs disponibles
      const supervisorExists = supervisors.some(sup => String(sup.id) === String(currentSupervisor));

      if (supervisorExists) {
        setEvaluationDetails(prev => ({
          ...prev,
          supervisors: [...prev.supervisors, currentSupervisor]
        }));
        setCurrentSupervisor(''); // Réinitialiser le sélecteur
      } else {
        alert('Superviseur non trouvé dans la liste');
      }
    } else {
      alert('Ce superviseur est déjà dans la liste');
    }
  };

  // Retirer un superviseur de la liste
  const handleRemoveSupervisor = (supervisorId) => {
    setEvaluationDetails(prev => ({
      ...prev,
      supervisors: prev.supervisors.filter(id => id !== supervisorId)
    }));
  };

  const fetchSupervisors = async () => {
    try {
    const response = await api.get('/User/managers-directors');
      setSupervisors(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des superviseurs :', error);
    }
  };

  const fetchEvaluationTypes = async () => {
    try {
    const response = await api.get('/EvaluationPlanning/evaluation-types');
      setEvaluationTypes(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des types d'évaluation :", error);
    }
  };

  const fetchEmployeesWithoutEvaluations = async () => {
    setLoading(true); // Start loading
    try {
      const response = await api.get(
        '/EvaluationPlanning/employees-without-evaluations-paginated',
        {
          params: {
            pageNumber: currentPage,
            pageSize: pageSize,
            position: filters.position,
            department: filters.department,
            search: searchQuery,
            sortBy: sortConfig.key,
            sortDirection: sortConfig.direction
          },
        }
      );
      setEmployees(response.data.employees);
      setFilteredEmployees(response.data.employees);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Erreur lors de la récupération des employés sans évaluation :', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [positionsRes, departmentsRes] = await Promise.all([
        api.get('/EvaluationPlanning/positions'),
        api.get('/EvaluationPlanning/departments'),
      ]);
      setPositions(positionsRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des filtres :', error);
    }
  };

  // Fonction pour récupérer les évaluations planifiées
  const fetchPlannedEvaluations = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        '/EvaluationPlanning/planned-evaluations',
        {
          params: {
            pageNumber: currentPage,
            pageSize: pageSize,
            position: filters.position,
            department: filters.department,
            search: searchQuery,
            sortBy: sortConfig.key,
            sortDirection: sortConfig.direction
          },
        }
      );
      setPlannedEvaluations(response.data.evaluations);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations planifiées :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'employees') {
      fetchEmployeesWithoutEvaluations();
    } else {
      fetchPlannedEvaluations();
    }
    fetchFilterOptions();
    fetchEvaluationTypes();
    fetchSupervisors();
  }, [filters, searchQuery, currentPage, pageSize, sortConfig, activeView]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase().trim());
    setCurrentPage(1); // Réinitialiser à la première page lors d'une recherche
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = value ? parseInt(value, 10) : '';
    setFilters((prev) => ({ ...prev, [name]: parsedValue }));
    setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de filtre
  };

  // Ajout de la fonction de réinitialisation des filtres
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({ position: '', department: '' });
    setCurrentPage(1); // Réinitialiser à la première page
  };

  // Fonction pour gérer le tri
  const handleSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    
    setSortConfig({ key, direction });
    setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de tri
  };

  // Fonction pour obtenir l'icône de tri appropriée
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FontAwesomeIcon icon={faSort} style={{ fontSize: '0.8rem', color: '#aaa' }} />;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <FontAwesomeIcon icon={faSortUp} style={{ fontSize: '0.9rem', color: '#3f51b5' }} />
      : <FontAwesomeIcon icon={faSortDown} style={{ fontSize: '0.9rem', color: '#3f51b5' }} />;
  };

  // Fonction pour obtenir le style d'une colonne triable
  const getSortableStyle = (columnName) => {
    return {
      cursor: 'pointer',
      position: 'relative',
      ...(sortConfig.key === columnName ? { backgroundColor: 'rgba(63, 81, 181, 0.05)' } : {})
    };
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmployeeIds = filteredEmployees.map((emp) => emp.employeeId);
      setSelectedEmployees(allEmployeeIds);
    }
    setSelectAll(!selectAll);
  };

  const handleOpenModal = () => {
    // Vérifier si parmi les employés sélectionnés, certains ont déjà une évaluation planifiée
    const employeesWithPlannedEval = selectedEmployees
      .map(id => filteredEmployees.find(emp => emp.employeeId === id))
      .filter(emp => emp && emp.plannedEvaluationId);
    
    if (employeesWithPlannedEval.length > 0) {
      setEmployeesWithConflict(employeesWithPlannedEval);
      setShowConflictModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEvaluationDetails({ evaluationType: '', supervisor: '', startDate: '', endDate: '' });
    setPlanningError(''); // Reset planning error
    setDateError(''); // Reset date error
  };

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
      }
    }

    return error;
  };

  // Modification de handleEvaluationDetailsChange pour ne pas gérer les superviseurs
  const handleEvaluationDetailsChange = (e) => {
    const { name, value } = e.target;
    const newDetails = { ...evaluationDetails, [name]: value };
    setEvaluationDetails(newDetails);

    // Validation des dates
    if (name === 'startDate' || name === 'endDate') {
      const error = validateDates(newDetails.startDate, newDetails.endDate);
      setDateError(error);
    }
  };

  const handleSendReminderEmail = async () => {
    try {
      await api.post('/EvaluationPlanning/send-reminder', {
        employees: selectedEmployees,
      });
      alert('Rappel envoyé avec succès !'); // Optional success message
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de rappel :', error);
      alert('Une erreur est survenue lors de l\'envoi du rappel.');
    }
  };


  const handleMassPlanning = async () => {
    const error = validateDates(evaluationDetails.startDate, evaluationDetails.endDate);
    if (error) {
      setPlanningError(error);
      return;
    }

    if (!evaluationDetails.evaluationType || evaluationDetails.supervisors.length === 0) {
      toast.error('Veuillez remplir tous les champs avant de planifier. Vous devez sélectionner au moins un superviseur.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      setPlanningLoading(true);
      
      const payload = selectedEmployees.map((employeeId) => ({
        employeeId: employeeId,
        evaluationTypeId: parseInt(evaluationDetails.evaluationType, 10),
        supervisorIds: evaluationDetails.supervisors.map(id => parseInt(id, 10)),
        startDate: evaluationDetails.startDate,
        endDate: evaluationDetails.endDate,
        enableReminders: autoReminderEnabled
      }));

      const response = await api.post('/EvaluationPlanning/create-evaluation', payload);
      
      if (autoReminderEnabled) {
        try {
        await api.post('/EvaluationPlanning/configure-reminders', {
            evaluationIds: response.data.map(res => res.evaluationId),
            isEnabled: true
          });
        } catch (reminderError) {
          console.error("Erreur lors de la configuration des rappels automatiques:", reminderError);
        }
      }
      
      // Fermer la modal de planification
      setShowModal(false);
      
      // Afficher une notification toast de succès
      toast.success('Les évaluations ont été planifiées avec succès.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (error) {
      console.error('Erreur lors de la planification :', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      setPlanningError('Une erreur est survenue lors de la planification.');
    } finally {
      setPlanningLoading(false);
    }
  };

  // Ajout d'une fonction manquante dans votre code original
  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
  };

  const handleOpenConfiguration = () => {
    setShowConfiguration(true);
  };

  const handleBackToSelection = () => {
    setShowConfiguration(false);
  };

  const handleConfigurationComplete = async () => {
    try {
      if (autoReminderEnabled) {
        console.log("Configuration des rappels automatiques pour les évaluations");
        
        // Afficher une notification toast
        toast.success('Les rappels automatiques ont été activés pour ces évaluations.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
      setShowConfiguration(false);
      setSelectedEmployees([]);
      fetchEmployeesWithoutEvaluations();
    } catch (error) {
      console.error("Erreur lors de la configuration des rappels:", error);
      toast.error("Une erreur est survenue lors de la configuration des rappels automatiques.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Fonction pour annuler une évaluation
  const handleCancelEvaluation = async (evaluationId) => {
    setEvaluationToCancel(evaluationId);
    setShowCancelConfirmModal(true);
  };

  // Fonction pour confirmer l'annulation
  const confirmCancelEvaluation = async () => {
    setLoadingCancel(true);
    setCancelError('');
    try {
    await api.put(`/EvaluationPlanning/cancel-evaluation/${evaluationToCancel}`);
      setCancelSuccess(true);
      setTimeout(() => {
        setShowCancelConfirmModal(false);
        setCancelSuccess(false);
        fetchPlannedEvaluations(); // Rafraîchir la liste après annulation
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'évaluation :', error);
      setCancelError('Une erreur est survenue lors de l\'annulation de l\'évaluation.');
    } finally {
      setLoadingCancel(false);
    }
  };

  // Fermer la modal de confirmation d'annulation
  const closeCancelConfirmModal = () => {
    setShowCancelConfirmModal(false);
    setEvaluationToCancel(null);
    setCancelError('');
  };

  return (
    <Template>
      <div className="salary-list-planning">
        <h4 className="title">Planification des évaluations</h4>

        {showConfiguration ? (
          <EvaluationConfiguration
            selectedEmployees={selectedEmployees}
            employees={filteredEmployees.filter(emp => selectedEmployees.includes(emp.employeeId))}
            onBack={handleBackToSelection}
            onComplete={handleConfigurationComplete}
            onRemoveEmployee={handleRemoveEmployee}
            autoReminderEnabled={autoReminderEnabled}
          />
        ) : (
          <>
            
            {/* Barre de recherche et filtres */}
            <div className="filters card p-3 mb-4">
              <div className="row align-items-center g-3"> {/* Utilisation de la grille Bootstrap et gap g-3 */}
                {/* Champ de recherche */}
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un employé..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                {/* Filtre par Poste */}
                <div className="col-md-3">
                  <select
                    name="position"
                    className="form-control"
                    value={filters.position}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les postes</option>
                    {positions.map((pos) => (
                      <option key={pos.positionId} value={String(pos.positionId)}>
                        {pos.positionName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Filtre par Département */}
                <div className="col-md-3">
                  <select
                    name="department"
                    className="form-control"
                    value={filters.department}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les départements</option>
                    {departments.map((dep) => (
                      <option key={dep.departmentId} value={String(dep.departmentId)}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Bouton de réinitialisation */}
                <div className="col-md-auto">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleResetFilters}
                    title="Réinitialiser les filtres"
                  >
                    <FontAwesomeIcon icon={faUndo} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tableau des employés */}
            <div className="card">
              <div className="card-body">
                {/* Toggle for Automatic Reminders - Switched to Bootstrap Toggle */}
                <div className="form-group reminder-toggle">
                  <div className="custom-switch-container">
                    <div className="custom-control custom-switch custom-switch-lg">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="autoReminderToggle"
                        checked={autoReminderEnabled}
                        onChange={() => setAutoReminderEnabled(!autoReminderEnabled)}
                      />
                      <label
                        className="custom-control-label"
                        htmlFor="autoReminderToggle"
                        style={{ cursor: 'pointer' }} /* Curseur uniquement sur le toggle */
                      />
                    </div>
                    <span className="toggle-text">Activer les rappels automatiques</span>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center">Chargement des employés...</div>
                ) : (
                  <>
                    <table className="table table-bordered">
                      <thead className="thead-light">
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th style={getSortableStyle('name')} onClick={() => handleSort('name')}>
                            Nom {getSortIcon('name')}
                          </th>
                          <th style={getSortableStyle('position')} onClick={() => handleSort('position')}>
                            Poste {getSortIcon('position')}
                          </th>
                          <th style={getSortableStyle('department')} onClick={() => handleSort('department')}>
                            Département {getSortIcon('department')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <tr key={employee.employeeId} className={employee.plannedEvaluationId ? "has-planned-evaluation" : ""}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(employee.employeeId)}
                                  onChange={() => handleSelectEmployee(employee.employeeId)}
                                />
                                {employee.plannedEvaluationId && (
                                  <span className="badge bg-warning ms-2" title={`Évaluation ${employee.plannedEvaluationType} déjà planifiée`}>
                                    Planifiée
                                  </span>
                                )}
                              </td>
                              <td>{employee.firstName} {employee.lastName}</td>
                              <td>{employee.position}</td>
                              <td>{employee.department}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              Aucun employé trouvé.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="text-right mt-3">
                      <button 
                        className="btn btn-primary" 
                        onClick={handleOpenConfiguration} 
                        disabled={selectedEmployees.length === 0}
                      >
                        Planifier
                      </button>
                    </div>

                    <div className="pagination-controls">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </button>
                      <span>
                        Page {currentPage} sur {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </button>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={5}>5 par page</option>
                        <option value={10}>10 par page</option>
                        <option value={20}>20 par page</option>
                        <option value={50}>50 par page</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            {emailSent && <p>Email envoyé avec succès !</p>} {/* Indication d'email envoyé */}
          </>
        )}
      </div>

      {/* Modal de confirmation d'annulation */}
      {showCancelConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation d'annulation</h5>
                <button type="button" className="close" onClick={closeCancelConfirmModal}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {cancelSuccess ? (
                  <div className="alert alert-success">
                    L'évaluation a été annulée avec succès.
                  </div>
                ) : (
                  <>
                    <p>Êtes-vous sûr de vouloir annuler cette évaluation ?</p>
                    <p>Cette action ne peut pas être annulée.</p>
                    {cancelError && <div className="alert alert-danger">{cancelError}</div>}
                  </>
                )}
              </div>
              <div className="modal-footer">
                {!cancelSuccess && (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={closeCancelConfirmModal}>
                      Fermer
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={confirmCancelEvaluation}
                      disabled={loadingCancel}
                    >
                      {loadingCancel ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
      
      {/* Modal de configuration des évaluations */}
      {showModal && (
        <div className="modal fade show"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingRight: '17px',
            overflow: 'scroll'
          }}
          tabIndex="-1"
          onClick={(e) => {
            // Fermer le modal si on clique en dehors du contenu
            if (e.target.className.includes('modal fade show')) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="mdi mdi-calendar-check"></i> {currentUser ? 'Modifier' : 'Ajouter'} une planification
                </h5>
                <button type="button" className="close text-dark" onClick={() => setShowModal(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {planningLoading ? (
                  <div className="d-flex justify-content-center align-items-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row mb-3">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label className="form-label">
                            <i className="mdi mdi-format-list-bulleted"></i> Type d'évaluation
                          </label>
                          <select
                            className="form-control form-select"
                            value={evaluationDetails.evaluationType}
                            onChange={(e) =>
                              setEvaluationDetails({ ...evaluationDetails, evaluationType: e.target.value })
                            }
                            required
                          >
                            <option value="">Sélectionner un type d'évaluation</option>
                            {evaluationTypes.map((type) => (
                              <option key={type.evaluationTypeId} value={type.evaluationTypeId}>
                                {type.designation}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">
                            <i className="mdi mdi-calendar-start"></i> Date de début
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={evaluationDetails.startDate}
                            min={today}
                            onChange={(e) =>
                              setEvaluationDetails({ ...evaluationDetails, startDate: e.target.value })
                            }
                            required
                          />
                          {dateError && <div className="text-danger">{dateError}</div>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">
                            <i className="mdi mdi-calendar-end"></i> Date de fin
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={evaluationDetails.endDate}
                            min={evaluationDetails.startDate || today}
                            onChange={(e) =>
                              setEvaluationDetails({ ...evaluationDetails, endDate: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label className="form-label d-flex align-items-center mb-2">
                            <i className="mdi mdi-account-supervisor-circle me-2"></i> Superviseurs
                          </label>
                          <div className="input-group mb-3">
                            <select
                              className="form-control"
                              value={currentSupervisor}
                              onChange={handleCurrentSupervisorChange}
                            >
                              <option value="">Sélectionnez un superviseur</option>
                              {supervisors.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                  {supervisor.firstName} {supervisor.lastName}
                                </option>
                              ))}
                            </select>
                            <div className="input-group-append">
                              <button 
                                className="btn btn-outline-primary" 
                                type="button" 
                                onClick={handleAddSupervisor}
                              >
                                <i className="mdi mdi-plus"></i> Ajouter
                              </button>
                            </div>
                          </div>
                          
                          <div className="selected-supervisors mt-3">
                            {evaluationDetails.supervisors.length > 0 ? (
                              <ul className="list-group">
                                {evaluationDetails.supervisors.map((supervisorId) => {
                                  const supervisor = supervisors.find(sup => String(sup.id) === String(supervisorId));
                                  return supervisor ? (
                                    <li key={supervisorId} className="list-group-item d-flex justify-content-between align-items-center">
                                      <span>{supervisor.firstName} {supervisor.lastName}</span>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleRemoveSupervisor(supervisorId)}
                                      >
                                        <i className="mdi mdi-close"></i>
                                      </button>
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            ) : (
                              <div className="alert alert-warning">
                                <i className="mdi mdi-alert"></i> Aucun superviseur sélectionné
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {planningError && (
                      <div className="alert alert-danger mt-3">
                        <i className="mdi mdi-alert-circle"></i> {planningError}
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-fw" onClick={() => setShowModal(false)}>
                  <i className="mdi mdi-close-circle"></i> Fermer
                </button>
                {!planningLoading && (
                  <button 
                    type="button" 
                    className="btn btn-success btn-fw" 
                    onClick={handleMassPlanning}
                    disabled={planningLoading}
                  >
                    {planningLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Planification en cours...</>
                    ) : (
                      <><i className="mdi mdi-content-save me-1"></i>Planifier les évaluations</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </Template>
  );
}

export default SalaryListPlanning;