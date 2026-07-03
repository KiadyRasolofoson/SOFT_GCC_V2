import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import useSWR from 'swr';
import Loader from '../../../helpers/Loader';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import "../../../styles/careerStyle.css";
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import CancelButton from '../../../helpers/CancelButton';
import FetcherApi from '../../../helpers/FetcherApi';
import api from '../../../helpers/api';

function CreateEmployeePage({ onSearch }) {
    const { data: dataEmployee } = useSWR('/Employee', FetcherApi);
    const { data: dataDepartment } = useSWR('/Department', FetcherApi);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        registrationNumber: '',
        name: '',
        firstName: '',
        birthday: '',
        department_id: '',
        hiring_date: '',
        civiliteId: '',
        managerId: null,
        photo: null,
        email: ''
    });

   useEffect(() => {
        if (dataEmployee && dataEmployee.length > 0) {
            let newRegistrationNumber = `EMP00${dataEmployee[dataEmployee.length - 1].employeeId + 1}`;
            setFormData(prev => ({
                ...prev,
                registrationNumber: newRegistrationNumber
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                registrationNumber: 'EMP001'
            }));
        }
    }, [dataEmployee]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const validateForm = () => {
        let errors = {};
        const today = new Date();
        const birthdayDate = new Date(formData.birthday);
        const hiringDate = new Date(formData.hiring_date);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);

        if (!formData.registrationNumber) errors.registrationNumber = "Le numéro de matricule est requis";
        if (!formData.name) errors.name = "Le nom est requis";
        if (!formData.firstName) errors.firstName = "Le prénom est requis";
        if (!formData.birthday) {
            errors.birthday = "La date de naissance est requise";
        } else if (birthdayDate > minAgeDate) {
            errors.birthday = "L'employé doit avoir au moins 18 ans";
        }
        if (!formData.department_id) errors.department_id = "Le département est requis";
        if (!formData.hiring_date) {
            errors.hiring_date = "La date d'embauche est requise";
        } else if (hiringDate > today) {
            errors.hiring_date = "La date d'embauche ne peut pas être dans le futur";
        }
        if (!formData.civiliteId) errors.civiliteId = "La civilité est requise";
        if (!formData.photo) errors.photo = "Le photo est requis";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const form = new FormData();
            form.append("registrationNumber", formData.registrationNumber);
            form.append("name", formData.name);
            form.append("firstName", formData.firstName);
            form.append("birthday", formData.birthday);
            form.append("department_id", formData.department_id);
            form.append("hiring_date", formData.hiring_date);
            form.append("civiliteId", formData.civiliteId);
            form.append("email", formData.email);

            if (formData.managerId !== null) {
                form.append("managerId", formData.managerId);
            }

            if (formData.photo) {
                form.append("photo", formData.photo);
            }
         
            await api.post(urlApi('/Employee'), form);
            setFormData({
                registrationNumber: '',
                name: '',
                firstName: '',
                birthday: '',
                department_id: '',
                hiring_date: '',
                civiliteId: '',
                managerId: null,
                photo: null,
                email: ''
            });
            if (dataEmployee && dataEmployee.length > 0) {
                let newRegistrationNumber = `EMP00${dataEmployee[dataEmployee.length - 1].employeeId + 1}`;
                setFormData(prev => ({
                    ...prev,
                    registrationNumber: newRegistrationNumber
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    registrationNumber: 'EMP001'
                }));
            }
            setError(null);
            setSuccess("Creation du nouveau employé "+formData.registrationNumber+" réussi");
        } catch (error) {
            setError('Erreur lors de l\'insertion : ' + (error.response?.data || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value === "" ? null : value,
        }));
    };

    const handleFileChange = (e) => {
        setFormData((prevData) => ({ ...prevData, photo: e.target.files[0] }));
    };

    if (isLoading) return <Loader />;

    return (
        <Template>
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-account-plus skill-icon"></i>
                    <p className="skill-title">AJOUT D'UN NOUVEL EMPLOYÉ</p>
                </div>

                <div className="col-lg-2">
                    <CancelButton to="settings/employeeManagement/liste" />
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'Gestion employés', path: '/softGcc/settings/employeeManagement/liste' },
                    { label: 'Ajout', path: '/softGcc/settings/employeeManagement/create' },
                ]}
            />
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form className="forms-sample">
                <div className="row">            
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                <i className="mdi mdi-file-document-edit me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                <h3 className="mb-0" style={{color: '#B8860B'}}>Formulaire d'ajout 1</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label>Numero de matricule</label>
                                    <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="form-control" />
                                    {formErrors.registrationNumber && <div className="error-text">{formErrors.registrationNumber}</div>}
                                </div>
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" />
                                    {formErrors.name && <div className="error-text">{formErrors.name}</div>}
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-control" />
                                    {formErrors.firstName && <div className="error-text">{formErrors.firstName}</div>}
                                </div>
                                <div className="form-group">
                                    <label>Date de naissance</label>
                                    <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="form-control" />
                                    {formErrors.birthday && <div className="error-text">{formErrors.birthday}</div>}
                                </div>                                
                                <div className="form-group">
                                    <label>Département</label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} className="form-control">
                                        <option value="">Sélectionner un département</option>
                                        {dataDepartment && dataDepartment.map((item) => (
                                            <option key={item.departmentId} value={item.departmentId}>{item.name}</option>
                                        ))}
                                    </select>  
                                    {formErrors.department_id && <div className="error-text">{formErrors.department_id}</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                <i className="mdi mdi-file-document-edit me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                <h3 className="mb-0" style={{color: '#B8860B'}}>Formulaire d'ajout 2</h3>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label>Date d'embauche</label>
                                    <input type="date" name="hiring_date" value={formData.hiring_date} onChange={handleChange} className="form-control" />
                                    {formErrors.hiring_date && <div className="error-text">{formErrors.hiring_date}</div>}
                                </div>
                                <div className="form-group">
                                    <label>Civilité</label>
                                    <select name="civiliteId" value={formData.civiliteId} onChange={handleChange} className="form-control">
                                        <option value="">Sélectionner la civilité</option>
                                        <option value="1">Monsieur</option>
                                        <option value="2">Madame</option>
                                    </select>  
                                    {formErrors.civiliteId && <div className="error-text">{formErrors.civiliteId}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="exampleInputUsername1">Manager</label>
                                    <select name="managerId" value={formData.managerId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                                        <option value="">Selectionner le manager</option>
                                        {dataEmployee && dataEmployee.map((item, id) => (
                                            <option key={item.employeeId} value={item.employeeId}>
                                                {`${item.registrationNumber} - ${item.name} ${item.firstName}`}
                                            </option>
                                        ))}
                                    </select>  
                                </div>
                                <div className="form-group">
                                    <label>Photo</label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="form-control" />
                                    {formErrors.photo && <div className="error-text">{formErrors.photo}</div>}  
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="text" name="email" value={formData.email} onChange={handleChange} className="form-control" />
                                    {formErrors.email && <div className="error-text">{formErrors.email}</div>}
                                </div>
                                <div className="button-save-profil">
                                    <button onClick={handleSubmit} type="button" className="btn btn-success btn-fw">
                                        <i className='mdi mdi-content-save button-logo'></i> Enregistrer
                                    </button>
                                    <button type="button" className="btn btn-light btn-fw">
                                        <i className='mdi mdi-undo-variant button-logo'></i> Retour
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Template>
    );
}

export default CreateEmployeePage;