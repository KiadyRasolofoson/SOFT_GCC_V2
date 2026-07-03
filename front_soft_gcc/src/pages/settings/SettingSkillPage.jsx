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
function SettingSkillPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 

    const  [listSettings, setListSettings] = useState([
        {url: '/softGcc/settings/competence/niveau', crudName: 'Niveau d\'étude', icon: 'mdi mdi-star settings-icon'}, 
        {url: '/softGcc/settings/competence/departement', crudName: 'Département', icon: 'mdi mdi-domain settings-icon'}, 
        {url: '/softGcc/settings/competence/domaine', crudName: 'Domaine de compétence', icon: 'mdi mdi-briefcase settings-icon'}, 
        {url: '/softGcc/settings/competence/language', crudName: 'Language', icon: 'mdi mdi-book-open-variant settings-icon'}, 
        {url: '/softGcc/settings/competence/ecole', crudName: 'Ecole', icon: 'mdi mdi-school settings-icon'}, 
        {url: '/softGcc/settings/competence/competence', crudName: 'Compétence', icon: 'mdi mdi-star-circle settings-icon'}, 
        {url: '/softGcc/settings/competence/filiere', crudName: 'Filière', icon: 'mdi mdi-library settings-icon'}
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
                <p className="skill-title">PARAMÈTRE DES COMPÉTENCES</p>
                </div>
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'paramètres compétences', path: '/softGcc/settings/competence' },
                    { label: 'Menu', path: '/softGcc/settings/competence' },
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

export default SettingSkillPage;
