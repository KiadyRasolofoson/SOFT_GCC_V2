import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import Loader from '../../../helpers/Loader';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import CancelButton from '../../../helpers/CancelButton';

function PositionCrudPage() {
    const module = 'Plan de carrière';
    const action = 'Création';
    const url = '/carriere';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [isModifiedPage, setIsModifiedPage] = useState(false);
    const [idItem, setIdItem] = useState(0);
    
    const [formData, setFormData] = useState({
        positionName: ''
    });

    const handleChangeToModifiedPage = (id) => {
        setIsModifiedPage(true);
        getDataForModifiedPage(id);
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi('/Position'));
            setData(response.data || []);
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await axios.post(urlApi('/Position'), formData);
            fetchData();
            setFormData({ positionName: '' });
        } catch (error) {
            setError(`Erreur lors de l'insertion : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteConfirmed = async (itemToDelete) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.delete(urlApi(`/Position/${itemToDelete}`));
            fetchData();
            setIsModifiedPage(false);
            setFormData({ positionName: '' });
        } catch (error) {
            setError(`Erreur lors de la suppression : ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitModified = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await axios.put(urlApi(`/Position/${idItem}`), formData);
            fetchData();
        } catch (error) {
            setError(`Erreur lors de l'insertion : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getDataForModifiedPage = async (id) => { 
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi(`/Position/${id}`)); 
            setIdItem(id);
            setFormData({
                positionId: response.data.positionId,
                positionName: response.data.positionName 
            });
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnnulation = async () => {
        setIsModifiedPage(false);
        setFormData({ positionName: '' });
    };

    return (
        <Template>
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-briefcase skill-icon"></i>
                    <p className="skill-title">ENTITÉ POSTE</p>
                </div>

                <div className="col-lg-2">
                    <CancelButton to="settings/carriere" />
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'paramètres carrières', path: '/softGcc/settings/carriere' },
                    { label: 'Poste', path: '/softGcc/settings/settings/carriere/poste' },
                ]}
            />
           
            {isLoading && <Loader />}
            {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">            
                    <div className="col-md-6 grid-margin stretch-card">
                        {isModifiedPage ? (
                            <div className="card">
                                <form className="forms-sample" onSubmit={handleSubmitModified}>
                                    <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                        <i className="mdi mdi-file-document-edit me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                        <h3 className="mb-0" style={{color: '#B8860B'}}>Formulaire de modification</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label htmlFor="positionName">Désignation</label>
                                            <input type="text" name="positionName" value={formData.positionName} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="button-save-profil">
                                            <button type="submit" className="btn btn-success btn-fw" disabled={isLoading}>Modifier</button>
                                            <button type="reset" className="btn btn-light btn-fw" onClick={handleAnnulation}>Annuler</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="card">
                                <form className="forms-sample" onSubmit={handleSubmit}>
                                    <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                        <i className="mdi mdi-file-document-edit me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                        <h3 className="mb-0" style={{color: '#B8860B'}}>Formulaire d'ajout</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label htmlFor="positionName">Désignation</label>
                                            <input type="text" name="positionName" value={formData.positionName} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="button-save-profil">
                                            <button type="submit" className="btn btn-success btn-fw" disabled={isLoading}>Créer</button>
                                            <button type="reset" className="btn btn-light btn-fw" onClick={handleAnnulation}>Annuler</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                <i className="mdi mdi-format-list-bulleted me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                <h3 className="mb-0" style={{color: '#B8860B'}}> Liste enregistrée</h3>
                            </div>
                            <div className="card-body">
                                <table className="table table-hover table-bordered">
                                    <thead className="bg-primary text-white">
                                        <tr>
                                            <th>#</th>
                                            <th>Désignation</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, id) => (
                                            <tr key={item.positionId}>
                                                <td className="text-center">{item.positionId}</td>
                                                <td>{item.positionName}</td>
                                                <td>
                                                    <Button
                                                        onClick={() => handleChangeToModifiedPage(item.positionId)}
                                                        className="btn btn-danger btn-sm"
                                                        style={{backgroundColor: 'white'}}
                                                    >
                                                        <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteConfirmed(item.positionId)}
                                                        className="btn btn-danger btn-sm"
                                                        style={{backgroundColor: 'white', margin: '20px'}}
                                                    >
                                                        <i className="mdi mdi-delete icon-delete" 
                                                        style={{fontSize: '20px'}}></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>                
        </Template>
    );
}

export default PositionCrudPage;