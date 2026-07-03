import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/Evaluations/EvaluationDetails.css'; // Styles spécifiques
import api from '../../../helpers/api';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import Template from '../../Template';
import PermissionService from '../../../services/PermissionService';

const EvaluationDetails = ({ interview: propInterview, employeeId: propEmployeeId }) => {
    const { interviewId: urlInterviewId } = useParams(); // Récupération de l'ID depuis l'URL si disponible
    const navigate = useNavigate();
    const location = useLocation(); // Déplacer useLocation ici
    
    // Récupérer les données soit des props, soit du state de location
    const { interview: locationInterview, employeeId: locationEmployeeId } = location.state || {};
    const interview = propInterview || locationInterview;
    const employeeId = propEmployeeId || locationEmployeeId;
    const actualInterviewId = interview?.interviewId || urlInterviewId;

    const [interviewDetails, setInterviewDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const { user, hasPermission } = useUser(); // Récupération de l'objet utilisateur et hasPermission
    
    // État pour gérer les onglets
    const [activeTab, setActiveTab] = useState('general');
    
    // État pour le formulaire de validation
    const [validationForm, setValidationForm] = useState({
        approved: false,
        comments: ''
    });
    
    // Déterminer si l'utilisateur est manager ou directeur en utilisant PermissionService
    const canValidateAsManager = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_MANAGER');
    const canValidateAsDirector = PermissionService.hasFunctionalPermission(hasPermission, 'VALIDATE_AS_DIRECTOR');

    // Variable pour déterminer si l'utilisateur a déjà validé cet entretien
    const [alreadyValidated, setAlreadyValidated] = useState(false);

    useEffect(() => {
        // Ajouter des logs pour voir ce qui est reçu
        console.log("EvaluationDetails - Props reçues:", { interview, employeeId, location: window.location });
        console.log("EvaluationDetails - URL interviewId:", urlInterviewId);
        console.log("EvaluationDetails - Interview état:", interview);
        console.log("EvaluationDetails - Localisation actuelle:", window.location.href);
        console.log("EvaluationDetails - État de location:", location.state);
        
        const fetchInterviewDetails = async () => {
            if (!actualInterviewId) {
                console.error("ID d'entretien manquant dans les props et l'URL");
                
                // Vérifier si on peut le récupérer depuis l'état de location
                const locationState = location.state;
                if (locationState?.interview?.interviewId) {
                    console.log("ID d'entretien trouvé dans location.state:", locationState.interview.interviewId);
                    const interviewFromLocation = locationState.interview;
                    setInterviewDetails(interviewFromLocation);
                    
                    // Si l'utilisateur a déjà validé cet entretien
                    if (canValidateAsManager && interviewFromLocation.managerApproval !== null) {
                        setAlreadyValidated(true);
                        setValidationForm({
                            approved: interviewFromLocation.managerApproval,
                            comments: interviewFromLocation.managerComments || ''
                        });
                    } else if (canValidateAsDirector && interviewFromLocation.directorApproval !== null) {
                        setAlreadyValidated(true);
                        setValidationForm({
                            approved: interviewFromLocation.directorApproval,
                            comments: interviewFromLocation.directorComments || ''
                        });
                    }
                    
                    // Si l'entretien a des notes au format JSON, les parser
                    if (interviewFromLocation.notes) {
                        try {
                            const parsedNotes = JSON.parse(interviewFromLocation.notes);
                            setInterviewDetails({
                                ...interviewFromLocation,
                                parsedNotes: parsedNotes
                            });
                        } catch (e) {
                            console.error("Erreur lors du parsing des notes JSON:", e);
                        }
                    }
                    
                    setLoading(false);
                    return;
                }
                
                setError("ID d'entretien manquant");
                setLoading(false);
                return;
            }

            try {
                // Utiliser l'employeeId pour des requêtes spécifiques si nécessaire
                console.log("Employé concerné ID:", employeeId);
                
                const response = await api.get(`/EvaluationInterview/interview-details/${actualInterviewId}`);
                const data = response.data;
                
                // Log détaillé des données récupérées
                console.log("Détails de l'entretien récupérés depuis l'API:", data);
                console.log("InterviewId:", data.interviewId);
                console.log("EvaluationId:", data.evaluationId);
                
                setInterviewDetails(data);
                
                // Vérifier si l'utilisateur a déjà validé cet entretien
                if (canValidateAsManager && data.managerApproval !== null) {
                    setAlreadyValidated(true);
                    setValidationForm({
                        approved: data.managerApproval,
                        comments: data.managerComments || ''
                    });
                } else if (canValidateAsDirector && data.directorApproval !== null) {
                    setAlreadyValidated(true);
                    setValidationForm({
                        approved: data.directorApproval,
                        comments: data.directorComments || ''
                    });
                }
                
                // Si l'entretien a des notes au format JSON, les parser
                if (data.notes) {
                    try {
                        const parsedNotes = JSON.parse(data.notes);
                        // Associer les notes parsées aux détails de l'entretien
                        setInterviewDetails({
                            ...data,
                            parsedNotes: parsedNotes
                        });
                    } catch (e) {
                        console.error("Erreur lors du parsing des notes JSON:", e);
                    }
                }
            } catch (err) {
                console.error("Erreur lors du chargement des détails de l'entretien:", err);
                if (err.response) {
                    console.error("Détails de l'erreur:", err.response.status, err.response.data);
                }
                setError(err.response?.data || 'Erreur lors du chargement des détails');
            } finally {
                setLoading(false);
            }
        };

        fetchInterviewDetails();
    }, [actualInterviewId, canValidateAsManager, canValidateAsDirector, employeeId, interview, urlInterviewId, location]);

    const handleValidationChange = (e) => {
        const { name, value, type, checked } = e.target;
        setValidationForm({
            ...validationForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleValidationSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        setSaving(true);
        
        try {
            // Vérifier que l'ID d'entretien est disponible
            if (!actualInterviewId && !interviewDetails?.interviewId) {
                console.error("Erreur: ID d'entretien manquant");
                toast.error("Impossible de valider sans identifiant d'entretien");
                setSaving(false);
                return;
            }
            
            // Utiliser l'ID correct
            const interviewId = actualInterviewId || interviewDetails.interviewId;
            
            // DIAGNOSTICS COMPLETS POUR COMPRENDRE LES DONNÉES
            console.log("=== DIAGNOSTICS COMPLETS ===");
            console.log("ID de l'entretien:", interviewId);
            console.log("Détails de l'entretien:", interviewDetails);
            console.log("Est Manager:", canValidateAsManager);
            console.log("Est Directeur:", canValidateAsDirector);
            console.log("Formulaire de validation:", validationForm);
            console.log("=========================");
            
            if (!canValidateAsManager && !canValidateAsDirector) {
                toast.error("Vous n'avez pas les permissions pour valider cet entretien");
                setSaving(false);
                return;
            }
            
            // APPROCHE SIMPLIFIÉE: UTILISER DIRECTEMENT L'ENDPOINT AVEC TOUS LES DÉTAILS POSSIBLES
            
            // 1. Créer un payload contenant toutes les informations possibles
            // Dans les deux formats: camelCase et snake_case
            const payload = {
                // Format DTO pour complete-interview
                ManagerApproval: canValidateAsManager ? validationForm.approved : interviewDetails?.managerApproval,
                ManagerComments: canValidateAsManager ? validationForm.comments : interviewDetails?.managerComments || '',
                DirectorApproval: canValidateAsDirector ? validationForm.approved : interviewDetails?.directorApproval,
                DirectorComments: canValidateAsDirector ? validationForm.comments : interviewDetails?.directorComments || '',
                Notes: interviewDetails?.notes || '',
                Status: 25, // PENDING_VALIDATION par défaut
                
                // Format SQL pour update-interview
                manager_approval: canValidateAsManager ? validationForm.approved : interviewDetails?.managerApproval,
                manager_comments: canValidateAsManager ? validationForm.comments : interviewDetails?.managerComments || '',
                director_approval: canValidateAsDirector ? validationForm.approved : interviewDetails?.directorApproval,
                director_comments: canValidateAsDirector ? validationForm.comments : interviewDetails?.directorComments || '',
                notes: interviewDetails?.notes || '',
                
                // Paramètres supplémentaires pour update-interview
                newStatus: 25, // PENDING_VALIDATION
                newDate: interviewDetails.interviewDate || new Date().toISOString(),
                newParticipantIds: [],
                
                // Inclure l'ID explicitement pour éviter les confusions
                interviewId: interviewId,
                InterviewId: interviewId
            };
            
            // Si les deux approuvent, mettre à jour le statut à COMPLETED (30)
            if ((canValidateAsManager && payload.ManagerApproval === true && interviewDetails?.directorApproval === true) || 
                (canValidateAsDirector && payload.DirectorApproval === true && interviewDetails?.managerApproval === true)) {
                payload.Status = 30; // COMPLETED pour complete-interview
                payload.newStatus = 30; // COMPLETED pour update-interview
            }
            
            console.log("Payload complet:", payload);
            
            // 2. Essayer les deux endpoints possibles
            let success = false;
            
            try {
                // Premier essai: complete-interview
                console.log("Essai avec complete-interview...");
                const completeResponse = await api.put(
                    `/EvaluationInterview/complete-interview/${interviewId}`,
                    payload
                );
                
                if (completeResponse.status === 200 || completeResponse.status === 204) {
                    console.log("Succès avec complete-interview!");
                    success = true;
                }
            } catch (completeError) {
                console.error("Erreur avec complete-interview:", completeError);
                
                try {
                    // Deuxième essai: update-interview
                    console.log("Essai avec update-interview...");
                    const updateResponse = await api.put(
                        `/EvaluationInterview/update-interview/${interviewId}`,
                        payload
                    );
                    
                    if (updateResponse.status === 200 || updateResponse.status === 204) {
                        console.log("Succès avec update-interview!");
                        success = true;
                    }
                } catch (updateError) {
                    console.error("Erreur avec update-interview:", updateError);
                }
            }
            
            // 3. Traiter le résultat
            if (success) {
                toast.success("Validation enregistrée avec succès");
                
                // Même si l'API fonctionne, forçons le rafraîchissement pour voir les changements
                localStorage.setItem('interviewStatusUpdated', 'true');
                
                // Redirection après un court délai
                setTimeout(() => {
                    navigate('/homeInterview');
                }, 1500);
            } else {
                // Si les deux méthodes échouent, afficher un message d'erreur
                toast.error("Impossible de valider l'entretien. Contactez l'administrateur système.");
                console.error("Toutes les tentatives de validation ont échoué");
            }
        } catch (error) {
            console.error("Erreur globale lors de la validation:", error);
            toast.error("Une erreur est survenue lors de la validation de l'entretien.");
        } finally {
            setSaving(false);
        }
    };

    // Fonction pour changer d'onglet
    const changeTab = (tabName) => {
        setActiveTab(tabName);
    };

    // Fonction pour afficher les notes structurées
    const renderStructuredNotes = () => {
        const notes = interviewDetails.parsedNotes;
        if (!notes) return <p>Aucune note structurée disponible</p>;
        
        return (
            <div className="structured-notes">
                {/* Section Général */}
                {notes.general && (
                    <div className="note-section">
                        <div className="mb-4">
                            <div className="row">
                                <div className="col-md-6">
                                    <p className="mb-1"><strong>Date:</strong></p>
                                    <p>{notes.general.date || "Non spécifiée"}</p>
                                </div>
                                <div className="col-md-6">
                                    <p className="mb-1"><strong>Lieu:</strong></p>
                                    <p>{notes.general.location || "Non spécifié"}</p>
                                </div>
                            </div>
                        </div>
                        
                        {notes.general.context && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Contexte:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.general.context}</p>
                            </div>
                        )}
                        
                        {notes.globalNotes && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Notes globales:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.globalNotes}</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Bilan précédent */}
                {notes.previousPeriod && (
                    <div className="note-section">
                        {notes.previousPeriod.achievements && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Réalisations:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.previousPeriod.achievements}</p>
                            </div>
                        )}
                        {notes.previousPeriod.challenges && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Défis:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.previousPeriod.challenges}</p>
                            </div>
                        )}
                        {notes.previousPeriod.previousObjectivesAchieved && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Objectifs atteints:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.previousPeriod.previousObjectivesAchieved}</p>
                            </div>
                        )}
                        {notes.previousPeriod.feedback && (
                            <div className="mb-4">
                                <p className="mb-1"><strong>Feedback:</strong></p>
                                <p className="note-text p-3 bg-light rounded">{notes.previousPeriod.feedback}</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Objectifs */}
                {notes.objectives && notes.objectives.length > 0 && (
                    <div className="note-section">
                        <div className="objectives-list">
                            {notes.objectives.map((objective, i) => (
                                <div key={i} className="objective-item card mb-3 p-3 border">
                                    <h6 className="mb-3">Objectif {i+1}</h6>
                                    <p className="mb-2"><strong>Description:</strong> {objective.description}</p>
                                    <div className="row">
                                        <div className="col-md-6">
                                            {objective.dueDate && <p className="mb-1"><strong>Échéance:</strong> {objective.dueDate}</p>}
                                        </div>
                                        <div className="col-md-6">
                                            {objective.indicator && <p className="mb-1"><strong>Indicateur:</strong> {objective.indicator}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Contenu à afficher en fonction de l'état du chargement
    const renderContent = () => {
        if (loading) {
            return (
                <div className="container mt-4">
                    <div className="loading-spinner">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                    </div>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="container mt-4">
                    <div className="alert alert-danger">
                        <i className="mdi mdi-alert-circle me-2"></i>
                        Erreur : {error}
                    </div>
                    <button 
                        className="btn btn-secondary mt-3"
                        onClick={() => navigate('/')}
                    >
                        Retour à l&apos;accueil
                    </button>
                </div>
            );
        }
        
        if (!interviewDetails) {
            return (
                <div className="container mt-4">
                    <div className="alert alert-warning">
                        <i className="mdi mdi-information-outline me-2"></i>
                        Aucun détail disponible pour cet entretien.
                    </div>
                    <button 
                        className="btn btn-secondary mt-3"
                        onClick={() => navigate('/')}
                    >
                        Retour à l&apos;accueil
                    </button>
                </div>
            );
        }

        // Récupérer les informations de l'employé concerné par l'évaluation
        let employeeInfo = {};
        
        if (interviewDetails.employeeName || interviewDetails.position || interviewDetails.department) {
            employeeInfo = {
                fullName: interviewDetails.employeeName,
                position: interviewDetails.position,
                department: interviewDetails.department
            };
        } else if (location.state && location.state.employeeDetails) {
            employeeInfo = location.state.employeeDetails;
        }

        return (
            <div className="container-fluid mt-4">
                <div className="row">
                    <div className="col-12">
                        <h2 className="mb-4">Validation de l&apos;entretien d&apos;évaluation</h2>
                        
                        {/* Informations de l'employé */}
                        {employeeInfo && Object.keys(employeeInfo).length > 0 && (
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
                                            <p className="mb-0 fw-bold">{employeeInfo.fullName || "Non spécifié"}</p>
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
                            {/* Colonne gauche: Statut et informations */}
                            <div className="col-md-5">
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <i className="mdi mdi-information-outline text-primary me-2"></i>
                                            Informations générales
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <p className="mb-1 text-muted">Date de l&apos;entretien</p>
                                                <p className="mb-0">{interviewDetails.interviewDate ? new Date(interviewDetails.interviewDate).toLocaleDateString() : "Non spécifiée"}</p>
                                            </div>
                                            {/* <div className="col-6">
                                                <p className="mb-1 text-muted">Statut</p>
                                                <p className="mb-0">
                                                    <span className={`badge ${
                                                        interviewDetails.status === 10 ? "bg-info" :
                                                        interviewDetails.status === 20 ? "bg-primary" :
                                                        interviewDetails.status === 25 ? "bg-warning" :
                                                        interviewDetails.status === 30 ? "bg-success" :
                                                        interviewDetails.status === 40 ? "bg-danger" :
                                                        interviewDetails.status === 50 ? "bg-secondary" : "bg-light"
                                                    }`}>
                                                        {interviewDetails.status === 10 ? "Planifié" :
                                                        interviewDetails.status === 20 ? "En cours" :
                                                        interviewDetails.status === 25 ? "En attente de validation" :
                                                        interviewDetails.status === 30 ? "Complété" :
                                                        interviewDetails.status === 40 ? "Rejeté" :
                                                        interviewDetails.status === 50 ? "Annulé" : "Inconnu"}
                                                    </span>
                                                </p>
                                            </div> */}
                                        </div>
                                        
                                        <div className="row mb-3">
                                            <div className="col-6">
                                                <p className="mb-1 text-muted">Validation manager</p>
                                                <p className="mb-0">
                                                    <span className={`badge ${
                                                        interviewDetails.managerApproval === null ? "bg-secondary" : 
                                                        interviewDetails.managerApproval ? "bg-success" : "bg-danger"
                                                    }`}>
                                                        {interviewDetails.managerApproval === null ? "En attente" : 
                                                        interviewDetails.managerApproval ? "Approuvé" : "Rejeté"}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="col-6">
                                                <p className="mb-1 text-muted">Validation directeur</p>
                                                <p className="mb-0">
                                                    <span className={`badge ${
                                                        interviewDetails.directorApproval === null ? "bg-secondary" : 
                                                        interviewDetails.directorApproval ? "bg-success" : "bg-danger"
                                                    }`}>
                                                        {interviewDetails.directorApproval === null ? "En attente" : 
                                                        interviewDetails.directorApproval ? "Approuvé" : "Rejeté"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Commentaires existants */}
                                        <div className="mt-4">
                                            <h6 className="mb-3">Commentaires précédents</h6>
                                            <div className="existing-comments">
                                                {interviewDetails.managerComments && (
                                                    <div className="comment-block p-3 mb-3 bg-light rounded">
                                                        <h6 className="d-flex align-items-center">
                                                            <i className="mdi mdi-account-tie me-2 text-warning"></i>
                                                            Commentaires du manager:
                                                        </h6>
                                                        <p className="comment-text mb-0 mt-2">{interviewDetails.managerComments}</p>
                                                    </div>
                                                )}
                                                
                                                {interviewDetails.directorComments && (
                                                    <div className="comment-block p-3 bg-light rounded">
                                                        <h6 className="d-flex align-items-center">
                                                            <i className="mdi mdi-account-star me-2 text-info"></i>
                                                            Commentaires du directeur:
                                                        </h6>
                                                        <p className="comment-text mb-0 mt-2">{interviewDetails.directorComments}</p>
                                                    </div>
                                                )}
                                                
                                                {!interviewDetails.managerComments && !interviewDetails.directorComments && (
                                                    <p className="text-muted">Aucun commentaire ajouté</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Colonne droite: Affichage des notes et formulaire de validation */}
                            <div className="col-md-7">
                                <div className="card shadow-sm">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <i className="mdi mdi-clipboard-text-outline text-primary me-2"></i>
                                            Compte-rendu de l&apos;entretien
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
                                            {activeTab === 'general' && interviewDetails.parsedNotes?.general && (
                                                <div className="tab-pane fade show active">
                                                    {renderStructuredNotes().props.children[0]}
                                                </div>
                                            )}
                                            
                                            {/* Onglet Bilan précédent */}
                                            {activeTab === 'previous' && interviewDetails.parsedNotes?.previousPeriod && (
                                                <div className="tab-pane fade show active">
                                                    {renderStructuredNotes().props.children[1]}
                                                </div>
                                            )}
                                            
                                            {/* Onglet Objectifs */}
                                            {activeTab === 'objectives' && interviewDetails.parsedNotes?.objectives && (
                                                <div className="tab-pane fade show active">
                                                    {renderStructuredNotes().props.children[2]}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Formulaire de validation pour Manager/Directeur */}
                                        {(canValidateAsManager || canValidateAsDirector) && (
                                            <div className="validation-form card mt-4 border-warning">
                                                <div className="card-header bg-warning bg-opacity-25">
                                                    <h5 className="mb-0 d-flex align-items-center">
                                                        <i className="mdi mdi-check-circle-outline text-warning me-2"></i>
                                                        Validation {canValidateAsManager ? "Manager" : "Directeur"}
                                                    </h5>
                                                </div>
                                                <div className="card-body">
                                                    <div className="form-group mb-4">
                                                        <label className="form-label fw-bold">Décision</label>
                                                        <div className="d-flex">
                                                            <div className="form-check form-check-inline">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    id="approvalYes"
                                                                    name="approved"
                                                                    checked={validationForm.approved === true}
                                                                    onChange={() => setValidationForm({...validationForm, approved: true})}
                                                                />
                                                                <label className="form-check-label text-success" htmlFor="approvalYes">
                                                                    <i className="mdi mdi-check-circle me-1"></i> Approuver
                                                                </label>
                                                            </div>
                                                            <div className="form-check form-check-inline">
                                                                <input
                                                                    type="radio"
                                                                    className="form-check-input"
                                                                    id="approvalNo"
                                                                    name="approved"
                                                                    checked={validationForm.approved === false}
                                                                    onChange={() => setValidationForm({...validationForm, approved: false})}
                                                                />
                                                                <label className="form-check-label text-danger" htmlFor="approvalNo">
                                                                    <i className="mdi mdi-close-circle me-1"></i> Rejeter
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="form-group mb-4">
                                                        <label htmlFor="validationComments" className="form-label fw-bold">Commentaires {canValidateAsManager ? "du Manager" : "du Directeur"}</label>
                                                        <textarea
                                                            className="form-control"
                                                            id="validationComments"
                                                            name="comments"
                                                            rows="4"
                                                            value={validationForm.comments}
                                                            onChange={handleValidationChange}
                                                            placeholder="Ajoutez vos commentaires concernant cet entretien d'évaluation..."
                                                        ></textarea>
                                                    </div>
                                                    
                                                    {alreadyValidated && (
                                                        <div className="alert alert-info mb-4">
                                                            <i className="mdi mdi-information-outline me-2"></i>
                                                            Vous avez déjà validé cet entretien. Vos modifications écraseront votre précédente validation.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Bouton de validation - Version plus visible */}
                                        <div className="d-flex justify-content-end mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-lg"
                                                onClick={handleValidationSubmit}
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Sauvegarde...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="mdi mdi-content-save-outline me-2"></i>
                                                        Valider l&apos;entretien
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
            </div>
        );
    };

    return (
        <Template>
            {renderContent()}
        </Template>
    );
};

EvaluationDetails.propTypes = {
    interview: PropTypes.object,
    employeeId: PropTypes.number
};

export default EvaluationDetails;
