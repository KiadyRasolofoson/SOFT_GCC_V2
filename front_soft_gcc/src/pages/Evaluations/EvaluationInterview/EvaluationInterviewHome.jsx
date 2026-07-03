import { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import '../../../assets/css/Evaluations/SalaryListPlanning.css';
import { formatDate, isValidInterviewDate, compareDates } from '../../../services/Evaluations/utils';
import ParticipantsSelector from './ParticipantSelector';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEdit, faSort, faSortUp, faSortDown, faUndo } from '@fortawesome/free-solid-svg-icons';
import PermissionService from '../../../services/PermissionService';



function EvaluationInterviewHome() {
  const navigate = useNavigate();
  const { user, hasPermission, loading: userLoading } = useUser();

  // Initialiser la variable globale pour éviter tout problème de persistance entre sessions
  useEffect(() => {
    // Réinitialisation de la variable globale au chargement du composant
    window.selectedEmployeeForModal = undefined;
    console.log("Variable globale selectedEmployeeForModal initialisée au démarrage");
  }, []);

  // Constantes
  const INTERVIEW_STATUS = {
    PLANNED: 10,
    IN_PROGRESS: 20,
    PENDING_VALIDATION: 25,
    COMPLETED: 30,
    REJECTED: 40,
    CANCELLED: 50
  };

  // États de base
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ position: '', department: '' });
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [evaluationDetails, setEvaluationDetails] = useState({
    evaluationId: '',
    scheduledDate: '',
    participants: [],
    selectedEmployee: null,
    sendEmails: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  // État pour le tri
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });

  const [loadingActions, setLoadingActions] = useState({});

  // Fonction de réinitialisation des filtres
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({ position: '', department: '' });
    setCurrentPage(1);
  };

  // Vérification des permissions fonctionnelles
  const canImportEvaluation = PermissionService.hasFunctionalPermission(hasPermission, 'IMPORT_EVALUATION');
  const canValidateAsManager = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_MANAGER');
  const canValidateAsDirector = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_DIRECTOR');

  // Gestion centralisée des erreurs - Fonction de base qui ne dépend d'aucune autre fonction
  const handleError = useCallback((error, customMsg = "Une erreur est survenue. Veuillez réessayer.") => {
    console.error(error);
    const message = error.response?.data?.message || customMsg;
    toast.error(message);
  }, []);

  // ====== FONCTIONS DE RÉCUPÉRATION DE DONNÉES ======

  // Récupération des participants
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/User/managers-directors');
      setParticipantsList(response.data);
    } catch (error) {
      handleError(error, "Erreur lors de la récupération des participants.");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Récupération des employés sans évaluations
  const fetchEmployeesWithoutEvaluations = useCallback(async () => {
    if (!user) return; // Ne pas charger si l'utilisateur n'est pas disponible

    setLoading(true);
    try {
      const response = await api.get('/EvaluationInterview/employees-finished-evaluations-paginated', {
        params: {
          pageNumber: currentPage,
          pageSize: pageSize,
          position: filters.position,
          department: filters.department,
          search: searchQuery,
          sortBy: sortConfig.key,
          sortDirection: sortConfig.direction
        },
      });
      setEmployees(response.data.employees);
      setFilteredEmployees(response.data.employees);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      handleError(error, "Erreur lors de la récupération des employés sans évaluation.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, searchQuery, sortConfig, handleError, user]);

  // Récupération des options de filtre
  const fetchFilterOptions = useCallback(async () => {
    if (!user) return; // Ne pas charger si l'utilisateur n'est pas disponible

    try {
      const [positionsRes, departmentsRes] = await Promise.all([
        api.get('/EvaluationInterview/positions'),
        api.get('/EvaluationInterview/departments'),
      ]);
      setPositions(positionsRes.data);
      setDepartments(departmentsRes.data);
    } catch (error) {
      handleError(error, "Erreur lors de la récupération des filtres.");
    }
  }, [handleError, user]);

  // ====== EFFETS ======

  useEffect(() => {
    if (!userLoading && user) {
      fetchParticipants();
    }
  }, [fetchParticipants, userLoading, user]);

  // Effet pour forcer le rafraîchissement des données après une validation d'entretien
  useEffect(() => {
    // Vérifier si on a un flag indiquant qu'il faut rafraîchir les données
    const needsRefresh = localStorage.getItem('interviewStatusUpdated') === 'true';

    if (needsRefresh) {
      console.log("Rafraîchissement des données après mise à jour d'un entretien");
      fetchEmployeesWithoutEvaluations();
      localStorage.removeItem('interviewStatusUpdated'); // Nettoyer le flag
    }
  }, [fetchEmployeesWithoutEvaluations]);

  // Effet principal pour charger les données
  useEffect(() => {
    if (!userLoading && user) {
      fetchEmployeesWithoutEvaluations();
      fetchFilterOptions();
    }
  }, [filters, searchQuery, currentPage, pageSize, sortConfig, fetchEmployeesWithoutEvaluations, fetchFilterOptions, userLoading, user]);

  // ====== GESTION DES ÉVÉNEMENTS ======

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1); 
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    const parsedValue = value ? parseInt(value, 10) : '';
    setFilters((prev) => ({ ...prev, [name]: parsedValue }));
    setCurrentPage(1); 
  }, []);

  // Fonction pour gérer le tri
  const handleSort = useCallback((key) => {
    let direction = 'ascending';

    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }

    setSortConfig({ key, direction });
    setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de tri
  }, [sortConfig]);

  // Fonction pour obtenir l'icône de tri appropriée
  const getSortIcon = useCallback((columnName) => {
    if (sortConfig.key !== columnName) {
      return <FontAwesomeIcon icon={faSort} style={{ fontSize: '0.8rem', color: '#aaa' }} />;
    }

    return sortConfig.direction === 'ascending'
      ? <FontAwesomeIcon icon={faSortUp} style={{ fontSize: '0.9rem', color: '#D4AC0D' }} />
      : <FontAwesomeIcon icon={faSortDown} style={{ fontSize: '0.9rem', color: '#D4AC0D' }} />;
  }, [sortConfig]);

  // Fonction pour obtenir le style d'une colonne triable
  const getSortableStyle = useCallback((columnName) => {
    return {
      cursor: 'pointer',
      position: 'relative',
      ...(sortConfig.key === columnName ? { backgroundColor: 'rgba(212, 172, 13, 0.05)' } : {})
    };
  }, [sortConfig]);

  const handleOpenModal = useCallback(async (employeeId) => {
    if (!employeeId) {
      toast.error('Veuillez sélectionner un employé avant de planifier.');
      return;
    }

    // Trouver l'employé dans la liste
    const employee = employees.find(emp => emp.employeeId === employeeId);

    console.log("Employé sélectionné dans la liste:", employee);

    if (!employee || employee.evaluationDate) {
      toast.error("Cet employé a déjà une date d'évaluation planifiée.");
      return;
    }

    try {
      // Stocker l'employé dans la variable globale
      if (employee) {
        // Normalisation garantie : s'assurer que toutes les propriétés requises sont présentes
        const normalizedEmployee = {
          employeeId: employee.employeeId || employee.EmployeeId,
          firstName: employee.firstName || employee.FirstName,
          lastName: employee.lastName || employee.LastName,
          position: employee.position || employee.Position,
          department: employee.department || employee.Department,
          evaluationId: employee.evaluationId || employee.EvaluationId,
        };
        window.selectedEmployeeForModal = normalizedEmployee;
        console.log("Employé normalisé stocké globalement:", window.selectedEmployeeForModal);
      } else {
        console.error("handleOpenModal: Aucun employé trouvé pour l'ID", employeeId);
        window.selectedEmployeeForModal = null;
      }

      // Convertir l'ID de l'employé en nombre
      const employeeIdNumber = Number(employeeId);

      // Ajouter les participants par défaut (s'il y en a)
      const defaultParticipants = participantsList
        .filter(participant => participant.isDefault)
        .map(participant => {
          const id = participant.employeeId || participant.id;
          return id ? Number(id) : null;
        })
        .filter(id => id !== null && !isNaN(id) && id !== employeeIdNumber);

      // S'assurer que l'employé concerné est en premier dans la liste
      const allParticipants = [employeeIdNumber, ...defaultParticipants];

      console.log("Liste finale des participants:", allParticipants);

      // Définir evaluationDetails
      setEvaluationDetails({
        evaluationId: employee.evaluationId,
        scheduledDate: today,
        participants: allParticipants,
        selectedEmployee: window.selectedEmployeeForModal, // Synchroniser avec la variable globale
      });

      // Ouvrir le modal
      setShowModal(true);
    } catch (error) {
      console.error("Erreur lors de l'ouverture du modal:", error);
      handleError(error, "Erreur lors de l'ouverture du modal de planification.");
    }
  }, [employees, today, participantsList, toast, handleError]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    // Réinitialiser la variable globale pour éviter les conflits futurs
    window.selectedEmployeeForModal = undefined;
    console.log("Variable globale selectedEmployeeForModal réinitialisée");

    setEvaluationDetails({
      evaluationId: '',
      scheduledDate: '',
      participants: [],
      selectedEmployee: null,
    });
  }, []);

  const handleEvaluationDetailsChange = useCallback(({ name, value }) => {
    setEvaluationDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Fonction pour gérer l'état de chargement des actions
  const setActionLoading = (employeeId, isLoading) => {
    setLoadingActions(prev => ({
      ...prev,
      [employeeId]: isLoading
    }));
  };

  // Fonction pour vérifier si une action est en cours de chargement
  const isActionLoading = (employeeId) => {
    return loadingActions[employeeId] === true;
  };

  const handleMassPlanning = useCallback(async () => {
    try {
      // Récupérer à nouveau l'employé sélectionné pour être sûr
      const selectedEmployee = evaluationDetails.selectedEmployee || window.selectedEmployeeForModal;

      console.log("Employé sélectionné pour la planification:", selectedEmployee);

      if (!selectedEmployee) {
        toast.error("Aucun employé sélectionné pour la planification");
        return;
      }

      // Utilisez l'ID d'évaluation de l'employé, pas celui de evaluationDetails
      const correctEvaluationId = selectedEmployee?.evaluationId || selectedEmployee?.EvaluationId;

      console.log("ID d'évaluation depuis evaluationDetails:", evaluationDetails.evaluationId);
      console.log("ID d'évaluation depuis l'employé:", correctEvaluationId);

      if (!correctEvaluationId) {
        toast.error("Impossible de trouver l'ID d'évaluation pour cet employé");
        return;
      }

      // Extraire l'employeeId (l'employé concerné par l'évaluation)
      const employeeId = selectedEmployee.employeeId || selectedEmployee.EmployeeId;

      if (!employeeId) {
        toast.error("Impossible de déterminer l'ID de l'employé concerné");
        return;
      }

      // Filtrer les participants pour exclure l'employé concerné
      // (il sera envoyé dans un champ séparé)
      const otherParticipants = evaluationDetails.participants.filter(
        participantId => participantId !== employeeId
      );

      console.log("ID de l'employé concerné:", employeeId);
      console.log("Autres participants:", otherParticipants);

      const payload = {
        evaluationId: parseInt(correctEvaluationId),
        scheduledDate: evaluationDetails.scheduledDate,
        participants: otherParticipants,
        employeeId: employeeId,
        sendEmails: evaluationDetails.sendEmails
      };

      console.log("Payload final pour la planification:", payload);

      if (!Array.isArray(otherParticipants)) {
        toast.error("Liste de participants invalide.");
        return;
      }

      await api.post(
        '/EvaluationInterview/schedule-interview',
        payload
      );

      toast.success('Entretien planifié avec succès.');
      setShowModal(false);
      // Réinitialiser la variable globale après planification
      window.selectedEmployeeForModal = undefined;
      fetchEmployeesWithoutEvaluations(); // Rafraîchir la liste après planification
    } catch (error) {
      handleError(error, "Erreur lors de la planification de l'entretien.");
    }
  }, [evaluationDetails, handleError, fetchEmployeesWithoutEvaluations]);

  const startInterview = useCallback(async (employeeId) => {
    try {
      setActionLoading(employeeId, true);
      console.log(`Démarrage de l'entretien pour l'employé ID: ${employeeId}`);

      // Récupérer d'abord l'employé complet pour avoir son evaluationId
      const employee = employees.find(emp => emp.employeeId === employeeId);
      console.log("Données complètes de l'employé:", employee);
      console.log("ID d'évaluation associé à l'employé:", employee?.evaluationId);

      // Étape 1: Récupérer l'interview par participant
      console.log("Récupération de l'entretien...");
      const interviewResponse = await api.get(
        `/EvaluationInterview/get-interview-by-participant/${employeeId}`
      );

      let interview = interviewResponse.data;
      console.log("Entretien récupéré par API:", interview);

      // Vérification de sécurité: si l'entretien ne correspond pas à l'évaluation attendue
      if (interview && employee && interview.evaluationId !== employee.evaluationId) {
        console.error("ERREUR: L'entretien récupéré ne correspond pas à l'évaluation de l'employé");
        console.error(`ID évaluation attendu: ${employee.evaluationId}, ID évaluation reçu: ${interview.evaluationId}`);

        // Correction manuelle temporaire pour éviter le problème
        console.warn("Application d'une correction manuelle de l'evaluationId de l'entretien");
        interview = {
          ...interview,
          evaluationId: employee.evaluationId
        };
        console.log("Entretien après correction:", interview);
      }

      if (!interview || !interview.interviewId) {
        console.error("Aucun entretien trouvé pour cet employé.");
        toast.error("Aucun entretien trouvé pour cet employé.");
        setActionLoading(employeeId, false);
        return;
      }

      const { interviewId } = interview;
      console.log(`ID d'entretien trouvé: ${interviewId}`);

      // Déterminer la destination selon le rôle et le statut de l'entretien
      const isManager = user?.role === 'Manager' || user?.permissions?.some(p => p.name === 'VALIDATE_AS_MANAGER');
      const isDirector = user?.role === 'Director' || user?.permissions?.some(p => p.name === 'VALIDATE_AS_DIRECTOR');
      const isRH = user?.permissions?.some(p => p.name === 'IMPORT_EVALUATION');
      
      // Si l'entretien est en attente de validation (statut 25) et l'utilisateur est manager ou directeur
      if (interview.status === 25 && (isManager || isDirector)) {
        console.log("Redirection vers la page de détails pour validation");
        // Rediriger vers la page de détails de l'entretien pour validation
        navigate("/evaluation-details", { 
          state: { 
            interview, 
            employeeId,
            mode: "validation" 
          } 
        });
        setActionLoading(employeeId, false);
        return;
      }
      
      // Pour les RH ou si l'entretien est encore à l'état initial
      if (isRH || interview.status < 25) {
        // Étape 2: Démarrer l'entretien (seulement si statut < 25)
        if (interview.status < 25) {
          console.log(`Appel de l'API pour démarrer l'entretien ID: ${interviewId}`);
          const startResponse = await api.put(`/EvaluationInterview/start-interview/${interviewId}`);
          console.log("Réponse au démarrage de l'entretien:", startResponse);
        }

        toast.success(interview.status < 25 ? 'Entretien démarré avec succès.' : 'Chargement des données de l\'entretien.');

        // Étape 3: Redirection vers la page de saisie de l'entretien
        console.log("Redirection vers la page d'entretien avec données:", { interview, employeeId });
        navigate("/validation", { state: { interview, employeeId } });
      }
      setActionLoading(employeeId, false);
    } catch (error) {
      console.error("Erreur complète:", error);
      setActionLoading(employeeId, false);

      if (error.response) {
        console.error("Détails de la réponse d'erreur:", error.response.status, error.response.data);
      }

      handleError(error, "Erreur lors du démarrage de l'entretien.");
    }
  }, [navigate, handleError, employees, user]);

  const handleCancelInterview = useCallback(async (interviewId) => {
    if (!interviewId) {
      toast.error("Identifiant d'entretien manquant.");
      return;
    }

    const confirmed = window.confirm("Êtes-vous sûr de vouloir annuler cet entretien ?");
    if (confirmed) {
      try {
        const response = await api.put(`/EvaluationInterview/update-interview/${interviewId}`, {
          NewStatus: INTERVIEW_STATUS.CANCELLED
        });

        if (response.status === 204) {
          toast.success("Entretien annulé avec succès.");
          fetchEmployeesWithoutEvaluations();
        } else {
          toast.error("Erreur lors de l'annulation de l'entretien.");
        }
      } catch (error) {
        console.error("Erreur lors de l'annulation de l'entretien:", error);
        if (error.response && error.response.data) {
          toast.error(error.response.data.title || "Une erreur s'est produite.");
        } else {
          toast.error("Une erreur s'est produite. Veuillez réessayer.");
        }
      }
    }
  }, [INTERVIEW_STATUS, fetchEmployeesWithoutEvaluations]);

  const getAndCancelInterview = useCallback(async (employeeId) => {
    try {
      setActionLoading(employeeId, true);
      const interviewResponse = await api.get(
        `/EvaluationInterview/get-interview-by-participant/${employeeId}`
      );

      const interview = interviewResponse.data;
      console.log("Entretien récupéré:", interview);
      
      if (!interview || !interview.interviewId) {
        toast.error("Aucun entretien trouvé pour cet employé.");
        setActionLoading(employeeId, false);
        return;
      }

      await handleCancelInterview(interview.interviewId);
      
      // Réinitialiser la variable globale après annulation
      window.selectedEmployeeForModal = undefined;
      console.log("Variable globale selectedEmployeeForModal réinitialisée après annulation");
      setActionLoading(employeeId, false);

    } catch (error) {
      setActionLoading(employeeId, false);
      handleError(error, "Erreur lors de la récupération des informations d'entretien.");
    }
  }, [handleCancelInterview, handleError]);

  const handleEditInterview = useCallback(async (interviewId, preloadedEmployee = null) => {
    try {
      console.log("===== DEBUG: handleEditInterview =====");
      console.log("Entretien ID:", interviewId);
      console.log("Employé préchargé:", preloadedEmployee);
      
      // 1. Si nous avons un employé préchargé, l'utiliser directement
      if (preloadedEmployee) {
        console.log("Utilisation de l'employé préchargé");
        window.selectedEmployeeForModal = { ...preloadedEmployee };
        console.log("État de window.selectedEmployeeForModal APRÈS affectation:", window.selectedEmployeeForModal);
      }
      
      const interviewResponse = await api.get(
        `/EvaluationInterview/interview-details/${interviewId}`
      );

      const interview = interviewResponse.data;
      console.log("Détails de l'entretien récupérés:", interview);
      
      // 2. Si nous n'avons pas d'employé préchargé, tenter de le trouver dans les participants
      if (!preloadedEmployee) {
        // Trouver l'employé concerné par cet entretien
        const employeeParticipant = interview.participants?.find(p => p.employeeId && !p.userId);
        console.log("Participant employé trouvé dans l'entretien:", employeeParticipant);
        
        // Si on a trouvé l'employé évalué, chercher ses détails complets dans la liste des employés
        if (employeeParticipant && employeeParticipant.employeeId) {
          const employeeId = employeeParticipant.employeeId;
          const fullEmployee = employees.find(emp => emp.employeeId === employeeId);
          
          if (fullEmployee) {
            // Stocker l'employé dans la variable globale
            window.selectedEmployeeForModal = { ...fullEmployee };
            console.log("Employé stocké globalement (depuis participants):", window.selectedEmployeeForModal);
          } else {
            console.warn("Impossible de trouver les détails complets de l'employé évalué ID:", employeeId);
            // Stocker quand même les données partielles
            window.selectedEmployeeForModal = { ...employeeParticipant };
          }
        } else {
          console.warn("Aucun employé évalué trouvé dans les participants de l'entretien");
        }
      }
      
      // 3. Vérification finale: si toujours pas d'employé, dernier recours
      if (!window.selectedEmployeeForModal) {
        console.warn("ALERTE: Toujours pas d'employé après les tentatives précédentes");
        
        // Tenter de récupérer l'evaluationId et de trouver l'employé correspondant
        if (interview.evaluationId) {
          const employeeWithEval = employees.find(emp => emp.evaluationId === interview.evaluationId);
          if (employeeWithEval) {
            window.selectedEmployeeForModal = { ...employeeWithEval };
            console.log("Employé trouvé via evaluationId:", window.selectedEmployeeForModal);
          }
        }
      }
      
      console.log("État final de window.selectedEmployeeForModal:", window.selectedEmployeeForModal);

      // Configurer les détails de l'évaluation
      setEvaluationDetails({
        evaluationId: interview.evaluationId,
        scheduledDate: interview.interviewDate?.split('Z')[0] || '',
        participants: interview.participants?.map(p => p.employeeId || p.userId) || [],
        selectedEmployee: window.selectedEmployeeForModal,
      });
      
      console.log("Modal va s'ouvrir avec:", {
        evaluationDetails: {
          evaluationId: interview.evaluationId,
          participants: interview.participants?.map(p => p.employeeId || p.userId) || []
        },
        selectedEmployee: window.selectedEmployeeForModal
      });

      // Ouvrir le modal
      setShowModal(true);
    } catch (error) {
      handleError(error, "Erreur lors de la récupération des détails de l'entretien.");
    }
  }, [handleError, employees]);

  const getAndEditInterview = useCallback(async (employeeId) => {
    try {
      setActionLoading(employeeId, true);
      console.log("===== DEBUG: getAndEditInterview =====");
      console.log("Tentative de récupération de l'entretien pour l'employé ID:", employeeId);
      
      // 1. D'abord, récupérer l'employé complet depuis la liste locale
      const fullEmployee = employees.find(emp => emp.employeeId === employeeId);
      console.log("Employé trouvé dans la liste locale:", fullEmployee);
      
      // 2. Stocker l'employé dans la variable globale AVANT l'appel API
      if (fullEmployee) {
        window.selectedEmployeeForModal = { ...fullEmployee };
        console.log("Employé stocké globalement (depuis liste):", window.selectedEmployeeForModal);
      } else {
        console.error("ERREUR: Impossible de trouver l'employé dans la liste locale");
      }

      // 3. Continuer avec la récupération de l'entretien
      const interviewResponse = await api.get(
        `/EvaluationInterview/get-interview-by-participant/${employeeId}`
      );

      const interview = interviewResponse.data;
      console.log("Entretien récupéré:", interview);
      
      if (!interview || !interview.interviewId) {
        toast.error("Aucun entretien trouvé pour cet employé.");
        setActionLoading(employeeId, false);
        return;
      }

      // 4. Appeler handleEditInterview avec l'employé prédéfini
      await handleEditInterview(interview.interviewId, fullEmployee);
      setActionLoading(employeeId, false);

    } catch (error) {
      setActionLoading(employeeId, false);
      handleError(error, "Erreur lors de la récupération des informations d'entretien.");
    }
  }, [handleEditInterview, handleError, employees]);

  const renderActionButton = useCallback((employee) => {
    if (!user) return null;

    // Utilisation des permissions au lieu des IDs de rôles
    const isManager = canValidateAsManager;
    const isDirector = canValidateAsDirector;
    const isRH = canImportEvaluation;

    const isToday = compareDates(employee.interviewDate, today);
    const isFutureDate = employee.interviewDate && new Date(employee.interviewDate) > new Date(today);
    const isPastDate = employee.interviewDate && new Date(employee.interviewDate) < new Date(today) && !isToday;
    
    // Vérifier si une action est en cours pour cet employé
    const loading = isActionLoading(employee.employeeId);

    if (loading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden"></span>
          </div>
        </div>
      );
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.PLANNED) {
      if (isRH) {
        if (isPastDate) {
          // Entretien planifié dans le passé mais non réalisé
          return (
            <div className="d-flex align-items-center">
              <span className="text-danger me-2">Entretien manqué</span>
              <button className="btn btn-outline-primary btn-sm me-1" onClick={() => getAndEditInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => getAndCancelInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        } else if (isToday) {
          // Entretien planifié pour aujourd&apos;hui
          return (
            <div className="d-flex align-items-center">
              <button
                className="btn btn-success btn-sm me-2"
                onClick={() => startInterview(employee.employeeId)}
              >
                Démarrer l&apos;entretien
              </button>
              <button className="btn btn-outline-primary btn-sm me-1" onClick={() => getAndEditInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => getAndCancelInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        } else if (isFutureDate) {
          // Entretien planifié pour une date future
          return (
            <div className="d-flex align-items-center">
              <span className="text-info me-2">Planifié</span>
              <button className="btn btn-outline-primary btn-sm me-1" onClick={() => getAndEditInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => getAndCancelInterview(employee.employeeId)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        }
      } else {
        // Non-RH : affichage différent selon la date
        if (isPastDate) {
          return <span className="text-danger">Entretien manqué</span>;
        } else if (isToday) {
          return <span className="text-success">Aujourd&apos;hui</span>;
        } else if (isFutureDate) {
          return <span className="text-info">Planifié</span>;
        }
      }
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.COMPLETED) {
      return <span className="text-success">Entretien terminé</span>;
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.REJECTED) {
      return <span className="text-danger">Entretien rejeté</span>;
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.CANCELLED) {
      return <span className="text-secondary">Entretien annulé</span>;
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.PENDING_VALIDATION) {
      // Fonction pour rediriger directement vers la page de validation
      const redirectToValidation = async (employeeId) => {
        try {
          setActionLoading(employeeId, true);
          // Récupérer l'employé complet depuis la liste pour avoir son evaluationId
          const employee = employees.find(emp => emp.employeeId === employeeId);
          console.log("Employé trouvé pour validation:", employee);
          
          if (!employee) {
            toast.error("Informations de l'employé introuvables");
            setActionLoading(employeeId, false);
            return;
          }
          
          // Récupérer l'entretien
          const interviewResponse = await api.get(
            `/EvaluationInterview/get-interview-by-participant/${employeeId}`
          );
          
          let interview = interviewResponse.data;
          console.log("Entretien récupéré pour validation:", interview);
          
          if (!interview || !interview.interviewId) {
            toast.error("Aucun entretien trouvé pour cet employé.");
            setActionLoading(employeeId, false);
            return;
          }
          
          // Vérification critique: s'assurer que les IDs correspondent
          if (employee.evaluationId && interview.evaluationId !== employee.evaluationId) {
            console.warn("Correction: L'ID d'évaluation de l'entretien ne correspond pas à celui de l'employé");
            console.warn(`ID évaluation employé: ${employee.evaluationId}, ID évaluation entretien: ${interview.evaluationId}`);
            
            // Correction pour garantir la cohérence
            interview = {
              ...interview,
              evaluationId: employee.evaluationId
            };
          }
          
          console.log("Redirection vers la page de détails pour validation avec:", {
            interviewId: interview.interviewId,
            evaluationId: interview.evaluationId,
            employeeId
          });
          
          // Rediriger vers la page de détails de l'entretien avec tous les IDs nécessaires
          navigate("/evaluation-details", { 
            state: { 
              interview, 
              employeeId,
              employeeDetails: {
                fullName: `${employee.firstName} ${employee.lastName}`,
                position: employee.position,
                department: employee.department
              },
              mode: "validation" 
            } 
          });
        } catch (error) {
          console.error("Erreur lors de la récupération de l'entretien:", error);
          setActionLoading(employeeId, false);
          
          if (error.response) {
            console.error("Détails de l'erreur:", error.response.status, error.response.data);
          }
          
          toast.error("Erreur lors de la récupération des détails de l'entretien.");
        }
      };
      
      // Affichage pour les managers qui peuvent valider
      if (isManager && (employee.managerApproval === null || employee.managerApproval === 0)) {
        return (
          <div className="d-flex align-items-center">
            <button
              className="btn btn-warning btn-sm"
              onClick={() => redirectToValidation(employee.employeeId)}
            >
              Valider 
            </button>
          </div>
        );
      }

      // Affichage pour les directeurs qui peuvent valider
      if (isDirector && (employee.directorApproval === null || employee.directorApproval === 0)) {
        return (
          <div className="d-flex align-items-center">
            <button
              className="btn btn-info btn-sm"
              onClick={() => redirectToValidation(employee.employeeId)}
            >
              Valider 
            </button>
          </div>
        );
      }

      // Pour les RH ou autres utilisateurs
      return (
        <div className="d-flex align-items-center">
          <span className="text-warning me-2">
            {employee.managerApproval === 1 && employee.directorApproval === null ? 
              "En attente de validation Directeur" : 
              "En attente de validation"}
          </span>
          {isRH && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => getAndCancelInterview(employee.employeeId)}
              aria-label="Annuler l&apos;entretien"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      );
    }

    if (employee.interviewStatus === INTERVIEW_STATUS.IN_PROGRESS) {
      if (isRH ) {
        return (
          <div className="d-flex align-items-center">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => startInterview(employee.employeeId)}
            >
              Continuer l&apos;entretien
            </button>
          </div>
        );
      }
      return <span className="text-info">Entretien en cours</span>;
    }

    // Si aucun entretien n'est planifié et que l'utilisateur est RH
    if (!employee.interviewDate && isRH) {
      return (
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => handleOpenModal(employee.employeeId)}
        >
          Planifier
        </button>
      );
    }

    return null;
  }, [user, today, getAndCancelInterview, getAndEditInterview, startInterview, canValidateAsManager, canValidateAsDirector, canImportEvaluation, INTERVIEW_STATUS, handleOpenModal, navigate, employees, isActionLoading]);

  return (
    <Template>
      <div className="salary-list-planning">
        <h4 className="title">Entretien d&apos;évaluation</h4>
        {loading && (
          <div className="d-flex justify-content-center my-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden"></span>
            </div>
          </div>
        )}
        <div className="filters card p-3 mb-4">
          <div className="row align-items-center g-3">
            {/* Champ de recherche */}
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={handleSearch}
                aria-label="Rechercher un employé"
              />
            </div>
            {/* Filtre par Poste */}
            <div className="col-md-3">
              <select
                name="position"
                className="form-control"
                value={filters.position}
                onChange={handleFilterChange}
                aria-label="Filtrer par poste">
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
                aria-label="Filtrer par département"
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

        <div className="card">
          <div className="card-body">
            <table className="table table-bordered">
              <thead className="thead-light">
                <tr>
                  <th style={getSortableStyle('name')} onClick={() => handleSort('name')}>
                    Nom {getSortIcon('name')}
                  </th>
                  <th style={getSortableStyle('position')} onClick={() => handleSort('position')}>
                    Poste {getSortIcon('position')}
                  </th>
                  <th style={getSortableStyle('department')} onClick={() => handleSort('department')}>
                    Département {getSortIcon('department')}
                  </th>
                  <th style={getSortableStyle('interviewdate')} onClick={() => handleSort('interviewdate')}>
                    Date d&apos;entretien {getSortIcon('interviewdate')}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={`${employee.employeeId}-${employee.interviewDate || 'nodate'}`}>
                      <td>{employee.firstName} {employee.lastName}</td>
                      <td>{employee.position}</td>
                      <td>{employee.department}</td>
                      <td>
                        {isValidInterviewDate(employee.interviewDate)
                          ? formatDate(employee.interviewDate)
                          : "Pas encore planifié"}
                      </td>
                      <td>
                        {renderActionButton(employee)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Aucun employé trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Page précédente"
              >
                Précédent
              </button>
              <span>
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
              >
                Suivant
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Nombre d'employés par page"
              >
                <option value={5}>5 par page</option>
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
              </select>
            </div>
          </div>
        </div>

        {showModal && (
          <>
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
                        handleCloseModal();
                    }
                }}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="mdi mdi-calendar-clock me-2"></i> Planification d&apos;entretien
                    </h5>
                    <button type="button" className="close text-dark" onClick={handleCloseModal}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    {/* Informations sur l'employé - Style UsersList */}
                    {/* {window.selectedEmployeeForModal && (
                      <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="row align-items-center">
                            <div className="col-md-2 text-center">
                                <i className="mdi mdi-account-circle" style={{ fontSize: '3rem', color: '#D4AC0D' }}></i>
                            </div>
                            <div className="col-md-10">
                                <h5 className="mb-1">{window.selectedEmployeeForModal.firstName} {window.selectedEmployeeForModal.lastName}</h5>
                                <p className="text-muted mb-0">
                                {window.selectedEmployeeForModal.position} - {window.selectedEmployeeForModal.department}
                                </p>
                            </div>
                        </div>
                      </div>
                    )} */}

                    <form>
                      {/* Date et heure planifiée */}
                      <div className="form-group mb-4">
                        <label htmlFor="scheduledDateTime" className="form-label d-flex align-items-center mb-2">
                          <i className="mdi mdi-calendar-range me-2 text-primary"></i>
                          <span className="fw-bold">Date et heure de l&apos;entretien</span>
                        </label>
                        {dateError && (
                          <div className="alert alert-danger py-2 mb-2">
                            <i className="mdi mdi-alert-circle me-2"></i>
                            {dateError}
                          </div>
                        )}
                        <div className="input-group shadow-sm">
                          <span className="input-group-text border-end-0" style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}>
                            <i className="mdi mdi-calendar-today text-primary"></i>
                          </span>
                          <input
                            type="datetime-local"
                            id="scheduledDateTime"
                            className="form-control ps-0 border-start-0"
                            style={{ backgroundColor: '#f7f9fc', borderColor: '#e9ecef' }}
                            value={evaluationDetails.scheduledDate}
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              const currentDate = new Date().toISOString().split('T')[0];
                              if (selectedDate < currentDate) {
                                setDateError("La date ne peut pas être dans le passé.");
                              } else {
                                setDateError("");
                                handleEvaluationDetailsChange({ name: 'scheduledDate', value: selectedDate });
                              }
                            }}
                            aria-label="Date et heure planifiée"
                          />
                        </div>
                      </div>
                      
                      {/* Option d'envoi d'emails */}
                      <div className="form-group mb-4">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="sendEmailsCheck"
                            checked={evaluationDetails.sendEmails}
                            onChange={() => 
                              handleEvaluationDetailsChange({ 
                                name: 'sendEmails', 
                                value: !evaluationDetails.sendEmails 
                              })
                            }
                          />
                          <label className="form-check-label d-flex align-items-center" htmlFor="sendEmailsCheck">
                            <i className="mdi mdi-email-outline me-2 text-primary"></i>
                            <span>Envoyer des notifications par email aux participants</span>
                          </label>
                        </div>
                        {evaluationDetails.sendEmails && (
                          <div className="alert alert-info mt-2 p-2 small">
                            <i className="mdi mdi-information-outline me-2"></i>
                            Un email sera envoyé à tous les participants pour les informer de cette planification d&apos;entretien.
                          </div>
                        )}
                      </div>
                      
                      {/* Section des participants */}
                      <div className="form-group mb-0">
                        <div className="d-flex align-items-center mb-2">
                          <i className="mdi mdi-account-multiple text-primary me-2"></i>
                          <span className="fw-bold">Participants à l&apos;entretien</span>
                        </div>
                        <ParticipantsSelector
                            participantsList={participantsList}
                            selectedParticipants={evaluationDetails.participants}
                            setSelectedParticipants={(participants) => {
                                setEvaluationDetails((prev) => ({
                                  ...prev,
                                  participants: participants,
                                }));
                            }}
                            fetchedEmployee={window.selectedEmployeeForModal || evaluationDetails.selectedEmployee}
                        />
                      </div>
                    </form>
                  </div>
                  
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light btn-fw" onClick={handleCloseModal}>
                        <i className="mdi mdi-close-circle me-1"></i>Annuler
                    </button>
                    <button type="button" className="btn btn-success btn-fw" onClick={handleMassPlanning}>
                        <i className="mdi mdi-calendar-check me-1"></i>Planifier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </Template>
  );
}

export default EvaluationInterviewHome;