import React, { useState } from 'react';
import Modal from 'react-modal';
import Fetcher from '../Fetcher';
import useSWR from 'swr';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import '../../styles/modal.css';
import api from '../../helpers/api';
import { getUserMessage } from '../../helpers/errorHandler';
    
// Gerer l'inertion d'une langue
function ModalAddLanguage ({ showLanguage, handleCloseLanguage, idEmployee, fetchData, error, dataEmployeeDescription }) {
  // Appel API pour charger les données
  const { data: dataLanguage, error: errorLanguage, isLoading: loadingLanguage } = useSWR('/Language', Fetcher);
    
  // Gestion état du formulaire
  const [formData, setFormData] = useState({
    language_id: '',
    level: 0,
    state: '',
    employeeId: idEmployee,
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(''); 
  const [formLevel, setFormLevel] = useState(false); 

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    if(e.target.value === '1')  setFormLevel( false );
    if(e.target.value === '5')  setFormLevel( true );

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

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Retourne `true` si aucune erreur
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return; 

      try {
          const dataToSend = {
              ...formData,
              creationDate: new Date().toISOString(),
              updateDate: new Date().toISOString(),
          };

          const response = await api.post('/EmployeeLanguage', dataToSend);
          handleCloseLanguage(); 
          await fetchData();
          dataEmployeeDescription.languageNumber++;
          setFormData({
            language_id: '',
            level: 0,
            state: '',
            employeeId: idEmployee
        });
        } catch (err) {
          console.error('Erreur lors de l\'insertion :', err);
          setSubmitError(getUserMessage(err, 'insertion').message);
      }
  };
        

    return (
      <Modal
          isOpen={showLanguage}
          onRequestClose={handleCloseLanguage}
          contentLabel="Ajouter une nouvelle competence linguistique"
          className="modal-content"
          overlayClassName="modal-overlay"
      >
          <div className="modal-header">
              <h2>Ajouter une nouvelle competence linguistique</h2>
              <button onClick={handleCloseLanguage} className="close-button">&times;</button>
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
                              <option value="1">Non evalué</option>
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
              <button onClick={handleCloseLanguage} className="button button-secondary">Fermer</button>
              <button onClick={handleSubmit} className="button button-primary">Valider</button>
          </div>
      </Modal>
      );
    }
    
    export default ModalAddLanguage;
    