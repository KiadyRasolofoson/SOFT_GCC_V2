import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';

// Gerer la modification d'une competence
function ModalEditSkill({ showEditSkill, handleCloseEditSkill, selectedSkill, idEmployee, fetchData, error }) {
    // Appel API pour charger les données
    const { data: dataDomainSkill, error: errorDomainSkill, isLoading: loadingDomainSkill } = useSWR('/DomainSkill', Fetcher);
    const { data: dataSkill, error: errorSkill, isLoading: loadingSkill } = useSWR('/Skill', Fetcher);

    // Gestion état du formulaire
    const [formData, setFormData] = useState({
        employeeSkillId: '',
        domainSkillId: '',
        skillId: '',
        level: 0,
        state: '',
        employeeId: idEmployee,
    });

    const [formErrors, setFormErrors] = useState({}); // Pour stocker les erreurs de validation
    const [submitError, setSubmitError] = useState(''); 
    const [formLevel, setFormLevel] = useState(false); 

    // Utilisez useEffect pour pré-remplir les données lorsque la modale s'ouvre
    useEffect(() => {
        if (selectedSkill) {
            setFormData({
                employeeSkillId: selectedSkill.employeeSkillId,
                domainSkillId: selectedSkill.domainSkillId || '',
                skillId: selectedSkill.skillId || '',
                level: selectedSkill.level || 0,
                state: selectedSkill.state || '',
                employeeId: selectedSkill.employeeId || idEmployee,
            });
            if(selectedSkill.state == 1) setFormLevel(false);
            else setFormLevel(true);
        }
    }, [selectedSkill, idEmployee]);

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        if(e.target.value === '1') {
            setFormLevel( false );
            setFormData({
                employeeSkillId: selectedSkill.employeeSkillId,
                domainSkillId: selectedSkill.domainSkillId || '',
                skillId: selectedSkill.skillId || '',
                level: 0,
                state: selectedSkill.state || '',
                employeeId: selectedSkill.employeeId || idEmployee,
            });
        }
        else {
            setFormLevel( true );
        }

        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Gerer les erreurs de validation 
    const validateForm = () => {
        const errors = {};
        
        if (!formData.domainSkillId) errors.domainSkillId = "Le domaine est requis.";
        if (!formData.skillId) errors.skillId = "La compétence est requise.";
        if (formLevel && (!formData.level || formData.level < 0 || formData.level > 100)) errors.level = "Le niveau doit être compris entre 1 et 100.";
        if (!formData.state) errors.state = "L'état est requis.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0; // Renvoie vrai si aucune erreur
    };

    // Gérer la soumission du formulaire pour la mise à jour
    const handleSubmit = async () => {
        if (!validateForm()) return; // Arrête la soumission si le formulaire est invalide

        try {
            const dataToSend = {
                ...formData,
                updateDate: new Date().toISOString(),
            };

            // Requête PUT pour mettre à jour les données
            const response = await api.put(`/EmployeeSkills/${selectedSkill.employeeSkillId}`, dataToSend);
            handleCloseEditSkill();
            fetchData();
            setFormData({
                domainSkillId: '',
                skillId: '',
                level: 0,
                state: '',
                employeeId: idEmployee,
            });
        } catch (error) {
            setSubmitError({ submit: `Erreur lors de l'insertion de la compétence : ${error.message}` });
        }
    };

    return (
        <Modal
            isOpen={showEditSkill}
            onRequestClose={handleCloseEditSkill}
            contentLabel="Modifier une compétence"
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <div className="modal-header">
                <h2>Modifier une compétence</h2>
                <button onClick={handleCloseEditSkill} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                {loadingDomainSkill || loadingSkill ? (
                    <div>Chargement...</div>
                ) : errorDomainSkill || errorSkill ? (
                    <div>Erreur lors du chargement des données.</div>
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
                                <option value="1">Non validé</option>
                                <option value="5">Validé par évaluation</option>
                            </select>
                            {formErrors.state && <div className="text-danger">{formErrors.state}</div>}
                        </div>

                        {formLevel ? (
                            <div className="form-group">
                                <label>Niveau (en %)</label>
                                <input type="number" name="level" value={formData.level} onChange={handleChange} className="form-control" />
                                {formErrors.level && <div className="text-danger">{formErrors.level}</div>}
                            </div>
                        ) : (
                            <div className="form-group"></div>
                        )}      
                        
                        {submitError && <small className="error-text">{submitError}</small>}
                    </form>
                )}
            </div>
            <div className="modal-footer">
                <button onClick={handleCloseEditSkill} className="button button-secondary">Fermer</button>
                <button onClick={handleSubmit} className="button button-primary">Modifier</button>
            </div>
        </Modal>
    );
}

export default ModalEditSkill;
