import React, { useState, useEffect } from "react";
import Template from "../../Template";
import PageHeader from "../../../components/PageHeader";
import Loader from "../../../helpers/Loader";
import { Button } from "react-bootstrap";
import axios from "axios";
import { urlApi } from "../../../helpers/utils";

function DepartmentCrudPage() {
    const module = "Plan de carrière";
    const action = "Création";
    const url = "/carriere";

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [formData, setFormData] = useState({ name: "", photo: null });
    const [idItem, setIdItem] = useState(0);
    const [isModifiedPage, setIsModifiedPage] = useState(false);

    const handleChangeToModifiedPage = (id) => {
        setIsModifiedPage(true);
        getDataForModifiedPage(id); // Passer directement l'id ici
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi("/Department"));
            setData(response.data || []);
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData((prevData) => ({ ...prevData, photo: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = new FormData();
        form.append("name", formData.name);
        if (formData.photo) {
            form.append("photo", formData.photo);
        }

        try {
            await axios.post(urlApi("/Department"), form);
            fetchData();
            setFormData({ name: "", photo: null });
        } catch (error) {
            setError(`Erreur lors de l'insertion : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteConfirmed = async (departmentId) => {
        setIsLoading(true);
        setError(null);
        try {
            await axios.delete(urlApi(`/Department/${departmentId}`));
            fetchData();
            setIsModifiedPage(false);
            setFormData({ name: '', photo: null });
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
    
        const form = new FormData();
        form.append("name", formData.name);
        if (formData.photo instanceof File) {
            form.append("photo", formData.photo);
        }
    
        try {
            await axios.put(urlApi(`/Department/${idItem}`), form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            await fetchData(); // Recharge la liste des départements
    
            // Actualiser la photo immédiatement
            setFormData((prevData) => ({
                ...prevData,
                photo: `${urlApi(`/Department/photo/${idItem}`)}?t=${new Date().getTime()}`
            }));
    
        } catch (error) {
            setError(`Erreur lors de la modification : ${error.response?.data || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };    
    

    const getDataForModifiedPage = async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(urlApi(`/Department/${id}`));
            setIdItem(id);
    
            let photoUrl = null;
            if (response.data.photo) {
                photoUrl = `${urlApi(`/Department/photo/${id}`)}?t=${new Date().getTime()}`;
            }
    
            setFormData({
                name: response.data.name,
                photo: photoUrl,
            });
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnnulation = async () => {
        setIsModifiedPage(false);
        setFormData({ name: '', photo: null });
    };

    return (
        <Template>
            <PageHeader module={module} action={action} url={url} />
            <div className="col-lg-12 skill-header">
                <i className="mdi mdi-domain skill-icon"></i>
                <h4 className="skill-title">ENTITÉ DÉPARTEMENT</h4>
            </div>   
            {isLoading && <Loader />}
            {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">            
                    <div className="col-md-6 grid-margin stretch-card">
                        {isModifiedPage ? (
                            <div className="card">
                                <form className="forms-sample" onSubmit={handleSubmitModified}>
                                    <div className="card-header title-container">
                                        <h5 className="title">
                                            <i className="mdi mdi-file-document-edit"></i> Formulaire de modification
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label htmlFor="name">Nom du département</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Photo du département</label>
                                            {formData.photo && !(formData.photo instanceof File) && (
                                                <div>
                                                    <img
                                                        src={formData.photo}
                                                        alt="Photo du département"
                                                        style={{ width: "100px", height: "100px", borderRadius: "5px", marginBottom: "10px" }}
                                                    />
                                                </div>
                                            )}
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
                                    <div className="card-header title-container">
                                        <h5 className="title">
                                            <i className="mdi mdi-file-document-edit"></i> Formulaire d'ajout
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label htmlFor="name">Nom du département</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" id="name" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Photo du département</label>
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
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-header title-container">
                                <h5 className="title">
                                    <i className="mdi mdi-format-list-bulleted"></i> Liste enregistrée
                                </h5>
                            </div>
                            <div className="card-body">
                                <table className="table table-hover table-bordered">
                                    <thead className="bg-primary text-white">
                                        <tr>
                                            <th>#</th>
                                            <th>Photo</th>
                                            <th>Nom</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((dept) => (
                                            <tr key={dept.departmentId}>
                                                <td className="text-center">{dept.departmentId}</td>
                                                <td>
                                                    {dept.photo ? (
                                                        <img src={`${urlApi(`/Department/photo/${dept.departmentId}`)}?t=${new Date().getTime()}`} alt={'Departement '+dept.name} style={{ borderRadius: "5px", width: '70px', height: '70px' }} />
                                                    ) : (
                                                        "Pas de photo"
                                                    )}
                                                </td>
                                                <td>{dept.name}</td>
                                                <td>
                                                    <Button
                                                        onClick={() => handleChangeToModifiedPage(dept.departmentId)}
                                                        className="btn btn-danger btn-sm"
                                                        style={{backgroundColor: 'white'}}
                                                    >
                                                        <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteConfirmed(dept.departmentId)}
                                                        className="btn btn-danger btn-sm"
                                                        style={{backgroundColor: 'white', margin: '20px'}}
                                                    >
                                                        <i className="mdi mdi-delete icon-delete" style={{ fontSize: "20px" }}></i>
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

export default DepartmentCrudPage;
