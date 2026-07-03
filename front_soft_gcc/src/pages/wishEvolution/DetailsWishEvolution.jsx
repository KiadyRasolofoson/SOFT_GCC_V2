import React, { useState, useEffect } from "react";
import Template from "../Template";
import PageHeader from "../../components/PageHeader";
import "../../styles/careerStyle.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { urlApi } from "../../helpers/utils";
import Loader from "../../helpers/Loader";
import { useNavigate } from 'react-router-dom';
import CancelButton from "../../helpers/CancelButton";
import BreadcrumbPers from "../../helpers/BreadcrumbPers";
import api from "../../helpers/api";

// Fonction utilitaire pour créer le tableau `skillNecessary`
const createSkillNecessary = (skillPosition, skillEmployee) => {
  const skillEmployeeSet = new Set(skillEmployee.map((row) => row.skillId));

  return skillPosition.map((row) => ({
    skillId: row.skillId,
    skillName: row.skillName,
    state: skillEmployeeSet.has(row.skillId) ? "validé" : "non validé",
  }));
};

function DetailsWishEvolution() {
  const module = "Souhait d'évolution";
  const action = "Détails";
  const url = "/souhaitEvolution/details";

  const { WishEvolutionId } = useParams();

  // États
  const [dataDescription, setDataDescription] = useState(null);
  const [dataSkillPosition, setDataSkillPosition] = useState([]);
  const [dataEmployeeSkill, setDataEmployeeSkill] = useState([]);
  const [dataSuggestions, setDataSuggestions] = useState([]);
  const [dataSkillNecessary, setDataSkillNecessary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fonction pour récupérer les données
  const fetchData = async () => {
    setIsLoading(true);
    setError(null); // Réinitialise l'erreur avant de commencer

    try {
      // Récupérer les détails du souhait d'évolution
      const descriptionResponse = await axios.get(urlApi(`/WishEvolution/${WishEvolutionId}`));
      const descriptionData = descriptionResponse.data[0];

      if (!descriptionData) {
        throw new Error("Aucune donnée disponible pour ce souhait d'évolution.");
      }
      setDataDescription(descriptionData);

      // Récupérer les compétences nécessaires et les compétences de l'employé
      const [skillPositionResponse, employeeSkillResponse, suggestionResponse] = await Promise.all([
        axios.get(urlApi(`/WishEvolution/skillPosition/${descriptionData.wishPositionId}`)),
        api.get(urlApi(`/EmployeeSkills/employee/${descriptionData.employeeId}`)),
        axios.get(urlApi(`/WishEvolution/suggestionPosition/${descriptionData.employeeId}`))
      ]);

      setDataSkillPosition(skillPositionResponse.data);
      setDataEmployeeSkill(employeeSkillResponse.data);
      setDataSuggestions(suggestionResponse.data);

      // Créer le tableau `skillNecessary`
      const skillNecessary = createSkillNecessary(skillPositionResponse.data, employeeSkillResponse.data);
      setDataSkillNecessary(skillNecessary);
    } catch (err) {
      console.error(err);
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect pour récupérer les données au chargement
  useEffect(() => {
    if (WishEvolutionId) {
      fetchData();
    }
  }, [WishEvolutionId]);


  // Gérer la validation des etats
  const handleUpdateState = async (state) => {
    setIsLoading(true);
    try {
      const dataToSend = {
        state: state,
        wishEvolutionId: dataDescription.wishEvolutionCareerId,
    };

      const response = await axios.put(urlApi(`/WishEvolution/UpdateState?state=${state}&wishEvolutionId=${dataDescription.wishEvolutionCareerId}`));
      fetchData();
    } catch (error) {
        console.error('Erreur lors de la mise a jour de l\'etat du souhait d\'evolution : ', error.response?.data || error.message);
        setError('Erreur lors de la mise a jour de l\'etat du souhait d\'evolution : '+error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (wishEvolutionId) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(urlApi(`/WishEvolution/${wishEvolutionId}`));
      navigate(`/softGcc/souhaitEvolution/suivi`);
    } catch (error) {
        console.error('Erreur lors de la suppression du souhait d\'evolution : ', error.response?.data || error.message);
        setError('Erreur lors de la suppression du souhait d\'evolution : '+error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation pour modifier
  const handleEdit = (wishEvolutionId) => {
    navigate(`/softGcc/souhaitEvolution/edit/${wishEvolutionId}`);
  };

  // Navigation pour la page des competences
  const handleSkill = () => {
    navigate(`/competences/profil/${dataDescription.employeeId}`);
  };

  // Navigation pour la page des carrieress
  const handleCareer = () => {
    navigate(`/carriere/fiche/${dataDescription.registrationNumber}`);
  };

  return (
    <Template>
      {isLoading && <Loader />}
      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-information-outline skill-icon"></i>
          <p className="skill-title">DÉTAILS DE LA DEMANDE</p>
        </div>
        <div className="col-lg-2">
          <CancelButton to="souhaitEvolution/suivi" />
        </div>  
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/softGcc/tableauBord' },
          { label: 'Souhait évolution', path: '/softGcc/souhaitEvolution/suivi' },
          { label: 'Détails', path: '/softGcc/souhaitEvolution/détails' },
        ]}
      />
      {error && <div className="alert alert-danger">{error}</div>}

     <div className="action-buttons d-flex justify-content-start my-4">
      <button type="button" onClick={handleSkill} className="btn btn-outline-primary mx-2">Compétences</button>
      <button type="button" onClick={handleCareer} className="btn btn-outline-primary mx-2">Carrières</button>
      <button type="button" className="btn btn-outline-primary mx-2">Évaluer</button>
    </div>
      <hr></hr>
        {dataDescription ? (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                  <i className="mdi mdi-note-text me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                  <h3 className="mb-0" style={{color: '#B8860B'}}>Description</h3>
                </div>
                <div className="card-body">
                  <p><strong>Référence employé :</strong> {dataDescription.registrationNumber}</p>
                  <p><strong>Employé demandant :</strong> {`${dataDescription.name} ${dataDescription.firstName}`}</p>
                  <p><strong>Type de souhait :</strong> {dataDescription.wishTypeName}</p>
                  <p><strong>Département :</strong> {dataDescription.actualDepartmentName}</p>
                  <p><strong>Poste actuel :</strong> {dataDescription.actualPositionName}</p>
                  <p><strong>Poste souhaité :</strong> {dataDescription.wishPositionName}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                  <i className="mdi mdi-note-text me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                  <h3 className="mb-0" style={{color: '#B8860B'}}>Description</h3>
                </div>
                <div className="card-body">
                  <p><strong>Création de la demande :</strong> {new Date(dataDescription.creationDate).toLocaleDateString()}</p>
                  <p><strong>Dernière modification :</strong> {new Date(dataDescription.updatedDate).toLocaleDateString()}</p>
                  <p><strong>Disponibilité :</strong> {new Date(dataDescription.disponibility).toLocaleDateString()}</p>
                  <p><strong>Status :</strong>
                    {dataDescription.state === 1 ? (
                      <span className="badge badge-warning">
                        {dataDescription.stateLetter}
                      </span>
                    ) : dataDescription.state === 5 ? (
                      <span className="badge badge-warning">
                        {dataDescription.stateLetter}
                      </span>
                    ) : dataDescription.state === 10 ? (
                      <span className="badge badge-success">
                        {dataDescription.stateLetter}
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        {dataDescription.stateLetter}
                      </span>
                    )}
                  </p>
                  <p><strong>Priorité :</strong> {dataDescription.priorityLetter}</p>
                  <p><strong>Motivation :</strong> {dataDescription.motivation}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Les informations ne sont pas disponibles.</p>
        )}

        <div className="row g-4">
          <div className="col-md-8">
            <div className="card shadow-sm border-0">
              <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                <i className="mdi mdi-checkbox-marked-outline me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                <h3 className="mb-0" style={{color: '#B8860B'}}>Vérification des compétences nécessaires</h3>
              </div>
              <div className="card-body">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Compétence</th>
                      <th>Etat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSkillNecessary.map((item, index) => (
                      <tr key={index}>
                        <td>{item.skillId}</td>
                        <td>{item.skillName}</td>
                        <td className={item.state === "validé" ? "text-success" : "text-danger"}>{item.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                <i className="mdi mdi-briefcase-search me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                <h3 className="mb-0" style={{color: '#B8860B'}}>Postes suggerrées</h3>
              </div>
              <div className="card-body">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Poste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSuggestions.map((item) => (
                      <tr key={item.positionId}>
                        <td>{item.positionId}</td>
                        <td>{item.positionName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-md-12">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                {dataDescription ? (
                  <div className="text-center">
                    {dataDescription.state === 1 ? (
                      <>
                        <button type="button" onClick={() => (handleUpdateState(0))} className="btn btn-danger btn-fw mx-2">Refuser</button>
                        <button type="button" onClick={() => (handleEdit(dataDescription.wishEvolutionCareerId))} className="btn btn-primary btn-fw mx-2">Modifier</button>
                        <button type="button" onClick={() => (handleUpdateState(5))} className="btn btn-warning btn-fw mx-2">Traiter</button>
                        <button type="button" onClick={() => (handleUpdateState(10))} className="btn btn-success btn-fw mx-2">Valider</button>
                      </>
                    ) : dataDescription.state === 5 ? (
                      <>
                        <button type="button" onClick={() => (handleUpdateState(0))} className="btn btn-danger btn-fw mx-2">Refuser</button>
                        <button type="button" onClick={() => (handleEdit(dataDescription.wishEvolutionCareerId))} className="btn btn-primary btn-fw mx-2">Modifier</button>
                        <button type="button" disabled onClick={() => (handleUpdateState(5))} className="btn btn-warning btn-fw mx-2">Traiter</button>
                        <button type="button" onClick={() => (handleUpdateState(10))} className="btn btn-success btn-fw mx-2">Valider</button>
                      </>
                    ) : dataDescription.state === 0 ? (
                      <>
                        <button type="button" onClick={() => (handleDelete(dataDescription.wishEvolutionCareerId))} className="btn btn-danger btn-fw mx-2">Supprimer</button>
                        <button type="button" onClick={() => (handleUpdateState(1))} className="btn btn-primary btn-fw mx-2">Restaurer</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => (handleUpdateState(0))} disabled className="btn btn-danger btn-fw mx-2">Refuser</button>
                        <button type="button" onClick={() => (handleEdit(dataDescription.wishEvolutionCareerId))} disabled className="btn btn-primary btn-fw mx-2">Modifier</button>
                        <button type="button" onClick={() => (handleUpdateState(5))} disabled className="btn btn-warning btn-fw mx-2">Traiter</button>
                        <button type="button" onClick={() => (handleUpdateState(10))} disabled className="btn btn-success btn-fw mx-2">Valider</button>
                      </>
                    )}
                  </div>
                   ) : (
                    <p>Les informations ne sont pas disponibles.</p>
                  )}
                </div>
              </div>
            </div>

        </div>
    </Template>
  );
}

export default DetailsWishEvolution;
