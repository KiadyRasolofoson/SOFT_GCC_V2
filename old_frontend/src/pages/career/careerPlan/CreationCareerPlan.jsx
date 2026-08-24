import {useState, useEffect, useMemo} from 'react';
import Template from '../../Template';
import AppointmentForm from '../../../components/career/AppointmentForm';
import AdvancementForm from '../../../components/career/AdvancementForm';
import LayOffForm from '../../../components/career/LayOffForm';
import SearchableSelect from '../../../components/common/SearchableSelect';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import Loader from '../../../helpers/Loader';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import { useNavigate } from 'react-router-dom';
import api from '../../../helpers/api';
import ErrorMessage from '../../../helpers/ErrorMessage';
import './CreationCareerPlan.css';

// Page de creation d'un plan de carriere
function CreationCareerPlan() {
    // Initialisation des states
    const [selectedItem, setSelectedItem] = useState('1');
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    

    // Appel api pour les donnees du formulaire
    const [dataEmployee, setDataEmployee] = useState([]); 
    const [dataAssignmentType, setDataAssignmentType] = useState([]); 

    // Chargement des donnees depuis l'api 
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [employeeResponse, assignmentTypeResponse] = await Promise.all([
                api.get(urlApi(`/Employee`)),
                axios.get(urlApi(`/AssignmentType`))
            ]);
            setDataEmployee(employeeResponse.data || []);
            setDataAssignmentType(assignmentTypeResponse.data || []);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const employeeOptions = useMemo(
        () =>
            (dataEmployee || []).map((item) => ({
                value: item.registrationNumber,
                label: `${item.registrationNumber} - ${item.name} ${item.firstName}`,
            })),
        [dataEmployee]
    );

    // Fonction qui gère le retour en arrière de la page
    const handleRetour = () => {
        navigate(`/soft-gcc/carrieres`);
    };

    // Gestion état du formulaire
    const [formData, setFormData] = useState({
        assignmentTypeId: 1,
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

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
        ...prevData,
        [name]: value,
    }));

    if (formErrors[name]) {
        // Revalider le champ en temps réel
        validateField(name, value);
    }
  };

  // Fonction qui gère le changement dans la liste déroulante
  const handleSelectChange = (event) => {
      setSelectedItem(String(event.target.value));
      handleChange(event);
      initializeForm();
  };

  const handleEmployeeChange = (option) => {
      const value = option ? option.value : undefined;
      setFormData((prevData) => ({
          ...prevData,
          registrationNumber: value,
      }));
      if (formErrors.registrationNumber) {
          validateField('registrationNumber', value);
      }
  };

  // Gestion de validation des données
  const validateField = (fieldName, value) => {
    let error = '';
    if (fieldName === 'registrationNumber' && !value) {
      error = 'La matricule est obligatoire.';
    } else if (fieldName === 'assignmentTypeId' && !value) {
      error = 'Le type d’affectation est obligatoire.';
    } else if (fieldName === 'decisionNumber' && !value.trim()) {
      error = 'Le numéro de décision est obligatoire.';
    } else if (
      (fieldName === 'decisionDate' || fieldName === 'assignmentDate') &&
      !value
    ) {
      error = `La date est obligatoire.`;
    }
    setFormErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.registrationNumber) {
      errors.registrationNumber = 'La matricule est obligatoire.';
    }
    if (!formData.assignmentTypeId) {
      errors.assignmentTypeId = 'Le type d’affectation est obligatoire.';
    }
    if (!formData.decisionNumber) {
      errors.decisionNumber = 'Le numéro de décision est obligatoire.';
    }
    if (!formData.decisionDate) {
      errors.decisionDate = 'La date de décision est obligatoire.';
    }
    if (!formData.assignmentDate) {
      errors.assignmentDate = 'La date d’affectation est obligatoire.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };



  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
        return; // Empêche la soumission si le formulaire n’est pas valide
    }

    setIsLoading(true);
    try {
        const dataToSend = {
            ...formData,
            creationDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
        };
        console.log(dataToSend);
  
        await api.post(urlApi('/CareerPlan'), dataToSend);
        handleRetour();
    } catch (err) {
        console.error('Erreur lors de l\'insertion :', err);
        setSubmitError(err);
    } finally {
        setIsLoading(false);
    }
  };
        
    // Initialisation du formulaire de saisie près enregistrement d'un plan de carrière
    const initializeForm = () => {
        setFormData((prevData) => ({
            ...prevData, 
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
        }));
    };

    const initializeAllForm = () => {
        setSelectedItem('1');
        setFormErrors({});
        setFormData({
            assignmentTypeId: 1,
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
    };

    return (
        <Template>
            {isLoading && <Loader />}
            <ErrorMessage error={error} context="chargement" onRetry={fetchData} />
            <ErrorMessage error={submitError} context="insertion" />

            <div className="career-create">
                <BreadcrumbPers
                    items={[
                        { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
                        { label: 'Plan de carrière', path: '/soft-gcc/carrieres' },
                        { label: 'Création', path: '/soft-gcc/carrieres/creation' },
                    ]}
                />

                <div className="career-page-header">
                    <div className="career-header-left">
                        <div className="career-header-icon">
                            <i className="mdi mdi-map-marker-path" />
                        </div>
                        <h1 className="career-header-title">Création d&apos;un plan de carrière</h1>
                    </div>
                    <div className="career-header-actions">
                        <button onClick={handleSubmit} type="button" className="career-btn career-btn-primary">
                            <i className="mdi mdi-content-save" />
                            Enregistrer
                        </button>
                        <button onClick={initializeAllForm} type="button" className="career-btn career-btn-secondary">
                            <i className="mdi mdi-refresh" />
                            Réinitialiser
                        </button>
                    </div>
                </div>

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
                                            <label className="career-form-label" htmlFor="registrationNumber">
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
                                            {formErrors.registrationNumber && (
                                                <p className="career-field-error">{formErrors.registrationNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="career-form-group">
                                            <label className="career-form-label" htmlFor="assignmentTypeId">
                                                Type d&apos;affectation
                                            </label>
                                            <select
                                                name="assignmentTypeId"
                                                id="assignmentTypeId"
                                                value={formData.assignmentTypeId}
                                                onChange={handleSelectChange}
                                                className="career-form-control"
                                            >
                                                <option value="">Sélectionner une affectation</option>
                                                {dataAssignmentType &&
                                                    dataAssignmentType.map((item) => (
                                                        <option
                                                            key={item.assignmentTypeId}
                                                            value={item.assignmentTypeId}
                                                        >
                                                            {item.assignmentTypeName}
                                                        </option>
                                                    ))}
                                            </select>
                                            {formErrors.assignmentTypeId && (
                                                <p className="career-field-error">{formErrors.assignmentTypeId}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="career-form-group">
                                            <label className="career-form-label" htmlFor="decisionNumber">
                                                Numéro de décision
                                            </label>
                                            <input
                                                type="text"
                                                name="decisionNumber"
                                                id="decisionNumber"
                                                value={formData.decisionNumber || ''}
                                                onChange={handleChange}
                                                className="career-form-control"
                                                placeholder="Ex. DEC-2026-001"
                                            />
                                            {formErrors.decisionNumber && (
                                                <p className="career-field-error">{formErrors.decisionNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="career-form-group">
                                            <label className="career-form-label" htmlFor="decisionDate">
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
                                            {formErrors.decisionDate && (
                                                <p className="career-field-error">{formErrors.decisionDate}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="career-form-group">
                                            <label className="career-form-label" htmlFor="assignmentDate">
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
                                            {formErrors.assignmentDate && (
                                                <p className="career-field-error">{formErrors.assignmentDate}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="career-form-group">
                                            <label className="career-form-label" htmlFor="description">
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

                    {selectedItem === '1' ? (
                        <AppointmentForm formData={formData} setFormData={setFormData} />
                    ) : selectedItem === '2' ? (
                        <LayOffForm handleChange={handleChange} formData={formData} />
                    ) : (
                        <AdvancementForm handleChange={handleChange} formData={formData} />
                    )}
                </form>
            </div>
        </Template>
    );
}

export default CreationCareerPlan;
