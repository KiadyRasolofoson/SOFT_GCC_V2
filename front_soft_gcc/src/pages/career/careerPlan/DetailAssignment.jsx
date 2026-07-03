import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import AppointmentForm from '../../../components/career/AppointmentForm';
import AdvancementForm from '../../../components/career/AdvancementForm';
import LayOffForm from '../../../components/career/LayOffForm';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import { useParams } from 'react-router-dom';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import Loader from '../../../helpers/Loader';
import { useNavigate } from 'react-router-dom';

// Page pour consulter les détails d'un plan de carrière
function DetailAssignment() {
    // Url d'en-tete de page
    const module = "Plan de carrière";
    const action = "Detail";
    const url = "/carriere";

    // Initialisation des variables états
    const { CareerPlanId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentToEdit, setAssignmentToEdit] = useState({});
    const [state, seState] = useState('');
    const [assignmentType, setAssignmentType] = useState({});
    const [selectedItem, setSelectedItem] = useState(0);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        assignmentTypeId: undefined,
        registrationNumber: undefined,
        decisionNumber: undefined,
        decisionDate: undefined,
        assignmentDate: undefined,
        description: undefined,
        establishmentId: undefined,
        departmentId: undefined,
        positionId: undefined,
        employeeTypeId: undefined,
        socioCategoryProfessionalId: undefined,
        indicationId: undefined,
        baseSalary: undefined,
        netSalary: undefined,
        professionalCategoryId: undefined,
        legalClassId: undefined,
        newsletterTemplateId: undefined,
        paymentMethodId: undefined,
        endingContract: undefined,
        reason: undefined,
        assigningInstitution: undefined,
        startDate: undefined,
        endDate: undefined,
        echelonId: undefined,
        state: 1,
    });

    // Formate une date ou retourne une chaîne vide si invalide
    const formatDate = (date) => {
        if (!date) return '';
        const parsedDate = new Date(date);
        return isNaN(parsedDate) ? '' : parsedDate.toISOString().split('T')[0];
    };

    // Récupération des données
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const careerPlanResponse = await axios.get(urlApi(`/CareerPlan/${CareerPlanId}`));
            const assignmentData = careerPlanResponse.data || null;
            setAssignmentToEdit(assignmentData);
            setSelectedItem(assignmentData.assignmentTypeId);

            const assignmentTypeResponse = await axios.get(urlApi(`/AssignmentType/${assignmentData.assignmentTypeId}`));
            setAssignmentType(assignmentTypeResponse.data || {});
        } catch (err) {
            console.error(err);
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Remplit les données du formulaire après récupération
    useEffect(() => {
        if (CareerPlanId) {
            fetchData();
        }
    }, [CareerPlanId]);

    // UseEffect pour ajouter des valeurs par défaut dans le formulaire de modification
    useEffect(() => {
        if (assignmentToEdit) {
            setFormData({
                careerPlanId: assignmentToEdit.careerPlanId,
                assignmentTypeId: assignmentToEdit.assignmentTypeId || undefined,
                registrationNumber: assignmentToEdit.registrationNumber || undefined,
                decisionNumber: assignmentToEdit.decisionNumber || undefined,
                decisionDate: formatDate(assignmentToEdit.decisionDate),
                assignmentDate: formatDate(assignmentToEdit.assignmentDate),
                description: assignmentToEdit.description || undefined,
                establishmentId: assignmentToEdit.establishmentId || undefined,
                departmentId: assignmentToEdit.departmentId || undefined,
                positionId: assignmentToEdit.positionId || undefined,
                employeeTypeId: assignmentToEdit.employeeTypeId || undefined,
                socioCategoryProfessionalId: assignmentToEdit.socioCategoryProfessionalId || undefined,
                indicationId: assignmentToEdit.indicationId || undefined,
                baseSalary: assignmentToEdit.baseSalary || undefined,
                netSalary: assignmentToEdit.netSalary || undefined,
                professionalCategoryId: assignmentToEdit.professionalCategoryId || undefined,
                legalClassId: assignmentToEdit.legalClassId || undefined,
                newsletterTemplateId: assignmentToEdit.newsletterTemplateId || undefined,
                paymentMethodId: assignmentToEdit.paymentMethodId || undefined,
                endingContract: formatDate(assignmentToEdit.endingContract),
                reason: assignmentToEdit.reason || undefined,
                assigningInstitution: assignmentToEdit.assigningInstitution || undefined,
                startDate: formatDate(assignmentToEdit.startDate),
                endDate: formatDate(assignmentToEdit.endDate),
                echelonId: assignmentToEdit.echelonId || undefined,
                state: assignmentToEdit.state,
            });
        }
    }, [assignmentToEdit]);

    // Gestion des changements dans le formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Soumission des données
    const handleSubmit = async () => {
        try {
             // Nettoyer les données : remplacer les valeurs undefined ou vides par null
            const dataToSend = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [
                    key,
                    value === undefined || value === "" ? null : value, // Remplace les valeurs invalides par null
                ])
            );

            // Ajout de la date de mise à jour
            dataToSend.updatedDate = new Date().toISOString();
            await axios.put(urlApi(`/CareerPlan/${assignmentToEdit.careerPlanId}`), dataToSend);
            await fetchData();
        } catch (err) {
            console.error(`Erreur lors de la modification : ${err.message}`);
        }
    };

    const handleRetour = () => {
        navigate(`/softGcc/carriere/fiche/${assignmentToEdit.registrationNumber}`);
    };

    return (
        <Template>
            {isLoading && <Loader />}
            {error && <div className="alert alert-danger">Erreur : {error}</div>}
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-map-marker-path skill-icon"></i>
                    <p className="skill-title">DETAILS PLAN DE CARRIÈRE</p>
                </div>
                <div className="col-lg-2">
                    <button onClick={handleRetour} className="btn-outline-dark btn-fw" style={{float: 'right'}}>
                        <i className="mdi mdi-arrow-left-circle icon-cancel" style={{}}></i>
                        Retour
                    </button>
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/SoftGcc/tableauBord' },
                    { label: 'Plan de carrière', path: '/SoftGcc/carriere' },
                    { label: 'Fiche carrière', path: `/softGcc/carriere/fiche/${assignmentToEdit.registrationNumber}` },
                    { label: 'Détails', path: `SoftGcc/carriere/fiche/edit/${CareerPlanId}` }
                ]}
            />
            <Alert variant="warning" className="mb-4">
                Le plan de carriere est clôturé
            </Alert>

            <form className="forms-sample">
                <div className="row">
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                <div className="form-group">
                                    <label>Matricule</label>
                                    <select name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="form-control">
                                        <option value={assignmentToEdit.registrationNumber}>
                                            {assignmentToEdit.registrationNumber}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                <div className="form-group">
                                    <label>Type d'affectation</label>
                                    <select name="assignmentTypeId" value={formData.assignmentTypeId || ''} onChange={handleChange} className="form-control">
                                        {assignmentType && (
                                            <option key={assignmentType.assignmentTypeId} value={assignmentType.assignmentTypeId}>
                                                {assignmentType.assignmentTypeName}
                                            </option>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Numéro de décision</label>
                                    <input type="text" name="decisionNumber" value={formData.decisionNumber} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Date de décision</label>
                                    <input type="date" name="decisionDate" value={formData.decisionDate} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Date d'affectation</label>
                                    <input type="date" name="assignmentDate" value={formData.assignmentDate} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-control" rows="4"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedItem === 1 ? ( // Type nomination
                    <AppointmentForm formData={formData} setFormData={setFormData} />
                ) : selectedItem === 2 ? (  // Type mise en disponibilité
                    <LayOffForm handleChange={handleChange} formData={formData} />
                ) : selectedItem === 3 ? (  // Type avancement
                    <AdvancementForm handleChange={handleChange} formData={formData} />
                ) : (
                    <p>Aucune affectation détectée</p>
                )}
            </form>
        </Template>
    );
}

export default DetailAssignment;
