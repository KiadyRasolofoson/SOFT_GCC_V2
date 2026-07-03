import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Template from "../../Template";
import { useUser } from "../../Authentification/UserContext";
import PermissionService from "../../../services/PermissionService";
import {
    Box, Typography, Card, CardContent,
    TextField, Button, Grid, Slider,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Alert, CircularProgress,
    IconButton, Divider, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions
} from '@mui/material';
import { FaClock, FaSave, FaEdit, FaArrowLeft, FaMagic } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminSettings = () => {
    const navigate = useNavigate();
    const { hasPermission } = useUser();

    // États pour les données et le chargement
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [timeConfigs, setTimeConfigs] = useState({});
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // États pour la pagination côté client
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // État pour le dialogue de configuration rapide
    const [bulkConfigOpen, setBulkConfigOpen] = useState(false);
    const [bulkConfigValues, setBulkConfigValues] = useState({
        QCM: 2, // Valeur par défaut pour QCM (2 minutes)
        TEXT: 10, // Valeur par défaut pour questions ouvertes (10 minutes)
        SCORE: 20, // Valeur par défaut pour questions d'évaluation (20 minutes)
    });

    // Vérifier l'accès
    useEffect(() => {
        const canAccess = PermissionService.hasFunctionalPermission(hasPermission, 'EVAL_SETTINGS');
        if (!canAccess) {
            toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page");
            navigate('/evaluations');
        } else {
            fetchEvaluations();
        }
    }, [hasPermission, navigate]);

    // Récupérer la liste des évaluations
    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://localhost:7082/api/evaluation/templates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvaluations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du chargement des évaluations:', error);
            setError('Impossible de charger la liste des évaluations. Veuillez réessayer.');
            setLoading(false);
        }
    };

    // Récupérer les questions d'une évaluation spécifique
    const fetchEvaluationQuestions = async (evaluationTypeId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Utiliser l'endpoint original
            const response = await axios.get(`https://localhost:7082/api/evaluation/${evaluationTypeId}/questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Formater les données des questions pour normaliser les propriétés
            const questionsData = response.data.map(q => ({
                questionId: q.questionId || q.questiondId,
                text: q.text || q.question,
                question: q.question || q.text,
                responseType: q.responseType || (q.responseTypeId === 1 ? 'TEXT' : q.responseTypeId === 2 ? 'QCM' : 'SCORE'),
                responseTypeId: q.responseTypeId || (q.responseType === 'TEXT' ? 1 : q.responseType === 'QCM' ? 2 : 3),
                maxTimeInMinutes: q.maxTimeInMinutes || 15
            }));
            
            setQuestions(questionsData);
            
            // Initialiser les configurations de temps
            const configs = {};
            questionsData.forEach(question => {
                configs[question.questionId] = question.maxTimeInMinutes || 15;
            });
            setTimeConfigs(configs);

            // Calculer le nombre total de pages
            setTotalPages(Math.ceil(questionsData.length / pageSize));
            
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du chargement des questions:', error);
            setError('Impossible de charger les questions. Veuillez réessayer.');
            setLoading(false);
        }
    };

    // Effet pour recalculer le nombre de pages lorsque le pageSize change
    useEffect(() => {
        if (questions.length > 0) {
            setTotalPages(Math.ceil(questions.length / pageSize));
            // Réajuster la page courante si nécessaire
            if (page > Math.ceil(questions.length / pageSize)) {
                setPage(1);
            }
        }
    }, [pageSize, questions]);

    // Gérer le changement de page
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Gérer le changement de taille de page
    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setPage(1);
    };

    // Obtenir les questions de la page courante
    const getPaginatedQuestions = () => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return questions.slice(startIndex, endIndex);
    };

    // Gérer la sélection d'une évaluation
    const handleEvaluationSelect = (evaluation) => {
        setSelectedEvaluation(evaluation);
        setPage(1); // Réinitialiser à la première page
        fetchEvaluationQuestions(evaluation.id);
        setError('');
        setSuccessMessage('');
    };

    // Gérer la modification du temps pour une question
    const handleTimeChange = (questionId, newValue) => {
        setTimeConfigs({
            ...timeConfigs,
            [questionId]: newValue
        });
        setHasChanges(true);
    };

    // Ouvrir le dialogue de configuration rapide
    const openBulkConfig = () => {
        setBulkConfigOpen(true);
    };

    // Fermer le dialogue de configuration rapide
    const closeBulkConfig = () => {
        setBulkConfigOpen(false);
    };

    // Gérer le changement des valeurs de configuration rapide
    const handleBulkConfigChange = (type, value) => {
        setBulkConfigValues({
            ...bulkConfigValues,
            [type]: value
        });
    };

    // Appliquer la configuration rapide
    const applyBulkConfig = () => {
        const newTimeConfigs = { ...timeConfigs };
        questions.forEach(question => {
            const type = question.responseType || 'TEXT';
            if (bulkConfigValues[type] !== undefined) {
                newTimeConfigs[question.questionId] = bulkConfigValues[type];
            }
        });
        setTimeConfigs(newTimeConfigs);
        setBulkConfigOpen(false);
        setHasChanges(true);
        toast.success('Configuration rapide appliquée avec succès');
    };

    // Réinitialiser les temps à la valeur par défaut
    const resetToDefaultTimes = () => {
        const defaultConfigs = {};
        questions.forEach(question => {
            defaultConfigs[question.questionId] = 15;
        });
        setTimeConfigs(defaultConfigs);
        setHasChanges(true);
        toast.info('Toutes les questions ont été réinitialisées à 15 minutes');
    };

    // Sauvegarder les configurations de temps
    const saveTimeConfigurations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const questionsWithTime = questions.map(question => ({
                questionId: question.questionId,
                maxTimeInMinutes: timeConfigs[question.questionId] || 15
            }));

            const response = await axios.post(
                `https://localhost:7082/api/evaluation/questions/update-time`,
                questionsWithTime,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccessMessage('Les configurations de temps ont été enregistrées avec succès.');
                toast.success('Configurations de temps sauvegardées');
                setHasChanges(false);
            } else {
                setError('Une erreur est survenue lors de la sauvegarde.');
                toast.error('Échec de la sauvegarde des configurations');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des configurations:', error);
            setError('Impossible de sauvegarder les configurations. Veuillez réessayer.');
            toast.error('Échec de la sauvegarde des configurations');
        } finally {
            setLoading(false);
        }
    };

    // Gérer le retour à la liste des évaluations
    const handleBackToList = () => {
        setSelectedEvaluation(null);
        setQuestions([]);
        setTimeConfigs({});
        setError('');
        setSuccessMessage('');
        setHasChanges(false);
    };

    // Obtenir les statistiques des types de questions
    const getQuestionTypeStats = () => {
        if (!questions || questions.length === 0) return {};

        return questions.reduce((stats, question) => {
            const type = question.responseType || 'TEXT';
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});
    };

    if (loading && !selectedEvaluation) {
        return (
            <Template>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Template>
        );
    }

    return (
        <Template>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Administration des Évaluations
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Configurez les paramètres avancés des évaluations, notamment le temps alloué par question.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {successMessage}
                </Alert>
            )}

            {!selectedEvaluation ? (
                // Liste des évaluations
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Sélectionnez une évaluation à configurer
                        </Typography>

                        {evaluations.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                Aucune évaluation disponible.
                            </Typography>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Type d'évaluation</TableCell>
                                            <TableCell>Nombre de questions</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {evaluations.map((evaluation) => (
                                            <TableRow key={evaluation.id}>
                                                <TableCell>
                                                    {evaluation.description && evaluation.description.length > 50
                                                        ? `${evaluation.description.substring(0, 50)}...`
                                                        : evaluation.description}
                                                </TableCell>
                                                <TableCell>{evaluation.questionCount || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<FaEdit />}
                                                        onClick={() => handleEvaluationSelect(evaluation)}
                                                    >
                                                        Configurer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            ) : (
                // Configuration du temps par question pour l'évaluation sélectionnée
                <>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={handleBackToList} title="Retour à la liste" sx={{ mr: 2 }}>
                            <FaArrowLeft />
                        </IconButton>
                        <Typography variant="h6">
                            Configuration du temps - {selectedEvaluation.title}
                        </Typography>
                    </Box>

                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <FaClock style={{ marginRight: '8px', color: '#f57c00' }} />
                                <Typography variant="h6" color="primary">
                                    Temps par question
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                Définissez le temps maximum (en minutes) que les candidats auront pour répondre à chaque question.
                            </Typography>

                            {/* Statistiques des types de questions */}
                            {questions.length > 0 && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Répartition des types de questions:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {Object.entries(getQuestionTypeStats()).map(([type, count]) => (
                                            <Grid item key={type}>
                                                <Chip
                                                    label={`${type}: ${count} question${count > 1 ? 's' : ''}`}
                                                    color={type === 'QCM' ? 'primary' : type === 'SCORE' ? 'error' : 'secondary'}
                                                    sx={{ fontWeight: 'medium' }}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<FaMagic />}
                                        onClick={openBulkConfig}
                                        sx={{ mr: 2 }}
                                    >
                                        Configuration rapide par type
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={resetToDefaultTimes}
                                        sx={{ mr: 2 }}
                                    >
                                        Réinitialiser à 15 minutes
                                    </Button>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FaSave />}
                                    onClick={saveTimeConfigurations}
                                    disabled={loading || !hasChanges}
                                    size="large"
                                >
                                    {loading ? 'Sauvegarde en cours...' : 'Sauvegarder les configurations'}
                                </Button>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <>
                                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width="5%">#</TableCell>
                                                    <TableCell width="40%">Question</TableCell>
                                                    <TableCell width="15%">Type</TableCell>
                                                    <TableCell width="40%">Temps (minutes)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {getPaginatedQuestions().map((question, index) => (
                                                    <TableRow key={question.questionId}>
                                                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                                                        <TableCell>
                                                            {question.text && question.text.length > 100
                                                                ? `${question.text.substring(0, 100)}...`
                                                                : question.text}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={question.responseType}
                                                                color={
                                                                    question.responseType === 'QCM' ? 'primary' :
                                                                    question.responseType === 'SCORE' ? 'error' : 'secondary'
                                                                }
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Grid container spacing={2} alignItems="center">
                                                                <Grid item xs={8}>
                                                                    <Slider
                                                                        value={timeConfigs[question.questionId] || 15}
                                                                        min={1}
                                                                        max={60}
                                                                        step={1}
                                                                        marks={[
                                                                            { value: 1, label: '1m' },
                                                                            { value: 15, label: '15m' },
                                                                            { value: 30, label: '30m' },
                                                                            { value: 60, label: '60m' },
                                                                        ]}
                                                                        valueLabelDisplay="auto"
                                                                        onChange={(e, newValue) => handleTimeChange(question.questionId, newValue)}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={4}>
                                                                    <TextField
                                                                        label="Minutes"
                                                                        type="number"
                                                                        InputProps={{ inputProps: { min: 1, max: 60 } }}
                                                                        value={timeConfigs[question.questionId] || 15}
                                                                        onChange={(e) => {
                                                                            const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 60);
                                                                            handleTimeChange(question.questionId, value);
                                                                        }}
                                                                        fullWidth
                                                                        size="small"
                                                                    />
                                                                </Grid>
                                                            </Grid>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Contrôles de pagination */}
                                    {questions.length > 0 && (
                                        <div className="d-flex justify-content-center align-items-center mt-4">
                                            <div className="pagination-controls d-flex align-items-center">
                                                <button
                                                    onClick={() => handlePageChange(Math.max(page - 1, 1))}
                                                    disabled={page === 1}
                                                    className="btn btn-sm me-2"
                                                    style={{
                                                        minWidth: '100px',
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    <i className="mdi mdi-chevron-left"></i> Précédent
                                                </button>
                                                <span className="mx-3">
                                                    Page {page} sur {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
                                                    disabled={page === totalPages}
                                                    className="btn btn-sm me-3"
                                                    style={{
                                                        minWidth: '100px',
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    Suivant <i className="mdi mdi-chevron-right"></i>
                                                </button>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                                    className="form-select form-select-sm"
                                                    style={{ width: '120px' }}
                                                >
                                                    <option value={5}>5 par page</option>
                                                    <option value={10}>10 par page</option>
                                                    <option value={20}>20 par page</option>
                                                    <option value={50}>50 par page</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dialogue pour la configuration rapide par type */}
                    <Dialog open={bulkConfigOpen} onClose={closeBulkConfig} maxWidth="sm" fullWidth>
                        <DialogTitle>
                            Configuration rapide du temps par type de question
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Définissez le temps standard pour chaque type de question. Ces valeurs seront appliquées à toutes les questions du type correspondant.
                            </Typography>

                            <Grid container spacing={3}>
                                {/* Configuration pour QCM */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Questions à choix multiples (QCM)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Recommandé: 1-3 minutes - Questions simples avec options prédéfinies
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={9}>
                                            <Slider
                                                value={bulkConfigValues.QCM}
                                                min={1}
                                                max={10}
                                                step={1}
                                                marks={[
                                                    { value: 1, label: '1m' },
                                                    { value: 3, label: '3m' },
                                                    { value: 5, label: '5m' },
                                                    { value: 10, label: '10m' },
                                                ]}
                                                valueLabelDisplay="auto"
                                                onChange={(e, newValue) => handleBulkConfigChange('QCM', newValue)}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <TextField
                                                label="Minutes"
                                                type="number"
                                                InputProps={{ inputProps: { min: 1, max: 60 } }}
                                                value={bulkConfigValues.QCM}
                                                onChange={(e) => {
                                                    const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 60);
                                                    handleBulkConfigChange('QCM', value);
                                                }}
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Configuration pour TEXT */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Questions ouvertes (TEXT)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Recommandé: 5-10 minutes - Questions nécessitant une réponse élaborée
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={9}>
                                            <Slider
                                                value={bulkConfigValues.TEXT}
                                                min={1}
                                                max={30}
                                                step={1}
                                                marks={[
                                                    { value: 5, label: '5m' },
                                                    { value: 10, label: '10m' },
                                                    { value: 20, label: '20m' },
                                                    { value: 30, label: '30m' },
                                                ]}
                                                valueLabelDisplay="auto"
                                                onChange={(e, newValue) => handleBulkConfigChange('TEXT', newValue)}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <TextField
                                                label="Minutes"
                                                type="number"
                                                InputProps={{ inputProps: { min: 1, max: 60 } }}
                                                value={bulkConfigValues.TEXT}
                                                onChange={(e) => {
                                                    const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 60);
                                                    handleBulkConfigChange('TEXT', value);
                                                }}
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Configuration pour SCORE */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Questions d&apos;évaluation (SCORE)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Recommandé: 15-30 minutes - Questions complexes d&apos;analyse ou d&apos;évaluation
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={9}>
                                            <Slider
                                                value={bulkConfigValues.SCORE}
                                                min={5}
                                                max={60}
                                                step={5}
                                                marks={[
                                                    { value: 15, label: '15m' },
                                                    { value: 30, label: '30m' },
                                                    { value: 45, label: '45m' },
                                                    { value: 60, label: '60m' },
                                                ]}
                                                valueLabelDisplay="auto"
                                                onChange={(e, newValue) => handleBulkConfigChange('SCORE', newValue)}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <TextField
                                                label="Minutes"
                                                type="number"
                                                InputProps={{ inputProps: { min: 1, max: 60 } }}
                                                value={bulkConfigValues.SCORE}
                                                onChange={(e) => {
                                                    const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 60);
                                                    handleBulkConfigChange('SCORE', value);
                                                }}
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeBulkConfig} color="inherit">
                                Annuler
                            </Button>
                            <Button
                                onClick={applyBulkConfig}
                                variant="contained"
                                color="primary"
                                startIcon={<FaMagic />}
                            >
                                Appliquer à toutes les questions
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Template>
    );
};

export default AdminSettings; 