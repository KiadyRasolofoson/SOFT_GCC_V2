import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import { urlApi } from '../../helpers/utils';
import axios from "axios";
import Loader from '../../helpers/Loader';
import OrgChart from '../../components/organizationalChart/OrgChart';
import CancelButton from '../../helpers/CancelButton';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

// Page d'organigramme des employes
function EmployeeOrgChart() {
    // Initialisation des states
    const [orgData, setOrgData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    // Récupération des données à l'aide de l'API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            console.log("Fetching data...");
            const orgDataResponse = await axios.get(urlApi('/Org/organigramme'));
            setOrgData(orgDataResponse.data[0]);
        } catch (error) {
            setError(`Erreur lors de la récupération des données : ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effet pour déclencher le fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    return (
        <Template>          
            {loading && <Loader />}

            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-sitemap skill-icon"></i>
                    <p className="skill-title"> ORGANIGRAMME DE L'ENTREPRISE</p>
                </div>

                <div className="col-lg-2">
                    <CancelButton to="effectif" />
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'Effectif par département', path: '/softGcc/effectif' },
                    { label: 'Organigramme entreprise', path: '/softGcc/organigramme' },
                ]}
            />
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="container-responsive">
                <div className="row">
                    <div className="col-lg-12 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                                {orgData ? (
                                    <OrgChart data={orgData} />
                                ) : (
                                    <div>Aucune donnée disponible</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>  
            </div>
        </Template>
    );
}

export default EmployeeOrgChart;
