import React, {useState, useEffect} from 'react';
import Template from '../Template';
import PageHeader from '../../components/PageHeader';
import Loader from '../../helpers/Loader';
import { Button } from 'react-bootstrap';
import axios from "axios";
import { urlApi } from "../../helpers/utils";

// Page de creation d'un plan de carriere
function CrudPage({ onSearch }) {
    // Url d'en-tete de page
    const module = "Plan de carrière";
    const action = "Creation";
    const url = "/carriere";

    // Initialisation des states
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(false); 
    const [data, setData] = useState([]); 

    
    // Pour les saisies de donnees
    const [formData, setFormData] = useState({
        niveauId: '',
        name: ''
    });

    // Gérer la soumission du formulaire
    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const dataToSend = {
                ...formData
            };
    
            const response = await axios.post(urlApi('/Degree'), dataToSend);
            fetchData();
        } catch (error) {
            console.error('Erreur lors de l\'insertion :', error.response?.data || error.message);
            setError('Erreur lors de l\'insertion : '+error);
        } finally {
            setIsLoading(false);
        }
    };

    // Récupération des données
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(urlApi(`/Degree`));
            setData(response.data || []);
        } catch (err) {
            console.error(err);
            setError(`Erreur lors de la récupération des données : ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Remplit les données du formulaire après récupération
    useEffect(() => {
        fetchData();
    }, []);

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Valider une suppression d'item de competence
    const handleDeleteConfirmed = async (itemToDelete) => {
        try {
          await axios.delete(urlApi(`/Degree/${itemToDelete}`));
          await fetchData();
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          serError(error.message);
        }
    };
    
    /// Gestion d'affichage de loading
    if (isLoading) {
        return <div>
                <Loader />
            </div>;
    }

    /// Gestion d'affichage d'erreur
    if (error) {
        return <div>Erreur: {error.message}</div>;
    }

    return (
        <Template>
            <PageHeader module={module} action={action} url={url} />

            <h4>ENTITE NIVEAU</h4>
            <form className="forms-sample">
                <div className="row">            
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                            <h5 className="card-title subtitle">Formulaire d'ajout</h5>
                                <div className="form-group">
                                    <label htmlFor="exampleInputEmail1">Designation</label>
                                    <input type="text" name="name" onChange={handleChange} className="form-control" id="exampleInputEmail1"/>
                                </div>
                                <div className="button-save-profil">
                                    <button onClick={handleSubmit} type="button" className="btn btn-success btn-fw">Creer</button>
                                    <button type="button" className="btn btn-light btn-fw">Annuler</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body">
                            <h5 className="card-title subtitle">Liste enregistré</h5>
                            <table className="table table-hover table-bordered">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th>#</th>
                                        <th>Designation</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, id) => (
                                        <tr key={id}>
                                            <td className="text-center">{id}</td>
                                            <td>
                                                <span className="font-medium">{item.name}</span>
                                            </td>
                                            <td>
                                                <Button
                                                    onClick={() => handleDeleteConfirmed(item.degreeId)}
                                                    style={{
                                                        width: '25px',
                                                        height: '25px',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        backgroundColor: 'white',
                                                        border: 'white'
                                                    }}
                                                >
                                                <i className="mdi mdi-delete icon-delete" style={{ fontSize: '20px' }}></i>
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
            </form>
        </Template>
    );
}

export default CrudPage;
