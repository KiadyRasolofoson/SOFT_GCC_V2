import { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import EvaluationTypeService from '../../../services/Evaluations/EvaluationTypeService';
import { toast } from 'react-toastify'; // Assurez-vous d'avoir react-toastify ou un système de notification similaire

function EvaluationTypesSettings() {
    const [evaluationTypes, setEvaluationTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [currentEvaluationType, setCurrentEvaluationType] = useState(null); // Pour l'édition
    const [formData, setFormData] = useState({ designation: '', state: 1 });

    const fetchEvaluationTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await EvaluationTypeService.getEvaluationTypes();
            setEvaluationTypes(response.data.map(et => ({ 
                ...et,
                evaluationTypeId: et.evaluationTypeId || et.evaluation_type_id 
            })));
            setError(null);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la récupération des types d\'évaluation.';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchEvaluationTypes();
    }, [fetchEvaluationTypes]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({ designation: '', state: 1 });
        setCurrentEvaluationType(null);
    };

    const handleOpenModal = (evaluationType = null) => {
        if (evaluationType) {
            setCurrentEvaluationType(evaluationType);
            setFormData({ 
                designation: evaluationType.designation
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        resetForm();
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        let dataToSend;
        try {
            if (currentEvaluationType && currentEvaluationType.evaluationTypeId) {
                dataToSend = {
                    evaluationTypeId: currentEvaluationType.evaluationTypeId,
                    designation: formData.designation
                };
                await EvaluationTypeService.updateEvaluationType(currentEvaluationType.evaluationTypeId, dataToSend);
                toast.success('Type d\'évaluation mis à jour avec succès !');
            } else {
                dataToSend = {
                    designation: formData.designation,
                    state: 1
                };
                await EvaluationTypeService.createEvaluationType(dataToSend);
                toast.success('Type d\'évaluation créé avec succès !');
            }
            fetchEvaluationTypes();
            handleCloseModal();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la soumission.';
            setError(errorMsg);
            toast.error(errorMsg);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type d\'évaluation ?')) {
            setIsLoading(true);
            try {
                await EvaluationTypeService.deleteEvaluationType(id);
                toast.success('Type d\'évaluation supprimé avec succès !');
                fetchEvaluationTypes();
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la suppression.';
                setError(errorMsg);
                toast.error(errorMsg);
            }
            setIsLoading(false);
        }
    };

    return (
        <Template>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-md-12 grid-margin">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="font-weight-bold mb-0">
                                <i className="mdi mdi-format-list-bulleted-type menu-icon"></i> Gestion des Types d&apos;Évaluation
                            </h4>
                            <button className="btn btn-primary" onClick={() => handleOpenModal()}>Ajouter un Type</button>
                        </div>
                    </div>
                </div>

                {isLoading && <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="sr-only">Chargement...</span></div></div>}
                {error && <p className="text-danger text-center">{error}</p>}

                <div className="row">
                    <div className="col-lg-12 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                <h4 className="card-title">Liste des Types d&apos;Évaluation</h4>
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Désignation</th>
                                                {/* <th>État</th> */}
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evaluationTypes.map(et => (
                                                <tr key={et.evaluationTypeId}>
                                                    <td>{et.designation}</td>
                                                    {/* <td>{et.state === 1 ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Inactif</span>}</td> */}
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-info mr-2" onClick={() => handleOpenModal(et)}><i className="mdi mdi-pencil"></i></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(et.evaluationTypeId)}><i className="mdi mdi-delete"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {evaluationTypes.length === 0 && !isLoading && (
                                                <tr>
                                                    <td colSpan="2" className="text-center">Aucun type d&apos;évaluation trouvé.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal pour Ajouter/Modifier */} 
                {showModal && (
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">{currentEvaluationType ? 'Modifier le' : 'Ajouter un'} Type d&apos;Évaluation</h5>
                                        <button type="button" className="close" onClick={handleCloseModal} aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="form-group">
                                            <label htmlFor="designation">Désignation</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                id="designation"
                                                name="designation"
                                                value={formData.designation}
                                                onChange={handleInputChange}
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Annuler</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? 'Sauvegarde...' : (currentEvaluationType ? 'Modifier' : 'Créer')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Template>
    );
}

export default EvaluationTypesSettings;
