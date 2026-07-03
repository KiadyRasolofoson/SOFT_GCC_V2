import React, { useState } from "react";
import Template from "../Template";
import Loader from "../../helpers/Loader";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from 'react-router-dom';

// Page de la liste des modèles d'attestation crée
const ModelList = () => {
    // URL en tête de page 
    const module = 'Modèle attestation';
    const action = 'Liste';
    const url = '/modèle'; 

    // Initialisation des variables d'états
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Nvigation vers des pages
    const handleClickNewModel = () => navigate('/softGcc/attestationManagement/edit');


  return (
    <Template>
      {loading && <Loader />}
      <PageHeader module={module} action={action} url={url} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row header-title">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-map-marker-path skill-icon"></i>
          <h4 className="skill-title">GESTION DES MODELES D'ATTESTATION</h4>
        </div>
        <div className="col-lg-2">
          <button onClick={handleClickNewModel} className="btn-add btn-success btn-fw" style={{float: 'right'}}>
            <i className="mdi mdi-plus"></i>
            Nouveau modèle
          </button>
        </div>  
      </div>
      <div className="card mb-4 search-card">
        <div className="card-header title-container">
          <h5 className="title">
            <i className="mdi mdi-filter-outline"></i> Filtres
          </h5>
        </div>
        <div className="card-body">
          <form className="filter-form">
            <div className="form-group">
              <label>Modèle</label>
              <input
                type="text"
                className="form-control"
                placeholder="Recherche..."
                name="model"
              />
            </div>
            <div className="form-group">
              <label>Type d'attestation</label>
              <select
                name="certificateType"
                className="form-control"
              >
                <option value="">Toutes les attestations</option>
                <option value="">Standard</option>
                <option value="">Détaillé</option>
                <option value="">Fin de contrat</option>
              </select>
            </div>
          </form>
        </div>
      </div>
    </Template>
  );
};

export default ModelList;
