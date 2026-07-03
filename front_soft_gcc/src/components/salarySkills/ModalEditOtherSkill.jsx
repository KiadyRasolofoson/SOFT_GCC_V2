import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
    
// Gerer la modification d'autre formation
function ModalEditOtherSkill ({ showEditOtherSkill, handleCloseEditOtherSkill, selectedOtherSkill, idEmployee, fetchData, error }) {
    // Gestion état du formulaire
    const [formData, setFormData] = useState({
        employeeOtherFormationId: '',
        description: '',
        startDate: '',
        endDate: '',
        comment: '',
        state: '',
        employeeId: idEmployee, // Valeur par défaut de l'employé, peut être rendue dynamique
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState(''); 

    // Utilisez useEffect pour pré-remplir les données lorsque la modale s'ouvre
  useEffect(() => {
    if (selectedOtherSkill) {
        setFormData({
            employeeOtherFormationId: selectedOtherSkill.employeeOtherFormationId,
            description: selectedOtherSkill.description || '',
            startDate: new Date(selectedOtherSkill.startDate).toISOString().split('T')[0]  || '',
            endDate: new Date(selectedOtherSkill.endDate).toISOString().split('T')[0]  || '',
            comment: selectedOtherSkill.comment || '',
            state: selectedOtherSkill.state || '',
            employeeId: selectedOtherSkill.employeeId || idEmployee,
        });
    }
}, [selectedOtherSkill, idEmployee]);

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Gestion de la validation du formulaire
    const validateForm = () => {
        const errors = {};
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const minDate = new Date('1900-01-01'); // Date minimum : 1er janvier 1900
        const currentDate = new Date(); // Date actuelle
        
        if (!formData.description) errors.description = 'Veuillez entrer une description.';
        if (!formData.startDate) errors.startDate = 'Veuillez entrer une date.';
        if (!formData.endDate) errors.endDate = 'Veuillez entrer une date.';    
        if (startDate < minDate || startDate > currentDate ) {
            errors.startDate = 'Veuillez entrer une date valide.';
        }
        else if ( endDate < minDate || endDate > currentDate ) {
            errors.endDate = 'Veuillez entrer une date valide.';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0; // Retourne `true` si aucune erreur
    };
    
    // Gérer la soumission du formulaire
    const handleSubmit = async () => {
        if (!validateForm()) return; // Arrête la soumission en cas d'erreurs

        try {
            const dataToSend = {
                ...formData,
                updateDate: new Date().toISOString(),
            };

            // Requête PUT pour mettre à jour les données
            const response = await api.put(`/EmployeeOtherFormation/${selectedOtherSkill.employeeOtherFormationId}`, dataToSend);
            handleCloseEditOtherSkill();
            await fetchData();
        } catch (error) {
            setSubmitError(`Erreur lors de la modification d'une formation : ${error.message}`);
        }
    };

    return (
        <Modal
          isOpen={showEditOtherSkill}
          onRequestClose={handleCloseEditOtherSkill}
          contentLabel="Modifier autre formation"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
            <div className="modal-header">
              <h2>Modifier autre formation</h2>
              <button onClick={handleCloseEditOtherSkill} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                <form>
                    <div className="form-group">
                        <label>Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="form-control" />
                        {formErrors.description && <small className="error-text">{formErrors.description}</small>}
                    </div>
                    <div className="form-group">
                        <label>Date debut</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="form-control" />
                        {formErrors.startDate && <small className="error-text">{formErrors.startDate}</small>}
                    </div>
                    <div className="form-group">
                        <label>Date fin</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-control" />
                        {formErrors.endDate && <small className="error-text">{formErrors.endDate}</small>}
                    </div>
                    <div className="form-group">
                        <label>Commentaires</label>
                        <textarea type="comment" name="comment" value={formData.comment} onChange={handleChange} placeholder="Entrez vos commentaires ici" className="form-control"></textarea>                          {formErrors.startDate && <small className="error-text">{formErrors.startDate}</small>}
                    </div>
                    {submitError && <small className="error-text">{submitError}</small>}
                </form>
            </div>
            <div className="modal-footer">
                <button onClick={handleCloseEditOtherSkill} className="button button-secondary">Fermer</button>
                <button onClick={handleSubmit} className="button button-primary">Modifier</button>
            </div>
        </Modal>
      );
    }
    
    export default ModalEditOtherSkill;
    