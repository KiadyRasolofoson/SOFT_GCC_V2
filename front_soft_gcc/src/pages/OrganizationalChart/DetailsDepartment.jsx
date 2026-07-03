import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import { urlApi } from '../../helpers/utils';
import axios from "axios";
import Loader from '../../helpers/Loader';
import '../../styles/orgChart.css';
import pic1 from '/src/assets/images/faces-clipart/pic-1.png';
import '../../styles/skillsStyle.css';
import { useParams } from "react-router-dom";
import CancelButton from '../../helpers/CancelButton';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

// Page pour les nombres des employés par département
function DetailDepartment() {
    // Initialisation des states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { DepartmentId } = useParams();
    const [employeeList, setEmployeeList] = useState([]);
    const [department, setDepartment] = useState(null);

    // Appel des API
    const fetchData = useCallback(async () => {
        if (!DepartmentId) {
            setError("ID du département introuvable.");
            return;
        }

        setLoading(true);
        setError(null); 

        try {
            const [employeeListResponse, departmentResponse] = await Promise.all([
                axios.get(urlApi(`/Org/detailDepartement/${DepartmentId}`)),
                axios.get(urlApi(`/Department/${DepartmentId}`))
            ]);

            setEmployeeList(employeeListResponse.data || []);
            setDepartment(departmentResponse.data || {});
        } catch (error) {
            setError(`Erreur lors de la récupération des données : ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [DepartmentId]);

    // Effet pour déclencher les fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <Template>
            {loading && <Loader />} 
            {department && (
                <>
                    <div className="title-container">
                        <div className="col-lg-10 skill-header">
                            <i className="mdi mdi-domain skill-icon"></i>
                            <p className="skill-title"> DÉPARTEMENT : {department.name || "Inconnu"}</p>
                        </div>

                        <div className="col-lg-2">
                            <CancelButton to="effectif" />
                        </div>  
                    </div>
                    <BreadcrumbPers
                        items={[
                            { label: 'Accueil', path: '/softGcc/tableauBord' },
                            { label: 'Effectif par département', path: '/softGcc/effectif' },
                            { label: 'Détails', path: `/softGcc/effectif/details/${DepartmentId}` },
                        ]}
                    />
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="row">
                        <div className="col-lg-12 grid-margin stretch-card">
                            <div className="card">
                                <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                    <i className="mdi mdi-format-list-bulleted me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                    <h3 className="mb-0" style={{color: '#B8860B'}}>Liste des employés</h3>
                                </div>
                                <div className="card-body">
                                    <table className="table table-competences">
                                        <thead>
                                            <tr>
                                                <th>Photo</th>
                                                <th>Matricule</th>
                                                <th>Nom complet</th>
                                                <th>Poste</th>
                                                <th>Naissance</th>
                                                <th>Ancienneté</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeList.length > 0 ? (
                                                employeeList.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="py-1">
                                                            {item.photo ? (
                                                                <img src={urlApi(`/Employee/photo/${item.employeeId}`)} alt={'Employe '+item.registrationNumber} />
                                                            ) : (
                                                                <p>Aucun photo</p>
                                                                )}
                                                        </td>  
                                                        <td>{item.registrationNumber}</td>
                                                        <td>{`${item.name} ${item.firstName}`}</td>
                                                        <td>{item.positionName}</td>
                                                        <td>{new Date(item.hiringDate).toLocaleDateString()}</td>
                                                        <td style={{color: '#44ce42'}}>{item.seniority}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">
                                                        Aucun employé trouvé.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Template>
    );
}

export default DetailDepartment;
