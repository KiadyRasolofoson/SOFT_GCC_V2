import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import { useNavigate } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import axios from "axios";
import Loader from '../../helpers/Loader';
import '../../styles/orgChart.css';
import defaultImg from '../../assets/images/default.jpg';
import ModalImportEmployee from '../../components/organizationalChart/ModalImportEmployee';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

// Map des images des départements
const departmentImages = {
    default: defaultImg,
};

// Fonction pour obtenir le chemin de l'image
const getDepartmentImage = (departmentName) => {
    return departmentImages[departmentName.toLowerCase()] || departmentImages.default;
};


// Page pour les nombres des employés par département
function DepartmentEffective() {
    const navigate = useNavigate();

    // Initialisation des states
    const [numberEmployeeByDepartment, setNumberEmployeeByDepartment] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    // Navigation pour ajout
    const handleClickOrg = () => {
        navigate('/softGcc/organigramme');
    };

    // Navigation pour details
    const handleClickDetails = (departmentId) => {
        navigate(`/softGcc/effectif/details/${departmentId}`);
    };

    // Récupération des données à l'aide de l'API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const numberEmployeeByDepartmentResponse = await axios.get(urlApi('/Org/effectifDepartement'));
            setNumberEmployeeByDepartment(numberEmployeeByDepartmentResponse.data);
        } catch (error) {
            setError(`Erreur lors de la récupération des données : ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effet pour déclencher les fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <Template>
            {loading && <Loader />}

            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-calendar-check skill-icon"></i>
                    <p className="skill-title">EFFECTIF PAR DÉPARTEMENT</p>
                </div>
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'Effectif par département', path: '/softGcc/effectif' },
                    { label: 'Liste', path: '/softGcc/effectif' }
                ]}
            />
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mt-3">
                <div className="col-12 d-flex justify-content-end" style={{marginBottom: '10px'}}>
                    <button className="btn-add btn-success btn-fw" onClick={handleClickOrg} style={{float: 'right'}}>
                        <i className="mdi mdi-sitemap"></i>
                        Voir organigramme
                    </button>
                </div>
            </div>

            <div className="row">
                {numberEmployeeByDepartment.map((item) => (
                    <div onClick={() => (handleClickDetails(item.departmentId))} key={item.departmentId} className="col-lg-3 col-md-6 col-sm-12 grid-margin stretch-card">
                        <div className="card department-card">
                            {item.departmentPhoto ? (
                                <img src={urlApi(`/Department/photo/${item.departmentId}`)} 
                                alt="Photo" 
                                className="department-image"/>
                            ) : (
                                <img
                                src={getDepartmentImage(item.departmentName)}
                                alt={item.departmentName}
                                className="department-image"
                            />
                            )}
                            <div className="card-body text-center">
                                <h5 className="department-name">{item.departmentName.toUpperCase()}</h5>
                                <p className="employee-count">{item.nEmployee} employés</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Template>
    );
}

export default DepartmentEffective;
