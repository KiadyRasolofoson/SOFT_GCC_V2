import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import Loader from '../../../helpers/Loader';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import CancelButton from '../../../helpers/CancelButton';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';

function DegreeCrudPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [idItem, setIdItem] = useState(0);
    const [isModifiedPage, setIsModifiedPage] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);


    
    const [formData, setFormData] = useState({
        name: ''
    });

    const handleChangeToModifiedPage = (id) => {
        setIsModifiedPage(true);
        getDataForModifiedPage(id); // Passer directement l'id ici
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi('/Degree'));
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
            console.log(formData);
            await axios.post(urlApi('/Degree'), formData);
            fetchData();
            setFormData({ name: '' });
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
            await axios.delete(urlApi(`/Degree/${itemToDelete}`));
            fetchData();
            setIsModifiedPage(false);
            setFormData({ name: '' });
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
            await axios.put(urlApi(`/Degree/${idItem}`), formData);
            fetchData();
        } catch (error) {
            setError(`Erreur lors de l'insertion : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getDataForModifiedPage = async (id) => { // Recevoir l'id en paramètre
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi(`/Degree/${id}`)); // Utiliser l'id passé
            setIdItem(id);
            setFormData({
                degreeId: response.data.degreeId,
                name: response.data.name // Prendre directement la bonne valeur
            });
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnnulation = async () => {
        setIsModifiedPage(false);
        setFormData({ name: '' });
    };

    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <Template>
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-star skill-icon"></i>
                    <p className="skill-title">ENTITÉ NIVEAU D'ÉTUDE</p>
                </div>

                <div className="col-lg-2">
                    <CancelButton to="settings/competence" />
                </div>  
            </div>
            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'paramètres compétences', path: '/softGcc/settings/competence' },
                    { label: 'Niveau étude', path: '/softGcc/settings/competence/niveau' },
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
                                            <label htmlFor="name">Désignation</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" id="name" required />
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
                                            <label htmlFor="name">Désignation</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" id="name" required />
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
                                <div className="d-flex justify-content-between mb-3">
                                    <div className="form-group">
                                        <label htmlFor="itemsPerPage" className="me-2">Éléments par page :</label>
                                        <select
                                        id="itemsPerPage"
                                        className="form-select"
                                        style={{ width: '120px', display: 'inline-block' }}
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(parseInt(e.target.value));
                                            setCurrentPage(1); // Réinitialiser la page
                                        }}
                                        >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Rechercher une désignation..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1); // Réinitialiser la page
                                        }}
                                        />
                                    </div>
                                </div>

                                <table className="table table-hover table-bordered">
                                    <thead className="bg-primary text-white">
                                        <tr>
                                            <th>#</th>
                                            <th>Désignation</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((item) => (
                                            <tr key={item.degreeId}>
                                            <td className="text-center">{item.degreeId}</td>
                                            <td>{item.name}</td>
                                            <td>
                                                <Button onClick={() => handleChangeToModifiedPage(item.degreeId)} className="btn btn-danger btn-sm" style={{ backgroundColor: 'white' }}>
                                                <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                                </Button>
                                                <Button onClick={() => handleDeleteConfirmed(item.degreeId)} className="btn btn-danger btn-sm" style={{ backgroundColor: 'white', margin: '20px' }}>
                                                <i className="mdi mdi-delete icon-delete" style={{ fontSize: '20px' }}></i>
                                                </Button>
                                            </td>
                                            </tr>
                                        ))}
                                    </tbody>


                                </table>

                                <nav className="mt-3">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>Précédent</button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                        <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                            <button onClick={() => paginate(i + 1)} className="page-link">{i + 1}</button>
                                        </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>Suivant</button>
                                        </li>
                                    </ul>
                                </nav>


                            </div>
                        </div>
                    </div>
                </div>                
        </Template>
    );
}

export default DegreeCrudPage;