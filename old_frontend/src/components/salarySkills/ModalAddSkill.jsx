import React, { useState } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
import { getUserMessage } from '../../helpers/errorHandler';

function ModalAddSkill({ showSkill, handleCloseSkill, idEmployee, fetchData, error, dataEmployeeDescription }) {
    const { data: dataDomainSkill, error: errorDomainSkill, isLoading: loadingDomainSkill } = useSWR('/DomainSkill', Fetcher);
    const { data: dataSkill, error: errorSkill, isLoading: loadingSkill } = useSWR('/Skill', Fetcher);

    const [formData, setFormData] = useState({
        domainSkillId: '',
        skillId: '',
        level: 0,
        state: '',
        employeeId: idEmployee,
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(''); 
    const [formLevel, setFormLevel] = useState(false); 

    const handleChange = (e) => {
        if(e.target.value === '1')  setFormLevel( false );
        if(e.target.value === '5')  setFormLevel( true );

        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.domainSkillId) errors.domainSkillId = "Le domaine est requis.";
        if (!formData.skillId) errors.skillId = "La compétence est requise.";
        if (formLevel && (!formData.level || formData.level < 0 || formData.level > 100)) errors.level = "Le niveau doit être compris entre 1 et 100.";
        if (!formData.state) errors.state = "L'état est requis.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0; // Renvoie vrai si aucune erreur
    };

    const handleSubmit = async () => {
        if (!validateForm()) return; // Arrête la soumission si le formulaire est invalide

        try {
            const dataToSend = {
                ...formData,
                creationDate: new Date().toISOString(),
                updateDate: new Date().toISOString(),
            };
            const response = await api.post('/EmployeeSkills', dataToSend);
            handleCloseSkill();
            await fetchData();
            dataEmployeeDescription.skillNumber++;
            setFormData({
                domainSkillId: '',
                skillId: '',
                level: 0,
                state: '',
                employeeId: idEmployee,
            });
        } catch (err) {
            setSubmitError(getUserMessage(err, 'insertion').message);
        }
    };

    return (
        <Modal
            isOpen={showSkill}
            onRequestClose={handleCloseSkill}
            contentLabel="Ajouter une nouvelle compétence"
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <div className="modal-header">
                <h2>Ajouter une nouvelle compétence</h2>
                <button onClick={handleCloseSkill} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                {loadingDomainSkill || loadingSkill ? (
                    <div>Chargement...</div>
                ) : errorDomainSkill || errorSkill ? (
                    <div>Impossible de charger les données nécessaires. Vérifiez votre connexion et réessayez.</div>
                ) : (
                    <form>
                        <div className="form-group">
                            <label>Domaine</label>
                            <select name="domainSkillId" value={formData.domainSkillId} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner un domaine</option>
                                {dataDomainSkill.map((item, id) => (
                                    <option key={id} value={item.domainSkillId}>{item.name}</option>
                                ))}
                            </select>
                            {formErrors.domainSkillId && <div className="text-danger">{formErrors.domainSkillId}</div>}
                        </div>
                        <div className="form-group">
                            <label>Compétence</label>
                            <select name="skillId" value={formData.skillId} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner une compétence</option>
                                {dataSkill.map((item, id) => (
                                    <option key={id} value={item.skillId}>{item.name}</option>
                                ))}
                            </select>
                            {formErrors.skillId && <div className="text-danger">{formErrors.skillId}</div>}
                        </div>
                        <div className="form-group">
                            <label>État</label>
                            <select name="state" value={formData.state} onChange={handleChange} className="form-control">
                                <option value="">Sélectionner un état</option>
                                <option value="1">Non evalué</option>
                                <option value="5">Validé par évaluation</option>
                            </select>
                            {formErrors.state && <div className="text-danger">{formErrors.state}</div>}
                        </div>
                        {submitError && <small className="error-text">{submitError}</small>}

                        {formLevel ? (
                            <div className="form-group">
                                <label>Niveau (en %)</label>
                                <input type="number" name="level" value={formData.level} onChange={handleChange} className="form-control" />
                                {formErrors.level && <div className="text-danger">{formErrors.level}</div>}
                            </div>
                        ) : (
                            <div className="form-group"></div>
                        )}                        
                    </form>
                )}
            </div>
            <div className="modal-footer">
                <button onClick={handleCloseSkill} className="button button-secondary">Fermer</button>
                <button onClick={handleSubmit} className="button button-primary">Valider</button>
            </div>
        </Modal>
    );
}

export default ModalAddSkill;
