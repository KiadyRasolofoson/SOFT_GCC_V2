import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import '../../styles/skillsStyle.css';
import '../../styles/pagination.css';
import { useNavigate } from 'react-router-dom';
import Loader from '../../helpers/Loader';
import '../../styles/pagination.css';
import BarChart from '../../components/BarChart';
import { urlApi } from '../../helpers/utils';
import axios from "axios";
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

// Page de suivi des souhaits d'évolution
function SettingCareerPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 

    const  [listSettings, setListSettings] = useState([
        {url: '/soft-gcc/parametres/carrieres/types-affectation', crudName: 'Type d\'affectation', icon: 'mdi mdi-account-arrow-right settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/types-certificat', crudName: 'Type de certificat', icon: 'mdi mdi-certificate settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/echelons', crudName: 'Echelon', icon: 'mdi mdi-stairs settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/types-employe', crudName: 'Type de contrat', icon: 'mdi mdi-account-tie settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/etablissements', crudName: 'Etablissement', icon: 'mdi mdi-domain settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/fonctions', crudName: 'Fonction', icon: 'mdi mdi-briefcase settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/indications', crudName: 'Indice', icon: 'mdi mdi-star settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/classes-legales', crudName: 'Classe legale', icon: 'mdi mdi-gavel settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/bulletins', crudName: 'Bulletin', icon: 'mdi mdi-newspaper settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/methodes-paiement', crudName: 'Methode de paiement', icon: 'mdi mdi-credit-card settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/postes', crudName: 'Poste', icon: 'mdi mdi-briefcase settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/categories-professionnelles', crudName: 'Categorie professionnelle', icon: 'mdi mdi-account-tie settings-icon'},
        {url: '/soft-gcc/parametres/carrieres/categories-socio-professionnelles', crudName: 'Categorie socio-professionnelle', icon: 'mdi mdi-account-tie settings-icon'},
    ]);
    
    // Navigation dans la page de crud
    const handleCrudPage = (item) => {
        navigate(item.url);
    };

    return (
        <Template>
            {loading && <Loader />} {/* Affichez le loader lorsque `loading` est true */}
          
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                <i className="mdi mdi-settings skill-icon"></i>
                <p className="skill-title">PARAMÈTRE DES CARRIÈRES</p>
                </div>
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
                    { label: 'paramètres carrières', path: '/soft-gcc/parametres/carrieres' },
                    { label: 'Menu', path: '/soft-gcc/parametres/carrieres' },
                ]}
            />
            
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row">
                {listSettings.map((item, id) => (
                    <div key={id} className="col-lg-2 grid-margin stretch-card">
                        <div onClick={() => (handleCrudPage(item))} className="card settings-card">
                            <div className="card-body"> 
                                <h5 className="card-text">
                                    <i className={item.icon}></i>
                                    <span className='settings-title'>{item.crudName}</span> 
                                </h5>
                            </div>
                        </div>
                    </div>
                ))}
            </div>        
        </Template>
      );
}

export default SettingCareerPage;
