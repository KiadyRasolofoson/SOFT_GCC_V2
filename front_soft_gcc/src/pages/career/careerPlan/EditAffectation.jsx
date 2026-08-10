import { useState, useEffect, useMemo } from 'react';
import Template from '../../Template';
import AppointmentForm from '../../../components/career/AppointmentForm';
import AdvancementForm from '../../../components/career/AdvancementForm';
import LayOffForm from '../../../components/career/LayOffForm';
import SearchableSelect from '../../../components/common/SearchableSelect';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import { useParams, useNavigate } from 'react-router-dom';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import Loader from '../../../helpers/Loader';
import api from '../../../helpers/api';
import './CreationCareerPlan.css';

// Page de modification d'un plan de carrière
function EditAffectation() {
    const { careerPlanId: CareerPlanId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentToEdit, setAssignmentToEdit] = useState({});
    const [assignmentType, setAssignmentType] = useState({});
    const [dataEmployee, setDataEmployee] = useState([]);
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

    const formatDate = (date) => {
        if (!date) return '';
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) return '';
        return parsedDate.toLocaleDateString('fr-CA');
    };

    const employeeOptions = useMemo(
        () =>
            (dataEmployee || []).map((item) => ({
                value: item.registrationNumber,
                label: `${item.registrationNumber} - ${item.name} ${item.firstName}`,
            })),
        [dataEmployee]
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const careerPlanResponse = await axios.get(urlApi(`/CareerPlan/${CareerPlanId}`));
            const assignmentData = careerPlanResponse.data || null;
            setAssignmentToEdit(assignmentData);
            setSelectedItem(assignmentData.assignmentTypeId);

            const [assignmentTypeResponse, employeeResponse] = await Promise.all([
                axios.get(urlApi(`/AssignmentType/${assignmentData.assignmentTypeId}`)),
                api.get(urlApi(`/Employee`)),
            ]);
            setAssignmentType(assignmentTypeResponse.data || {});
            setDataEmployee(employeeResponse.data || []);
        } catch (err) {
            console.error(err);
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (CareerPlanId) {
            fetchData();
        }
    }, [CareerPlanId]);

    useEffect(() => {
        if (assignmentToEdit && assignmentToEdit.careerPlanId) {
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleEmployeeChange = (option) => {
        setFormData((prevData) => ({
            ...prevData,
            registrationNumber: option ? option.value : undefined,
        }));
    };

    const handleSubmit = async () => {
        try {
            const dataToSend = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [
                    key,
                    value === undefined || value === '' ? null : value,
                ])
            );

            dataToSend.updatedDate = new Date().toISOString();
            await axios.put(urlApi(`/CareerPlan/${assignmentToEdit.careerPlanId}`), dataToSend);
            handleRetour();
        } catch (err) {
            console.error(`Erreur lors de la modification : ${err.message}`);
            setError(`Erreur lors de la modification : ${err.message}`);
        }
    };

    const handleRetour = () => {
        navigate(`/soft-gcc/carrieres/fiche/${assignmentToEdit.registrationNumber}`);
    };

    const assignmentTypeLabel = Number(selectedItem);
    const registrationLabel =
        employeeOptions.find(
            (opt) => String(opt.value) === String(formData.registrationNumber)
        )?.label || formData.registrationNumber || '…';

    return (
        <Template>
            {isLoading && <Loader />}

            <div className="career-create">
                <BreadcrumbPers
                    items={[
                        { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
                        { label: 'Plan de carrière', path: '/soft-gcc/carrieres' },
                        {
                            label: 'Fiche carrière',
                            path: `/soft-gcc/carrieres/fiche/${assignmentToEdit.registrationNumber}`,
                        },
                        {
                            label: 'Modifier',
                            path: `/soft-gcc/carrieres/fiche/modifier/${CareerPlanId}`,
                        },
                    ]}
                />

                <div className="career-page-header">
                    <div className="career-header-left">
                        <div className="career-header-icon">
                            <i className="mdi mdi-pencil" />
                        </div>
                        <h1 className="career-header-title">Modification du plan de carrière</h1>
                    </div>
                    <div className="career-header-actions">
                        <button
                            onClick={handleSubmit}
                            type="button"
                            className="career-btn career-btn-primary"
                        >
                            <i className="mdi mdi-content-save" />
                            Enregistrer
                        </button>
                        <button
                            onClick={handleRetour}
                            type="button"
                            className="career-btn career-btn-secondary"
                        >
                            <i className="mdi mdi-arrow-left" />
                            Annuler
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form className="career-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="career-section">
                        <div className="career-card">
                            <div className="career-card-header">
                                <h5>
                                    <i className="mdi mdi-account-check" />
                                    Identification
                                </h5>
                            </div>
                            <div className="career-card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="registrationNumber"
                                            >
                                                Employé
                                            </label>
                                            <SearchableSelect
                                                name="registrationNumber"
                                                inputId="registrationNumber"
                                                options={employeeOptions}
                                                value={formData.registrationNumber}
                                                onChange={handleEmployeeChange}
                                                placeholder="Rechercher par matricule ou nom…"
                                                noOptionsMessage={() => 'Aucun employé trouvé'}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="assignmentTypeId"
                                            >
                                                Type d&apos;affectation
                                            </label>
                                            <select
                                                name="assignmentTypeId"
                                                id="assignmentTypeId"
                                                value={formData.assignmentTypeId || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                                disabled
                                            >
                                                {assignmentType && (
                                                    <option
                                                        key={assignmentType.assignmentTypeId}
                                                        value={assignmentType.assignmentTypeId}
                                                    >
                                                        {assignmentType.assignmentTypeName}
                                                    </option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="decisionNumber"
                                            >
                                                Numéro de décision
                                            </label>
                                            <input
                                                type="text"
                                                name="decisionNumber"
                                                id="decisionNumber"
                                                value={formData.decisionNumber || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="decisionDate"
                                            >
                                                Date de décision
                                            </label>
                                            <input
                                                type="date"
                                                name="decisionDate"
                                                id="decisionDate"
                                                value={formData.decisionDate || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="assignmentDate"
                                            >
                                                Date d&apos;affectation
                                            </label>
                                            <input
                                                type="date"
                                                name="assignmentDate"
                                                id="assignmentDate"
                                                value={formData.assignmentDate || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="career-form-group">
                                            <label
                                                className="career-form-label"
                                                htmlFor="description"
                                            >
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                id="description"
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                                rows="3"
                                                placeholder="Informations complémentaires (optionnel)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {assignmentTypeLabel === 1 ? (
                        <AppointmentForm formData={formData} setFormData={setFormData} />
                    ) : assignmentTypeLabel === 2 ? (
                        <LayOffForm handleChange={handleChange} formData={formData} />
                    ) : assignmentTypeLabel === 3 ? (
                        <AdvancementForm handleChange={handleChange} formData={formData} />
                    ) : (
                        <div className="career-section">
                            <div className="career-card">
                                <div className="career-card-body">
                                    <p className="mb-0 text-muted">
                                        Aucune affectation détectée pour {registrationLabel}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </Template>
    );
}

export default EditAffectation;
