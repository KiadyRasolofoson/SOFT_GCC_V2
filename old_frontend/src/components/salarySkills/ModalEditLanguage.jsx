import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
import { getUserMessage } from '../../helpers/errorHandler';
    
// Gerer la modification d'une langue
function ModalEditLanguage ({ showEditLanguage, handleCloseEditLanguage, selectedLanguage, idEmployee, fetchData, error }) {
  // Appel API pour charger les données
  const { data: dataLanguage, error: errorLanguage, isLoading: loadingLanguage } = useSWR('/Language', Fetcher);
    
  // Gestion état du formulaire
  const [formData, setFormData] = useState({
    employeeLanguageId: '',
    language_id: '',
    level: 0,
    state: '',
    employeeId: idEmployee, // Valeur par défaut de l'employé, peut être rendue dynamique
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(''); 
  const [formLevel, setFormLevel] = useState(false); 

  // Utilisez useEffect pour pré-remplir les données lorsque la modale s'ouvre
  useEffect(() => {
    if (selectedLanguage) {
        setFormData({
            employeeLanguageId: selectedLanguage.employeeLanguageId,
            language_id: selectedLanguage.languageId || '',
            level: selectedLanguage.level || 0,
            state: selectedLanguage.state || '',
            employeeId: selectedLanguage.employeeId || idEmployee,
        });
        if(selectedLanguage.state == 1) setFormLevel(false);
        else setFormLevel(true);
    }
  }, [selectedLanguage, idEmployee]);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    if(e.target.value === '1') {
      setFormLevel( false );
      setFormData({
        employeeLanguageId: selectedLanguage.employeeLanguageId,
        language_id: selectedLanguage.languageId || '',
        level: 0,
        state: selectedLanguage.state || '',
        employeeId: selectedLanguage.employeeId || idEmployee,
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

  
  // Gestion de la validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.language_id) errors.language_id = 'Veuillez sélectionner une langue.';
    if (formLevel && (!formData.level || formData.level < 0 || formData.level > 100)) errors.level = "Le niveau doit être compris entre 1 et 100.";
    if (!formData.state) errors.state = 'Veuillez sélectionner un état.';
    else if (formData.level < 0 || formData.level > 100) errors.year = 'Veuillez entrer un nombre entre 0 et 100.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Retourne `true` si aucune erreur
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
            const response = await api.put(`/EmployeeLanguage/${selectedLanguage.employeeLanguageId}`, dataToSend);
            handleCloseEditLanguage();
            await fetchData();
            setFormData({
              employeeLanguageId: '',
              language_id: '',
              level: 0,
              state: '',
              employeeId: idEmployee,
            });
        } catch (err) {
          setSubmitError(getUserMessage(err, 'modification').message);
        }
    };

    return (
      <Modal
          isOpen={showEditLanguage}
          onRequestClose={handleCloseEditLanguage}
          contentLabel="Modifier nouvelle competence linguistique"
          className="modal-content"
          overlayClassName="modal-overlay"
      >
          <div className="modal-header">
              <h2>Modifier nouvelle competence linguistique</h2>
              <button onClick={handleCloseEditLanguage} className="close-button">&times;</button>
          </div>
          <div className="modal-body">
              {loadingLanguage ? (
                  <div>Chargement...</div>
              ) : errorLanguage ? (
                  <div>Impossible de charger les données nécessaires. Vérifiez votre connexion et réessayez.</div>
              ) : (
                  <form>
                      <div className="form-group">
                          <label>Langue</label>
                          <select name="language_id" value={formData.language_id} onChange={handleChange} className="form-control">
                            <option value="">Sélectionner une langue</option>
                            {dataLanguage.map((item, id) => (
                              <option key={id} value={item.languageId}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.language_id && <small className="error-text">{formErrors.language_id}</small>}
                      </div>
                      <div className="form-group">
                          <label>Etat</label>
                          <select name="state" value={formData.state} onChange={handleChange} className="form-control">
                              <option value="">Sélectionner un état</option>
                              <option value="1">Non validé</option>
                              <option value="5">Validé par évaluation</option>
                          </select>
                          {formErrors.state && <small className="error-text">{formErrors.state}</small>}
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
              <button onClick={handleCloseEditLanguage} className="button button-secondary">Fermer</button>
              <button onClick={handleSubmit} className="button button-primary">Modifier</button>
          </div>
      </Modal>
      );
    }
    
    export default ModalEditLanguage;