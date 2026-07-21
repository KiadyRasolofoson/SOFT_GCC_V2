import React, { useState } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
import { getUserMessage } from '../../helpers/errorHandler';

Modal.setAppElement('#root');

function ModalAddEducation({ showEducation, handleCloseEducation, idEmployee, fetchData, dataEmployeeDescription }) {
    const { data: dataStudyPath, error: errorStudyPath, isLoading: loadingStudyPath } = useSWR('/StudyPath', Fetcher);
    const { data: dataDegree, error: errorDegree, isLoading: loadingDegree } = useSWR('/Degree', Fetcher);
    const { data: dataSchool, error: errorSchool, isLoading: loadingSchool } = useSWR('/School', Fetcher);

    const [formData, setFormData] = useState({
        studyPathId: '',
        degreeId: '',
        schoolId: '',
        state: '1',
        employeeId: idEmployee,
        startDate: '',
        endingDate: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(''); 

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
        else if (!formData.startDate) errors.year = 'Veuillez entrer une date debut.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const dataToSend = {
            ...formData,
            creationDate: new Date().toISOString(),
            updateDate: new Date().toISOString(),
        };

        try {
            const response = await api.post('/EmployeeEducation', dataToSend);
            handleCloseEducation();
            await fetchData();
            dataEmployeeDescription.educationNumber++;
        } catch (err) {
            setSubmitError(getUserMessage(err, 'insertion').message);
        }
    };

    return (
        <Modal
            isOpen={showEducation}
            onRequestClose={handleCloseEducation}
            contentLabel="Ajouter une nouvelle diplômes & formation"
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <div className="modal-header">
                <h2>Ajouter une nouvelle diplômes & formations</h2>
                <button onClick={handleCloseEducation} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                {loadingStudyPath || loadingDegree || loadingSchool ? (
                    <div>Chargement...</div>
                ) : errorStudyPath || errorDegree || errorSchool ? (
                    <div>Impossible de charger les données nécessaires. Vérifiez votre connexion et réessayez.</div>
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
                <button onClick={handleCloseEducation} className="button button-secondary">Fermer</button>
                <button onClick={handleSubmit} className="button button-primary">Valider</button>
            </div>
        </Modal>
    );
}

export default ModalAddEducation;
