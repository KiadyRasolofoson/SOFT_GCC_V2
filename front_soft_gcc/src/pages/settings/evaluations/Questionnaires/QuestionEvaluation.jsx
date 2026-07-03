import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Template from '../../../Template';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo, faTrash } from '@fortawesome/free-solid-svg-icons';

function QuestionEvaluation() {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [formData, setFormData] = useState({
        question: '',
        evaluationTypeId: 0,
        positionId: 0,
        competenceLineId: null,
        responseTypeId: 1, // Valeur par défaut (TEXT)
        state: 1
    });
    // États pour les formulaires modaux
    const [editFormData, setEditFormData] = useState({
        question: '',
        evaluationTypeId: 0,
        positionId: 0,
        competenceLineId: null,
        responseTypeId: 1,
        state: 1
    });
    // État pour contrôler l'affichage des modales
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [evaluationTypes, setEvaluationTypes] = useState([]);
    const [positions, setPositions] = useState([]);
    const [competenceLines, setCompetenceLines] = useState([]);
    const [responseTypes, setResponseTypes] = useState([]);

    // États pour les filtres
    const [filterEvaluationType, setFilterEvaluationType] = useState('');
    const [filterPosition, setFilterPosition] = useState('');
    const [filterResponseType, setFilterResponseType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination states
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    // État d'erreur et de chargement
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // État pour stocker toutes les questions
    const [allQuestions, setAllQuestions] = useState([]);
    
    // État pour la sélection multiple
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // Références pour la sélection par maintien du curseur
    const lastSelectedRef = useRef(null);
    const tableRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchAllInitialData()
        ])
        .finally(() => setLoading(false));
    }, []);

    // Effet pour paginer localement
    useEffect(() => {
        if (allQuestions.length > 0) {
            paginateLocally();
        }
    }, [pageNumber, pageSize, allQuestions, filterEvaluationType, filterPosition, filterResponseType, searchQuery]);

    // Effet pour réinitialiser la sélection lorsque les filtres ou la pagination changent
    useEffect(() => {
        setSelectedItems([]);
        setSelectAll(false);
    }, [pageNumber, filterEvaluationType, filterPosition, filterResponseType, searchQuery]);

    // Fonction pour charger toutes les données initiales
    const fetchAllInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchAllQuestions(),
                fetchEvaluationTypes(),
                fetchPositions(),
                fetchCompetenceLines(),
                fetchResponseTypes()
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Cette fonction peut être utilisée pour rafraîchir les données manuellement
    // par exemple après avoir modifié une entité
    const refreshData = () => {
        fetchAllInitialData();
    };

    // Fonction pour récupérer toutes les questions
    const fetchAllQuestions = async () => {
        try {
            setError(null);
            // Récupérer toutes les questions
            const response = await axios.get('https://localhost:7082/api/Evaluation/questionsAll');
            if (response.data && Array.isArray(response.data)) {
                setAllQuestions(response.data);
                console.log("Toutes les questions chargées:", response.data);
                return response.data;
            } else {
                console.error("Format de données inattendu:", response.data);
                setAllQuestions([]);
                setError("Format de données inattendu lors du chargement des questions");
                return [];
            }
        } catch (error) {
            console.error("Error fetching all questions:", error);
            setAllQuestions([]);
            setError("Erreur lors du chargement des questions: " + (error.response?.data?.error || error.message));
            return [];
        } finally {
            paginateLocally();
        }
    };

    // Fonction pour paginer les questions localement
    const paginateLocally = () => {
        // Filtrer d'abord les questions selon les critères
        const filtered = getFilteredQuestions();

        // Calculer le total des pages
        const total = Math.ceil(filtered.length / pageSize);
        setTotalPages(total > 0 ? total : 1);
        
        // Paginer les données filtrées
        const start = (pageNumber - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = filtered.slice(start, end);
        
        setQuestions(paginatedData);
    };

    // Fonction pour filtrer les questions
    const getFilteredQuestions = () => {
        // Vérifier si questions est défini et est un tableau
        if (!Array.isArray(allQuestions)) {
            return [];
        }

        return allQuestions.filter(question => {
            if (!question) return false;

            const matchesEvaluationType = !filterEvaluationType ||
                question.evaluationTypeId === Number(filterEvaluationType);

            const matchesPosition = !filterPosition ||
                question.positionId === Number(filterPosition);
                
            const matchesResponseType = !filterResponseType || 
                question.responseTypeId === Number(filterResponseType) ||
                question.ResponseTypeId === Number(filterResponseType);
                
            const matchesSearch = !searchQuery || 
                question.question.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesEvaluationType && matchesPosition && matchesResponseType && matchesSearch;
        });
    };

    const fetchEvaluationTypes = async () => {
        try {
            const response = await axios.get('https://localhost:7082/api/Evaluation/types');
            setEvaluationTypes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching evaluation types:", error);
            setEvaluationTypes([]);
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await axios.get('https://localhost:7082/api/Evaluation/postes');
            setPositions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching positions:", error);
            setPositions([]);
        }
    };

    const fetchCompetenceLines = async () => {
        try {
            // Essayer d'abord l'endpoint standard
            const response = await axios.get('https://localhost:7082/api/Evaluation/competence-lines');
            console.log("Competence lines loaded:", response.data);
            setCompetenceLines(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching competence lines:", error);
            // Valeurs par défaut si l'API n'existe pas encore
            setCompetenceLines([]);

            // Essayer un autre format d'URL
            try {
                const altResponse = await axios.get('https://localhost:7082/api/CompetenceLine');
                if (altResponse.data && Array.isArray(altResponse.data)) {
                    setCompetenceLines(altResponse.data);
                }
            } catch (altError) {
                console.log("Alternative endpoint also failed, using empty array for competence lines");
            }
        }
    };

    const fetchResponseTypes = async () => {
        try {
            // Essayer d'abord l'endpoint standard
            const response = await axios.get('https://localhost:7082/api/Evaluation/response-types');
            console.log("Response types loaded:", response.data);
            if (response.data && Array.isArray(response.data)) {
                setResponseTypes(response.data);
            } else {
                throw new Error("Format de données inattendu");
            }
        } catch (error) {
            console.error("Error fetching response types:", error);
            // Utiliser des valeurs par défaut si l'API n'existe pas encore
            setResponseTypes([
                { ResponseTypeId: 1, TypeName: 'TEXT', Description: 'Réponse textuelle libre' },
                { ResponseTypeId: 2, TypeName: 'QCM', Description: 'Choix multiple' },
                { ResponseTypeId: 3, TypeName: 'SCORE', Description: 'Évaluation numérique' }
            ]);

            // Essayer un autre format d'URL
            try {
                const altResponse = await axios.get('https://localhost:7082/api/ResponseType');
                if (altResponse.data && Array.isArray(altResponse.data) && altResponse.data.length > 0) {
                    setResponseTypes(altResponse.data);
                }
            } catch (altError) {
                console.log("Alternative endpoint also failed, using default values for response types");
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (['evaluationTypeId', 'positionId', 'responseTypeId'].includes(name)) {
            setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
        } else if (name === 'competenceLineId') {
            setFormData({ ...formData, [name]: value ? parseInt(value, 10) : null });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    // Gestionnaire pour les champs du formulaire d'édition
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        if (['evaluationTypeId', 'positionId', 'responseTypeId'].includes(name)) {
            setEditFormData({ ...editFormData, [name]: parseInt(value, 10) || 0 });
        } else if (name === 'competenceLineId') {
            setEditFormData({ ...editFormData, [name]: value ? parseInt(value, 10) : null });
        } else {
            setEditFormData({ ...editFormData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // S'assurer que tous les IDs sont correctement parsés
            const evaluationTypeId = parseInt(formData.evaluationTypeId, 10) || 0;
            const positionId = parseInt(formData.positionId, 10) || 0;
            const responseTypeId = parseInt(formData.responseTypeId, 10) || 1;
            const competenceLineId = formData.competenceLineId !== null && formData.competenceLineId !== ""
                ? parseInt(formData.competenceLineId, 10)
                : null;

            if (!formData.question || !evaluationTypeId || !positionId) {
                setError("Veuillez remplir tous les champs obligatoires");
                return;
            }

            // Format du DTO utilisé par le backend
            const requestData = {
                QuestionId: currentQuestion ? (currentQuestion.id || currentQuestion.questionId || currentQuestion.questiondId) : null,
                Question: formData.question.trim(),
                EvaluationTypeId: evaluationTypeId,
                PositionId: positionId,
                CompetenceLineId: competenceLineId,
                ResponseTypeId: responseTypeId,
                State: formData.state || 1
                };

            console.log('Envoi des données au format DTO:', requestData);

            setError(null);

            if (currentQuestion) {
                const questionId = currentQuestion.id || currentQuestion.questionId || currentQuestion.questiondId;
                console.log(`Mise à jour de la question avec ID: ${questionId}`);

                const response = await axios.put(`https://localhost:7082/api/Evaluation/questions/${questionId}`, requestData);
                console.log("Réponse de mise à jour:", response);

                // Fermer la modale après mise à jour
                setShowEditModal(false);
            } else {
                const response = await axios.post('https://localhost:7082/api/Evaluation/questions', requestData);
                console.log("Réponse de création:", response);
            }

            fetchAllQuestions();
            resetForm();
            alert('Opération réussie');
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de la question:", error);

            // Affichage détaillé des erreurs pour faciliter le débogage
            if (error.response) {
                console.error("Statut:", error.response.status);
                console.error("Détails de l'erreur:", error.response.data);

                let errorMessage = "Une erreur s'est produite";
                if (error.response.data && error.response.data.errors) {
                    errorMessage = Object.entries(error.response.data.errors)
                        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                        .join('\n');
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }

                setError(`Erreur: ${errorMessage}`);
            } else {
                setError(`Erreur: ${error.message || "Une erreur inconnue s'est produite"}`);
            }
        }
    };

    const handleEdit = (question) => {
        console.log("Editing question:", question);
        setCurrentQuestion(question);

        // S'assurer que tous les champs sont correctement extraits
        const questionData = {
            question: question.question,
            evaluationTypeId: question.evaluationTypeId,
            positionId: question.positionId,
            competenceLineId: question.competenceLineId || question.CompetenceLineId || null,
            responseTypeId: question.responseTypeId || question.ResponseTypeId || 1,
            state: question.state || 1
        };

        console.log("Setting form data for edit:", questionData);
        setEditFormData(questionData);

        // Ouvrir la modale
        setShowEditModal(true);
    };

    // Fonction séparée pour gérer la mise à jour depuis la modal
    const handleEditSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            // S'assurer que tous les IDs sont correctement parsés
            const evaluationTypeId = parseInt(editFormData.evaluationTypeId, 10) || 0;
            const positionId = parseInt(editFormData.positionId, 10) || 0;
            const responseTypeId = parseInt(editFormData.responseTypeId, 10) || 1;
            const competenceLineId = editFormData.competenceLineId !== null && editFormData.competenceLineId !== ""
                ? parseInt(editFormData.competenceLineId, 10)
                : null;

            if (!editFormData.question || !evaluationTypeId || !positionId) {
                setError("Veuillez remplir tous les champs obligatoires");
                return;
            }

            const questionId = currentQuestion.id || currentQuestion.questionId || currentQuestion.questiondId;
            console.log(`Mise à jour de la question avec ID: ${questionId}`);

            // Format du DTO utilisé par le backend
            const requestData = {
                QuestionId: questionId,
                Question: editFormData.question.trim(),
                EvaluationTypeId: evaluationTypeId,
                PositionId: positionId,
                CompetenceLineId: competenceLineId,
                ResponseTypeId: responseTypeId,
                State: editFormData.state || 1
            };

            console.log('Envoi des données au format DTO:', requestData);

            setError(null);
            const response = await axios.put(`https://localhost:7082/api/Evaluation/questions/${questionId}`, requestData);
            console.log("Réponse de mise à jour:", response);

            // Fermer la modale après mise à jour
            setShowEditModal(false);
            
            // Rafraîchir les questions
            refreshData();
            resetForm();
            alert('Question mise à jour avec succès');
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la question:", error);
            setError(`Erreur: ${error.message || "Une erreur inconnue s'est produite"}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`https://localhost:7082/api/Evaluation/questions/${id}`);
            fetchAllQuestions();
            // Après suppression, nettoyer la liste des éléments sélectionnés
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    // Fonction de suppression multiple
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer les ${selectedItems.length} questions sélectionnées ?`)) {
            try {
                // Utiliser Promise.all pour gérer les suppressions en parallèle
                await Promise.all(selectedItems.map(id => 
                    axios.delete(`https://localhost:7082/api/Evaluation/questions/${id}`)
                ));
                
                // Rafraîchir les données et réinitialiser les sélections
                fetchAllQuestions();
                setSelectedItems([]);
                setSelectAll(false);
                
                alert(`${selectedItems.length} questions ont été supprimées avec succès.`);
            } catch (error) {
                console.error("Error deleting multiple questions:", error);
                setError("Une erreur s'est produite lors de la suppression des questions: " + (error.response?.data?.error || error.message));
            }
        }
    };
    
    // Fonction pour gérer la sélection des éléments
    const handleSelectItem = (id, isCtrlPressed = false) => {
        if (isCtrlPressed) {
            // Si Ctrl est pressé, on bascule l'état de l'élément
            if (selectedItems.includes(id)) {
                // Désélectionner l'élément
                setSelectedItems(selectedItems.filter(itemId => itemId !== id));
            } else {
                // Sélectionner l'élément en ajoutant à la sélection existante
                setSelectedItems([...selectedItems, id]);
            }
        } else {
            // Si Ctrl n'est pas pressé, on désélectionne tout et on sélectionne uniquement cet élément
            if (selectedItems.includes(id)) {
                // Désélectionner tous les éléments si on clique sur un élément déjà sélectionné
                setSelectedItems([]);
            } else {
                // Sélectionner uniquement cet élément
                setSelectedItems([id]);
            }
            // Mettre à jour le dernier élément sélectionné pour la sélection par plage
            lastSelectedRef.current = id;
        }
        
        // Si on désélectionne des éléments, on doit désactiver "Tout sélectionner"
        if (selectedItems.length !== questions.length) {
            setSelectAll(false);
        }
    };
    
    // Fonction pour sélectionner une plage d'éléments (avec Shift)
    const handleRangeSelect = (id) => {
        if (!lastSelectedRef.current) {
            handleSelectItem(id);
            return;
        }
        
        // Trouver les indices de l'élément actuel et du dernier élément sélectionné
        const currentIndex = questions.findIndex(q => (q.questionId || q.questiondId) === id);
        const lastIndex = questions.findIndex(q => (q.questionId || q.questiondId) === lastSelectedRef.current);
        
        if (currentIndex === -1 || lastIndex === -1) return;
        
        // Déterminer la plage à sélectionner
        const startIndex = Math.min(currentIndex, lastIndex);
        const endIndex = Math.max(currentIndex, lastIndex);
        
        // Récupérer tous les ID de la plage
        const rangeIds = questions.slice(startIndex, endIndex + 1).map(q => q.questionId || q.questiondId);
        
        // Ajouter la plage aux éléments sélectionnés, sans dupliquer
        const newSelection = [...new Set([...selectedItems, ...rangeIds])];
        setSelectedItems(newSelection);
        
        // Mettre à jour le dernier élément sélectionné
        lastSelectedRef.current = id;
    };
    
    // Fonction pour gérer le click sur une ligne avec les modificateurs Ctrl/Shift
    const handleRowClick = (id, e) => {
        // Empêcher la sélection de texte pendant le drag
        e.preventDefault();
        
        if (e.shiftKey) {
            // Sélection par plage avec Shift
            handleRangeSelect(id);
        } else {
            // Sélection normale ou avec Ctrl
            handleSelectItem(id, e.ctrlKey);
        }
    };
    
    // Fonction pour sélectionner/désélectionner tous les éléments de la page actuelle
    const handleSelectAll = () => {
        if (selectAll) {
            // Désélectionner tous les éléments de la page actuelle
            const currentPageIds = questions.map(q => q.questionId || q.questiondId);
            setSelectedItems(selectedItems.filter(id => !currentPageIds.includes(id)));
            setSelectAll(false);
        } else {
            // Sélectionner tous les éléments de la page actuelle
            const currentPageIds = questions.map(q => q.questionId || q.questiondId);
            const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
            setSelectedItems(newSelection);
            setSelectAll(true);
        }
    };

    const resetForm = () => {
        setCurrentQuestion(null);
        setFormData({
            question: '',
            evaluationTypeId: 0,
            positionId: 0,
            competenceLineId: null,
            responseTypeId: 1,
            state: 1
        });
        setEditFormData({
            question: '',
            evaluationTypeId: 0,
            positionId: 0,
            competenceLineId: null,
            responseTypeId: 1,
            state: 1
        });
        setShowEditModal(false);
        setShowAddModal(false);
    };

    return (
        <Template>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-md-12 grid-margin">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="font-weight-bold mb-0">
                                <i className="mdi mdi-comment-question-outline menu-icon"></i> Gestion des Questions d&apos;Évaluation
                            </h4>
                        </div>

                        {error && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Chargement...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="row">
                            <div className="col-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-header title-container d-flex justify-content-between align-items-center">
                                        <h5 className="title mb-0">
                                            <i className="mdi mdi-comment-question-outline"></i> Liste des Questions ({questions.length})
                                        </h5>
                                        <button
                                            className="btn btn-primary btn-sm d-flex align-items-center"
                                            onClick={() => {
                                                resetForm();
                                                setShowAddModal(true);
                                            }}
                                            title="Ajouter une nouvelle question"
                                            style={{ gap: '5px' }}
                                        >
                                            <i className="mdi mdi-plus"></i> Nouvelle question
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <div className="row align-items-end g-3 mb-3">
                                            <div className="col-md-12 mb-3">
                                                <div className="form-group mb-0">
                                                    <label htmlFor="searchQuery" className="form-label">Recherche</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            id="searchQuery"
                                                            className="form-control"
                                                            placeholder="Rechercher par texte de question..."
                                                            value={searchQuery}
                                                            onChange={(e) => {
                                                                setSearchQuery(e.target.value);
                                                                setPageNumber(1); // Revenir à la première page après recherche
                                                            }}
                                                        />
                                                        <button 
                                                            className="btn btn-outline-primary" 
                                                            type="button"
                                                            onClick={() => paginateLocally()}
                                                        >
                                                            <i className="mdi mdi-magnify"></i> Rechercher
                                                        </button>
                                                        {searchQuery && (
                                                            <button 
                                                                className="btn btn-outline-danger" 
                                                                type="button"
                                                                onClick={() => {
                                                                    setSearchQuery('');
                                                                    setPageNumber(1);
                                                                }}
                                                            >
                                                                <i className="mdi mdi-close"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group mb-0">
                                                    <label htmlFor="filterEvaluationType" className="form-label">Type d&apos;Évaluation</label>
                                                    <select
                                                        id="filterEvaluationType"
                                                        value={filterEvaluationType}
                                                        onChange={(e) => {
                                                            setFilterEvaluationType(e.target.value);
                                                            setPageNumber(1); // Revenir à la première page après filtrage
                                                        }}
                                                        className="form-control form-select"
                                                    >
                                                        <option value="">Tous</option>
                                                        {evaluationTypes.map(type => (
                                                            <option key={type.evaluationTypeId} value={type.evaluationTypeId}>
                                                                {type.designation}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group mb-0">
                                                    <label htmlFor="filterPosition" className="form-label">Position</label>
                                                    <select
                                                        id="filterPosition"
                                                        value={filterPosition}
                                                        onChange={(e) => {
                                                            setFilterPosition(e.target.value);
                                                            setPageNumber(1); // Revenir à la première page après filtrage
                                                        }}
                                                        className="form-control form-select"
                                                    >
                                                        <option value="">Tous</option>
                                                        {positions.map(position => (
                                                            <option key={position.positionId} value={position.positionId}>
                                                                {position.positionName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group mb-0">
                                                    <label htmlFor="filterResponseType" className="form-label">Type de réponse</label>
                                                    <select
                                                        id="filterResponseType"
                                                        value={filterResponseType}
                                                        onChange={(e) => {
                                                            setFilterResponseType(e.target.value);
                                                            setPageNumber(1); // Revenir à la première page après filtrage
                                                        }}
                                                        className="form-control form-select"
                                                    >
                                                        <option value="">Tous</option>
                                                        {responseTypes.map(type => {
                                                            const typeId = type.ResponseTypeId !== undefined ? type.ResponseTypeId : type.responseTypeId;
                                                            const typeName = type.TypeName || type.typeName || "Type inconnu";
                                                            return (
                                                                <option key={typeId} value={typeId}>
                                                                    {typeName}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-auto">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    title="Réinitialiser les filtres"
                                                    onClick={() => {
                                                        setFilterEvaluationType('');
                                                        setFilterPosition('');
                                                        setFilterResponseType('');
                                                        setSearchQuery('');
                                                        setPageNumber(1);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faUndo} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12 grid-margin">
                                <div className="card">
                                    <div className="card-header title-container d-flex justify-content-between align-items-center">
                                        <h5 className="title mb-0">
                                            <i className="mdi mdi-format-list-bulleted"></i> Liste des Questions ({questions.length})
                                        </h5>
                                        <div>
                                            {selectedItems.length > 0 && (
                                                <button
                                                    className="btn btn-danger btn-sm me-2"
                                                    onClick={handleDeleteSelected}
                                                    title="Supprimer les questions sélectionnées"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> Supprimer ({selectedItems.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        {questions.length === 0 ? (
                                            <div className="alert alert-info">
                                                Aucune question trouvée. {allQuestions.length > 0 ? "Essayez de modifier vos filtres." : "Veuillez ajouter une nouvelle question."}
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover table-striped" ref={tableRef}>
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th scope="col" style={{ width: '60px', textAlign: 'center' }}>
                                                                <div className="form-check form-check-inline mx-1">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={selectAll}
                                                                        onChange={handleSelectAll}
                                                                        id="selectAllCheckbox"
                                                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th scope="col" style={{ width: '50px' }}>#</th>
                                                            <th scope="col" style={{ width: '40%' }}>Question</th>
                                                            <th scope="col" style={{ width: '20%' }}>Type d&apos;évaluation</th>
                                                            <th scope="col" style={{ width: '15%' }}>Type de réponse</th>
                                                            <th scope="col" className="text-center" style={{ width: '100px' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {questions.map((question, index) => {
                                                            const questionId = question.questionId || question.questiondId;
                                                            const evalType = evaluationTypes.find(type => type.evaluationTypeId === question.evaluationTypeId)?.designation || "N/A";

                                                            // Recherche du type de réponse
                                                            const respType = responseTypes.find(type => {
                                                                const typeId = type.ResponseTypeId !== undefined ? type.ResponseTypeId : type.responseTypeId;
                                                                return typeId === question.responseTypeId || typeId === question.ResponseTypeId;
                                                            });
                                                            const responseTypeName = respType
                                                                ? (respType.TypeName || respType.typeName)
                                                                : "TEXT";

                                                            // Troncature de la question si trop longue
                                                            const truncatedQuestion = question.question.length > 100
                                                                ? question.question.substring(0, 100) + '...'
                                                                : question.question;

                                                            return (
                                                                <tr 
                                                                    key={questionId} 
                                                                    className={selectedItems.includes(questionId) ? 'table-active' : ''}
                                                                    onClick={(e) => handleRowClick(questionId, e)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                                                                        <div className="form-check form-check-inline mx-1">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={selectedItems.includes(questionId)}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSelectItem(questionId, e.ctrlKey);
                                                                                }}
                                                                                id={`checkbox-${questionId}`}
                                                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td>{index + 1 + (pageNumber - 1) * pageSize}</td>
                                                                    <td title={question.question}>{truncatedQuestion}</td>
                                                                    <td>{evalType}</td>
                                                                    <td><span className="badge bg-info">{responseTypeName}</span></td>
                                                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            className="btn btn-outline-success btn-sm me-1"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEdit(question);
                                                                            }}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="mdi mdi-pencil"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
                                                                                    handleDelete(questionId);
                                                                                }
                                                                            }}
                                                                            title="Supprimer"
                                                                        >
                                                                            <i className="mdi mdi-delete"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-center align-items-center mt-4">
                                            <div className="pagination-controls d-flex align-items-center">
                                                <button
                                                    onClick={() => setPageNumber(1)}
                                                    disabled={pageNumber === 1}
                                                    className="btn btn-sm me-2"
                                                    style={{ 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    <i className="mdi mdi-chevron-double-left"></i> Première
                                                </button>
                                                <button
                                                    onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                                                    disabled={pageNumber === 1}
                                                    className="btn btn-sm me-2"
                                                    style={{ 
                                                        minWidth: '100px', 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    <i className="mdi mdi-chevron-left"></i> Précédent
                                                </button>
                                                
                                                {/* Navigation par numéros de page */}
                                                <div className="page-numbers d-flex mx-2">
                                                    {(() => {
                                                        const pageButtons = [];
                                                        
                                                        // Logique pour afficher un nombre limité de boutons de page
                                                        let startPage = Math.max(1, pageNumber - 2);
                                                        let endPage = Math.min(totalPages, startPage + 4);
                                                        
                                                        // Ajuster startPage si on est près de la fin
                                                        if (endPage - startPage < 4) {
                                                            startPage = Math.max(1, endPage - 4);
                                                        }
                                                        
                                                        // Première page et ellipsis si nécessaire
                                                        if (startPage > 1) {
                                                            pageButtons.push(
                                                                <button 
                                                                    key={1} 
                                                                    className={`btn btn-sm mx-1 ${pageNumber === 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setPageNumber(1)}
                                                                >
                                                                    1
                                                                </button>
                                                            );
                                                            if (startPage > 2) {
                                                                pageButtons.push(<span key="ellipsis1" className="mx-1">...</span>);
                                                            }
                                                        }
                                                        
                                                        // Pages numériques
                                                        for (let i = startPage; i <= endPage; i++) {
                                                            pageButtons.push(
                                                                <button 
                                                                    key={i} 
                                                                    className={`btn btn-sm mx-1 ${pageNumber === i ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setPageNumber(i)}
                                                                >
                                                                    {i}
                                                                </button>
                                                            );
                                                        }
                                                        
                                                        // Dernière page et ellipsis si nécessaire
                                                        if (endPage < totalPages) {
                                                            if (endPage < totalPages - 1) {
                                                                pageButtons.push(<span key="ellipsis2" className="mx-1">...</span>);
                                                            }
                                                            pageButtons.push(
                                                                <button 
                                                                    key={totalPages} 
                                                                    className={`btn btn-sm mx-1 ${pageNumber === totalPages ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setPageNumber(totalPages)}
                                                                >
                                                                    {totalPages}
                                                                </button>
                                                            );
                                                        }
                                                        
                                                        return pageButtons;
                                                    })()}
                                                </div>
                                                
                                                <button
                                                    onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
                                                    disabled={pageNumber === totalPages}
                                                    className="btn btn-sm me-2"
                                                    style={{ 
                                                        minWidth: '100px', 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    Suivant <i className="mdi mdi-chevron-right"></i>
                                                </button>
                                                <button
                                                    onClick={() => setPageNumber(totalPages)}
                                                    disabled={pageNumber === totalPages}
                                                    className="btn btn-sm me-2"
                                                    style={{ 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    Dernière <i className="mdi mdi-chevron-double-right"></i>
                                                </button>
                                                
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(Number(e.target.value));
                                                        setPageNumber(1); // Réinitialiser à la première page lorsque la taille de la page change
                                                    }}
                                                    className="form-select form-select-sm" 
                                                    style={{ width: '120px' }}
                                                >
                                                    <option value={5}>5 par page</option>
                                                    <option value={10}>10 par page</option>
                                                    <option value={20}>20 par page</option>
                                                    <option value={50}>50 par page</option>
                                                    <option value={100}>100 par page</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal pour ajouter une question */}
                        {showAddModal && (
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
                                        setShowAddModal(false);
                                    }
                                }}
                            >
                                <div className="modal-dialog modal-lg modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">
                                                <i className="mdi mdi-file-document-plus"></i> Ajouter une question
                                            </h5>
                                            <button type="button" className="close text-dark" onClick={() => setShowAddModal(false)}>
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={handleSubmit}>
                                                <div className="row mb-3">
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <label htmlFor="add-question" className="form-label">
                                                                <i className="mdi mdi-comment-question-outline"></i> Question
                                                            </label>
                                                            <textarea
                                                                name="question"
                                                                id="add-question"
                                                                value={formData.question}
                                                                onChange={handleInputChange}
                                                                className="form-control"
                                                                placeholder="Entrez la question"
                                                                rows="3"
                                                                required
                                                            ></textarea>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="add-evaluationTypeId" className="form-label">Type d&apos;Évaluation</label>
                                                            <select
                                                                name="evaluationTypeId"
                                                                id="add-evaluationTypeId"
                                                                value={formData.evaluationTypeId}
                                                                onChange={handleInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                <option value="">Sélectionnez un type</option>
                                                                {evaluationTypes.map(type => (
                                                                    <option key={type.evaluationTypeId} value={type.evaluationTypeId}>
                                                                        {type.designation}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="add-positionId" className="form-label">Position</label>
                                                            <select
                                                                name="positionId"
                                                                id="add-positionId"
                                                                value={formData.positionId}
                                                                onChange={handleInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                <option value="">Sélectionnez une position</option>
                                                                {positions.map(position => (
                                                                    <option key={position.positionId} value={position.positionId}>
                                                                        {position.positionName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="add-responseTypeId" className="form-label">Type de Réponse</label>
                                                            <select
                                                                name="responseTypeId"
                                                                id="add-responseTypeId"
                                                                value={formData.responseTypeId}
                                                                onChange={handleInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                {responseTypes.map(type => {
                                                                    const typeId = type.ResponseTypeId !== undefined ? type.ResponseTypeId : type.responseTypeId;
                                                                    const typeName = type.TypeName || type.typeName || "Type inconnu";
                                                                    const description = type.Description || type.description || "";

                                                                    return (
                                                                        <option key={typeId} value={typeId}>
                                                                            {typeName}{description ? ` - ${description}` : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="add-competenceLineId" className="form-label">Ligne de Compétence (optionnel)</label>
                                                            <select
                                                                name="competenceLineId"
                                                                id="add-competenceLineId"
                                                                value={formData.competenceLineId || ''}
                                                                onChange={handleInputChange}
                                                                className="form-control form-select"
                                                            >
                                                                <option value="">Aucune</option>
                                                                {competenceLines.map(comp => {
                                                                    const compId = comp.CompetenceLineId !== undefined ? comp.CompetenceLineId : comp.competenceLineId;
                                                                    const description = comp.Description || comp.description || comp.competenceName || "Ligne de compétence sans description";

                                                                    return (
                                                                        <option key={compId} value={compId}>
                                                                            {description}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-light btn-fw" onClick={() => setShowAddModal(false)}>
                                                <i className="mdi mdi-close-circle"></i> Annuler
                                            </button>
                                            <button type="button" className="btn btn-success btn-fw" onClick={handleSubmit}>
                                                <i className="mdi mdi-content-save"></i> Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal pour modifier une question */}
                        {showEditModal && (
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
                                        setShowEditModal(false);
                                    }
                                }}
                            >
                                <div className="modal-dialog modal-lg modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">
                                                <i className="mdi mdi-file-document-edit"></i> Modifier la question
                                            </h5>
                                            <button type="button" className="close text-dark" onClick={() => setShowEditModal(false)}>
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={handleEditSubmit}>
                                                <div className="row mb-3">
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <label htmlFor="edit-question" className="form-label">
                                                                <i className="mdi mdi-comment-question-outline"></i> Question
                                                            </label>
                                                            <textarea
                                                                name="question"
                                                                id="edit-question"
                                                                value={editFormData.question}
                                                                onChange={handleEditInputChange}
                                                                className="form-control"
                                                                placeholder="Entrez la question"
                                                                rows="3"
                                                                required
                                                            ></textarea>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="edit-evaluationTypeId" className="form-label">Type d&apos;Évaluation</label>
                                                            <select
                                                                name="evaluationTypeId"
                                                                id="edit-evaluationTypeId"
                                                                value={editFormData.evaluationTypeId}
                                                                onChange={handleEditInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                <option value="">Sélectionnez un type</option>
                                                                {evaluationTypes.map(type => (
                                                                    <option key={type.evaluationTypeId} value={type.evaluationTypeId}>
                                                                        {type.designation}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="edit-positionId" className="form-label">Position</label>
                                                            <select
                                                                name="positionId"
                                                                id="edit-positionId"
                                                                value={editFormData.positionId}
                                                                onChange={handleEditInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                <option value="">Sélectionnez une position</option>
                                                                {positions.map(position => (
                                                                    <option key={position.positionId} value={position.positionId}>
                                                                        {position.positionName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="edit-responseTypeId" className="form-label">Type de Réponse</label>
                                                            <select
                                                                name="responseTypeId"
                                                                id="edit-responseTypeId"
                                                                value={editFormData.responseTypeId}
                                                                onChange={handleEditInputChange}
                                                                className="form-control form-select"
                                                                required
                                                            >
                                                                {responseTypes.map(type => {
                                                                    const typeId = type.ResponseTypeId !== undefined ? type.ResponseTypeId : type.responseTypeId;
                                                                    const typeName = type.TypeName || type.typeName || "Type inconnu";
                                                                    const description = type.Description || type.description || "";

                                                                    return (
                                                                        <option key={typeId} value={typeId}>
                                                                            {typeName}{description ? ` - ${description}` : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <label htmlFor="edit-competenceLineId" className="form-label">Ligne de Compétence (optionnel)</label>
                                                            <select
                                                                name="competenceLineId"
                                                                id="edit-competenceLineId"
                                                                value={editFormData.competenceLineId || ''}
                                                                onChange={handleEditInputChange}
                                                                className="form-control form-select"
                                                            >
                                                                <option value="">Aucune</option>
                                                                {competenceLines.map(comp => {
                                                                    const compId = comp.CompetenceLineId !== undefined ? comp.CompetenceLineId : comp.competenceLineId;
                                                                    const description = comp.Description || comp.description || comp.competenceName || "Ligne de compétence sans description";

                                                                    return (
                                                                        <option key={compId} value={compId}>
                                                                            {description}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-light btn-fw" onClick={() => setShowEditModal(false)}>
                                                <i className="mdi mdi-close-circle"></i> Annuler
                                            </button>
                                            <button type="button" className="btn btn-success btn-fw" onClick={handleEditSubmit}>
                                                <i className="mdi mdi-content-save"></i> Mettre à jour
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Template>
    );
}

export default QuestionEvaluation;