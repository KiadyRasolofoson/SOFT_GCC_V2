import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
    
// Gerer la modification d'une education
function ModalEditEducation({ showEditEducation, handleCloseEditEducation, selectedEducation, idEmployee, fetchData, error }) {
    // Appel API pour charger les données
    const { data: dataStudyPath, error: errorStudyPath, isLoading: loadingStudyPath } = useSWR('/StudyPath', Fetcher);
    const { data: dataDegree, error: errorDegree, isLoading: loadingDegree } = useSWR('/Degree', Fetcher);
    const { data: dataSchool, error: errorSchool, isLoading: loadingSchool } = useSWR('/School', Fetcher);

    // Gestion état du formulaire
    const [formData, setFormData] = useState({
        employeeEducationId: '',
        studyPathId: '',
        degreeId: '',
        schoolId: '',
        state: '',
        employeeId: idEmployee,
        startDate: '',
        endingDate: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(''); 

     // Utilisez useEffect pour pré-remplir les données lorsque la modale s'ouvre
     useEffect(() => {
        if (selectedEducation) {
            setFormData({
                employeeEducationId: selectedEducation.employeeEducationId,
                studyPathId: selectedEducation.studyPathId,
                degreeId: selectedEducation.degreeId || '',
                schoolId: selectedEducation.schoolId || '',
                state: selectedEducation.state || '',
                employeeId: selectedEducation.employeeId || idEmployee,
                startDate: new Date(selectedEducation.startDate).toISOString().split('T')[0]  || '',
                endingDate: new Date(selectedEducation.endingDate).toISOString().split('T')[0]  || '',
            });
        }
    }, [selectedEducation, idEmployee]);

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.studyPathId) errors.studyPathId = 'Veuillez sélectionner une filière.';
        if (!formData.degreeId) errors.degreeId = 'Veuillez sélectionner un niveau.';
        if (!formData.schoolId) errors.schoolId = 'Veuillez sélectionner une école.';
        else if (!formData.startDate) errors.startDate = 'Veuillez entrer une date debut.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const dataToSend = {
                ...formData,
                updateDate: new Date().toISOString(),
            };

            // Requête PUT pour mettre à jour les données
            const response = await api.put(`/EmployeeEducation/${selectedEducation.employeeEducationId}`, dataToSend);
            handleCloseEditEducation();
            await fetchData();
        } catch (error) {
            setSubmitError({ submit: `Erreur lors de la modification de diplômes & formations : ${error.message}` });
        }
    };

    return (
        <Modal
            isOpen={showEditEducation}
            onRequestClose={handleCloseEditEducation}
            contentLabel="Modifier diplômes & formations"
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <div className="modal-header">
                <h2>Modifier diplômes & formations</h2>
                <button onClick={handleCloseEditEducation} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                {loadingStudyPath || loadingDegree || loadingSchool ? (
                    <div>Chargement...</div>
                ) : errorStudyPath || errorDegree || errorSchool ? (
                    <div>Erreur lors du chargement des données.</div>
                ) : (
                    <form>
                        <div className="form-group">
                            <label>Filière</label>
                            <select name="studyPathId" value={formData.studyPathId} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner une filière</option>
                                {dataStudyPath && dataStudyPath.map((item, id) => (
                                    <option key={id} value={item.studyPathId}>
                                        {item.studyPathName}
                                    </option>
                                ))}
                            </select>
                            {formErrors.studyPathId && <small className="error-text">{formErrors.studyPathId}</small>}
                        </div>
                        <div className="form-group">
                            <label>Niveau</label>
                            <select name="degreeId" value={formData.degreeId} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner un niveau</option>
                                {dataDegree && dataDegree.map((item, id) => (
                                    <option key={id} value={item.degreeId}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {formErrors.degreeId && <small className="error-text">{formErrors.degreeId}</small>}
                        </div>
                        <div className="form-group">
                            <label>École</label>
                            <select name="schoolId" value={formData.schoolId} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner une école</option>
                                {dataSchool && dataSchool.map((item, id) => (
                                    <option key={id} value={item.schoolId}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {formErrors.schoolId && <small className="error-text">{formErrors.schoolId}</small>}
                        </div>
                         <div className="form-group">
                            <label>Date debut</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="form-control" />
                            {formErrors.startDate && <small className="error-text">{formErrors.startDate}</small>}
                        </div>
                        <div className="form-group">
                            <label>Date fin</label>
                            <input type="date" name="endingDate" value={formData.endingDate} onChange={handleChange} className="form-control" />
                            {formErrors.endingDate && <small className="error-text">{formErrors.endingDate}</small>}
                        </div>
                        {submitError && <small className="error-text">{submitError}</small>}
                    </form>
                )}
            </div>
            <div className="modal-footer">
                <button onClick={handleCloseEditEducation} className="button button-secondary">Fermer</button>
                <button onClick={handleSubmit} className="button button-primary">Modifier</button>
            </div>
        </Modal>
      );
    }
    
    export default ModalEditEducation;
    