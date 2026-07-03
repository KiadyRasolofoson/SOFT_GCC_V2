import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import Loader from '../../../helpers/Loader';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import CancelButton from '../../../helpers/CancelButton';

function EstablishmentCrudPage() {
    const module = 'Plan de carrière';
    const action = 'Création';
    const url = '/carriere';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [isModifiedPage, setIsModifiedPage] = useState(false);
    const [idItem, setIdItem] = useState(0);
    
    const [formData, setFormData] = useState({
        establishmentName: '',
        adress: '',
        phoneNumber: '',
        email: '',
        website: '',
        socialMedia: '',
        logo: null
    });

    const handleChangeToModifiedPage = (id) => {
        setIsModifiedPage(true);
        getDataForModifiedPage(id);
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi('/Establishment'));
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
            const form = new FormData();
            form.append("establishmentName", formData.establishmentName);
            form.append("adress", formData.adress);
            form.append("phoneNumber", formData.phoneNumber);
            form.append("email", formData.email);
            form.append("website", formData.website);
            form.append("socialMedia", formData.socialMedia);
            if (formData.logo) {
                form.append("logo", formData.logo);
            }

            await axios.post(urlApi('/Establishment'), form, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            fetchData();
            setFormData({
                establishmentName: '',
                adress: '',
                phoneNumber: '',
                email: '',
                website: '',
                socialMedia: '',
                logo: null
            });
        } catch (error) {
            console.log(error);
            setError(`Erreur lors de l'insertion : ${JSON.stringify(error.response?.data?.errors || error.message)}`);
        } finally {
            setIsLoading(false);
        }
    };


    const handleDeleteConfirmed = async (itemToDelete) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.delete(urlApi(`/Establishment/${itemToDelete}`));
            fetchData();
            setIsModifiedPage(false);
            setFormData({ establishmentName: '' });
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
            const form = new FormData();
            form.append("establishmentName", formData.establishmentName);
            form.append("adress", formData.adress);
            form.append("phoneNumber", formData.phoneNumber);
            form.append("email", formData.email);
            form.append("website", formData.website);
            form.append("socialMedia", formData.socialMedia);
            if (formData.logo instanceof File) {
                form.append("logo", formData.logo);
            }

            await axios.put(urlApi(`/Establishment/${idItem}`), form);
            fetchData();
        } catch (error) {
            console.log(error);
            setError(`Erreur lors de l'insertion : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getDataForModifiedPage = async (id) => { 
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi(`/Establishment/${id}`)); 
            setIdItem(id);

            let logoUrl = null;
            if (response.data.logo) {
                logoUrl = `${urlApi(`/Establishment/logo/${id}`)}?t=${new Date().getTime()}`;
            }
            setFormData({
                establishmentId: response.data.establishmentId,
                establishmentName: response.data.establishmentName,
                adress: response.data.address,
                phoneNumber: response.data.phoneNumber,
                email: response.data.email,
                website: response.data.website,
                socialMedia: response.data.socialMedia,
                logo: logoUrl
            });
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnnulation = async () => {
        setIsModifiedPage(false);
        setFormData({ 
            establishmentName: '',
            adress: '',
            phoneNumber: '',
            email: '',
            website: '',
            socialMedia: '',
            logo: null        
        });
    };

    const handleFileChange = (e) => {
        setFormData((prevData) => ({ ...prevData, logo: e.target.files[0] }));
    };

    return (
        <Template>
            <PageHeader module={module} action={action} url={url} />
           
            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-domain skill-icon"></i>
                    <p className="skill-title">ENTITÉ ETABLISSEMENT</p>
                </div>

                <div className="col-lg-2">
                    <CancelButton to="settings/carriere" />
                </div>  
            </div>
            {isLoading && <Loader />}
            {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">    
                    <div className="col-md-9 grid-margin stretch-card">
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
                                            <th>Logo</th>
                                            <th>Désignation</th>
                                            <th>Adresse</th>
                                            <th>Contact</th>
                                            <th>Email</th>
                                            <th>Site web</th>
                                            <th>Réseaux sociaux</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.establishmentId}>
                                                <td className="text-center">{item.establishmentId}</td>
                                                <td>
                                                    {item.logo ? (
                                                        <img src={`${urlApi(`/Establishment/logo/${item.establishmentId}`)}?t=${new Date().getTime()}`} alt={'Entreprise '+item.establishmentName} style={{ borderRadius: "5px", width: '70px', height: '70px' }} />
                                                    ) : (
                                                        "Pas de photo"
                                                    )}
                                                </td>
                                                <td>{item.establishmentName}</td>
                                                <td>{item.address }</td>
                                                <td>{item.phoneNumber}</td>
                                                <td>{item.email}</td>
                                                <td>{item.website}</td>
                                                <td>{item.socialMedia}</td>
                                                <td>
                                                    <Button
                                                        onClick={() => handleChangeToModifiedPage(item.establishmentId)}
                                                        className="btn btn-danger btn-sm"
                                                        style={{backgroundColor: 'white'}}
                                                    >
                                                        <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteConfirmed(item.establishmentId)}
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
                    <div className="col-md-3 grid-margin stretch-card">
                        {isModifiedPage ? (
                            <div className="card">
                                <form className="forms-sample" onSubmit={handleSubmitModified}>
                                    <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                                        <i className="mdi mdi-file-document-edit me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                                        <h3 className="mb-0" style={{color: '#B8860B'}}>Formulaire de modification</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label htmlFor="establishmentName">Désignation</label>
                                            <input type="text" name="establishmentName" value={formData.establishmentName} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="adress">Adresse</label>
                                            <input type="text" name="adress" value={formData.adress} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phoneNumber">Télephone</label>
                                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input type="text" name="email" value={formData.email} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="website">Site web</label>
                                            <input type="text" name="website" value={formData.website} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                           <div className="form-group">
                                            <label htmlFor="socialMedia">Réseaux sociaux</label>
                                            <input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Logo</label>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="form-control" />
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
                                            <label htmlFor="establishmentName">Désignation</label>
                                            <input type="text" name="establishmentName" value={formData.establishmentName} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="adress">Adresse</label>
                                            <input type="text" name="adress" value={formData.adress} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phoneNumber">Télephone</label>
                                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input type="text" name="email" value={formData.email} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="website">Site web</label>
                                            <input type="text" name="website" value={formData.website} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                           <div className="form-group">
                                            <label htmlFor="socialMedia">Réseaux sociaux</label>
                                            <input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Logo</label>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="form-control" />
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
                </div>                
        </Template>
    );
}

export default EstablishmentCrudPage;