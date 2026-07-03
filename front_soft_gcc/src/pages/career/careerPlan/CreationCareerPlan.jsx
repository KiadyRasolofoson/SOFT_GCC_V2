import React, {useState, useEffect} from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import AppointmentForm from '../../../components/career/AppointmentForm';
import AdvancementForm from '../../../components/career/AdvancementForm';
import LayOffForm from '../../../components/career/LayOffForm';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import Loader from '../../../helpers/Loader';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import CancelButton from '../../../helpers/CancelButton';
import { useNavigate } from 'react-router-dom';
import api from '../../../helpers/api';

// Page de creation d'un plan de carriere
function CreationCareerPlan({ onSearch }) {
    // Initialisation des states
    const [selectedItem, setSelectedItem] = useState('1');
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(''); 
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(false); 
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
        } catch (error) {
            setError(`Erreur lors de la recuperation des donnees : ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    // Fonction qui gère le changement dans la liste déroulante
    const handleSelectChange = (event) => {
        setSelectedItem(event.target.value);
        handleChange(event);
        initializeForm();
    };

    // Fonction qui gère le retour en arrière de la page
    const handleRetour = () => {
        navigate(`/SoftGcc/carriere`);
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
  
        const response = await axios.post(urlApi('/CareerPlan'), dataToSend);
        handleRetour();
    } catch (error) {
        console.error('Erreur lors de l\'insertion :', error.response?.data || error.message);
        setError(`Erreur lors de l\'insertion : ${error.message}`);

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
            echelonId: undefined
        });
    };
    return (
        <Template>
            {isLoading && <Loader />}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-map-marker-path skill-icon"></i>
                    <p className="skill-title">CREATION D'UN PLAN DE CARRIÈRE</p>
                </div>
                <div className="col-lg-2">
                    <CancelButton to="carriere" />
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                { label: 'Accueil', path: '/SoftGcc/tableauBord' },
                { label: 'Plan de carrière', path: '/SoftGcc/carriere' },
                { label: 'Creation', path: '/SoftGcc/carriere/creation' }
                ]}
            />
            
            <div className="row">
                <div className="button-save-profil">
                    <button onClick={handleSubmit} type="button" className="btn btn-success btn-fw">
                        <i className="mdi mdi-content-save-edit" style={{paddingRight: '5px'}}></i>Enregistrer
                    </button>
                    <button onClick={initializeAllForm} type="button" className="btn btn-light btn-fw">
                        <i className="mdi mdi-backspace-outline" style={{paddingRight: '5px'}}></i>
                        Annuler
                    </button>
                </div>
            </div>

            <form className="forms-sample">
                <div className="row">            
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="exampleInputUsername1">Matricule</label>
                                    <select name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="form-control" id="exampleSelectGender">
                                        <option value="">Sélectionner une matricule</option>
                                        {dataEmployee && dataEmployee.map((item, id) => (
                                            <option key={id} value={item.registrationNumber}>
                                                {item.registrationNumber + " - " + item.name + " " + item.firstName}
                                            </option>
                                        ))}
                                    </select>   
                                    {formErrors.registrationNumber && (
                                        <p className="text-danger">{formErrors.registrationNumber}</p>
                                    )} 
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="exampleInputUsername1">Type d'affectation</label>
                                    <select name="assignmentTypeId" value={formData.assignmentTypeId} onChange={handleSelectChange} className="form-control" id="exampleSelectGender">
                                        <option value="">Sélectionner une affectation</option>
                                        {dataAssignmentType && dataAssignmentType.map((item, id) => (
                                            <option key={item.assignmentTypeId} value={item.assignmentTypeId}>
                                                {item.assignmentTypeName}
                                            </option>
                                        ))}
                                    </select>   
                                    {formErrors.assignmentTypeId && (
                                        <p className="text-danger">{formErrors.assignmentTypeId}</p>
                                    )} 
                                </div>
                                <div className="form-group">
                                    <label htmlFor="exampleInputEmail1">Numero de decision</label>
                                    <input type="text" name="decisionNumber" value={formData.decisionNumber} onChange={handleChange} className="form-control" id="exampleInputEmail1"/>
                                    {formErrors.decisionNumber && (
                                        <p className="text-danger">{formErrors.decisionNumber}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="exampleInputEmail1">Date de decision</label>
                                    <input type="date" name="decisionDate" value={formData.decisionDate} onChange={handleChange} className="form-control" id="exampleInputEmail1"/>
                                    {formErrors.decisionDate && (
                                        <p className="text-danger">{formErrors.decisionDate}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="exampleInputEmail1">Date d'affectation</label>
                                    <input type="date" name="assignmentDate" value={formData.assignmentDate} onChange={handleChange} className="form-control" id="exampleInputEmail1"/>
                                    {formErrors.assignmentDate && (
                                        <p className="text-danger">{formErrors.assignmentDate}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="exampleInputEmail1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-control" id="exampleTextarea1" rows="4"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {selectedItem === '1' ? (   //  Type nomination
                    <AppointmentForm formData={formData} setFormData={setFormData} />
                  ) : selectedItem === '2' ? (  // Type mise en disponibilité
                    <LayOffForm handleChange={handleChange} formData={formData} />
                  ) : ( // Type avancement
                    <AdvancementForm handleChange={handleChange} formData={formData} />
                  )}
            </form>
        </Template>
    );
}

export default CreationCareerPlan;
