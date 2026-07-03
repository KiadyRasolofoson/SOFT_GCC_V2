import React, {useState, useEffect} from 'react';
import { Button, Modal } from 'react-bootstrap';
import FormattedDate from '../../helpers/FormattedDate';
import ModalAddSkill from './ModalAddSkill';
import ModalAddEducation from './ModalAddEducation';
import ModalAddLanguage from './ModalAddLanguage';
import ModalAddOtherSkill from './ModalAddOtherSkill';
import ModalEditSkill from './ModalEditSkill';
import ModalEditEducation from './ModalEditEducation';
import ModalEditLanguage from './ModalEditLanguage';
import ModalEditOtherSkill from './ModalEditOtherSkill';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import LoaderComponent from '../../helpers/LoaderComponent';
import DateDisplayNoTime from '../../helpers/DateDisplayNoTime';
import api from '../../helpers/api';

// Lettre d'affichage pour chaque etat
function getStateLetter(state) {
  if(state >= 5 && state <=9) {
    return "Validé par évaluation";
  }
  if(state >= 10) {
    return "Confirmé";
  }

  return "Non validé";
}

//Badge d'affichage pour chaque etat
function getBadgeState(state) {
  if(state >= 5 && state <=9) {
    return "badge badge-warning";
  }
  if(state >= 10) {
    return "badge badge-success";
  }

  return "badge badge-danger";
}

// Gestion des donnees a afficher dans le composant CarSkills (Composant pour gerer les competences salaries)
function CardSkills({ dataEmployeeDescription, idEmployee }) {
  // State pour controller l'affichage
  const [dataColumn, setDataColumn] = useState(['Domaine', 'Competences', 'Niveau', 'Etat']); // Colonne a mettre par defaut
  const [modalDisplay, setModalDisplay] = useState(1);  // Valeur de verite d'affichage d'une modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // State pour la modale de confirmation
  const [itemToDelete, setItemToDelete] = useState(null); // L'élément à supprimer
  const [descriptionToDelete, setDescriptionToDelete] = useState(null); // Description a afficher au moment de la validation de suppression

  // Ajoutez un état pour stocker l'élément sélectionné pour modification
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedOtherSkill, setSelectedOtherSkill] = useState(null);

  //State pour controller les donnees depuis l'api
  const [data, setData] = useState({
    skills: [],
    education: [],
    language: [],
    otherSkills: [],
  });
  
  // State pour gerer le loading et erreur
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /// State pour contrôler l'affichage de la modale
  const [showSkill, setShowSkill] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [showEditEducation, setShowEditEducation] = useState(false);
  const [showEditLanguage, setShowEditLanguage] = useState(false);
  const [showEditOtherSkill, setShowEditOtherSkill] = useState(false);

  /// Pour gerer la navigation
  const [navLinkEducation, setNavLinkEducation] = useState("");
  const [navLinkSkill, setNavLinkSkill] = useState("active");
  const [navLinkLanguage, setNavLinkLanguage] = useState("");
  const [navLinkOther, setNavLinkOther] = useState("");

  // Chargement des donnees depuis l'api 
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [skillsResponse, educationResponse, languageResponse, otherFormationResponse] = await Promise.all([
        api.get(`/EmployeeSkills/employee/${idEmployee}`),
        api.get(`/EmployeeEducation/employee/${idEmployee}`),
        api.get(`/EmployeeLanguage/employee/${idEmployee}`),
        api.get(`/EmployeeOtherFormation/employee/${idEmployee}`)
      ]);
      setData({
        skills: skillsResponse.data || [],
        education: educationResponse.data || [],
        language: languageResponse.data || [],
        otherSkills: otherFormationResponse.data || [],
      });
    } catch (error) {
      console.log(error);
      setError(`Erreur lors de la recuperation des donnees : ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [idEmployee]);

  // Valider une suppression d'item de competence
  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(itemToDelete);
      setShowConfirmDelete(false);
      // Récupérer à nouveau les données après la suppression
      await fetchData(); // Appelez votre fonction fetchData ici
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Non autorisé. Merci de vous reconnecter.");
      } else {
        setError(`Erreur lors de la suppression : ${error.message}`);
      }
      console.error('Erreur lors de la suppression:', error);
    }
  };

/// Fonction pour controler l'affichage du menu competences
  const addCardSkills = () => {
    setDataColumn(['Domaine', 'Competences', 'Niveau', 'Etat']);
    setModalDisplay(1);
    setNavLinkEducation("");
    setNavLinkSkill("active");
    setNavLinkOther("");
    setNavLinkLanguage("");
  };

/// Fonction pour controler l'affichage du menu education
  const addCardEducation = () => {    
    setDataColumn(['Filiere', 'Niveau', 'Ecole', 'Date debut', 'Date fin']);
    setModalDisplay(2);
    setNavLinkEducation("active");
    setNavLinkSkill("");
    setNavLinkOther("");
    setNavLinkLanguage("");
  };

/// Fonction pour controler l'affichage du menu language
  const addCardLanguage = () => {      
    setDataColumn(['Langues', 'Niveau', 'Etat']);
    setModalDisplay(3);
    setNavLinkEducation("");
    setNavLinkSkill("");
    setNavLinkOther("");
    setNavLinkLanguage("active");
  };

/// Fonction pour controler l'affichage du menu autres formations
  const addCardOther = () => {      
    setDataColumn(['Description', 'Date debut', 'Date fin', 'Commentaire']);
    setModalDisplay(4);
    setNavLinkEducation("");
    setNavLinkSkill("");
    setNavLinkOther("active");
    setNavLinkLanguage("");
  };
    
/// Affichage d'une modale de confirmation d'une suppression d'item de competence
  const confirmDeleteItem = (url, description, itemIndex) => {
    setItemToDelete(url);
    setDescriptionToDelete(description);
    setShowConfirmDelete(true); 

    if(itemIndex === 1) {
      dataEmployeeDescription.skillNumber--;
    }
    if(itemIndex === 2) {
      dataEmployeeDescription.educationNumber--;
    }
    if(itemIndex === 3) {
      dataEmployeeDescription.languageNumber--;
    }
    if(itemIndex === 4) {
      dataEmployeeDescription.otherFormationNumber--;
    }
  };

  const handleCloseDelete = () => setShowConfirmDelete(false); // Fermer le popup

/// Fonctions pour ouvrir et fermer la modale
  const handleCloseSkill = () => setShowSkill(false);
  const handleShowSkill = () => setShowSkill(true);

  const handleCloseEducation = () => setShowEducation(false);
  const handleShowEducation = () => setShowEducation(true);

  const handleCloseLanguage = () => setShowLanguage(false);
  const handleShowLanguage = () => setShowLanguage(true);

  const handleCloseOther = () => setShowOther(false);
  const handleShowOther = () => setShowOther(true);
  
  const handleCloseEditSkill = () => setShowEditSkill(false);
  const handleShowEditSkill = () => setShowEditSkill(true);

  const handleCloseEditEducation = () => setShowEditEducation(false);
  const handleShowEditEducation = () => setShowEditEducation(true);
  
  const handleCloseEditLanguage = () => setShowEditLanguage(false);
  const handleShowEditLanguage = () => setShowEditLanguage(true);
  
  const handleCloseEditOtherSkill = () => setShowEditOtherSkill(false);
  const handleShowEditOtherSkill = () => setShowEditOtherSkill(true);

/// Gestion d'affichage de loading
  if (isLoading) {
    return <div>
            <LoaderComponent />
          </div>;
  }

/// Gestion d'affichage d'erreur
  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  return (
        <div className="row">
            <div className="col-lg-12 grid-margin stretch-card">
              <div className="card">
                <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                  <i className="mdi mdi-school me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                  <h3 className="mb-0" style={{color: '#B8860B'}}> Compétences </h3>
                </div>
                <div className="card-body">
                  <div className="d-sm-flex justify-content-between align-items-center transaparent-tab-border {">
                    
                  {/* Menu de navigation des competences */}
                    <ul className="nav nav-tabs tab-transparent" role="tablist">
                      <li className="nav-item">
                          <a onClick={addCardEducation} className={"nav-link "+navLinkEducation} id="home-tab" data-toggle="tab" href="#" role="tab" aria-selected="true">Diplomes & formations ({dataEmployeeDescription.educationNumber})</a>
                      </li>
                      <li className="nav-item">
                          <a onClick={addCardSkills} className={"nav-link "+navLinkSkill} id="business-tab" data-toggle="tab" href="#business-1" role="tab" aria-selected="false">Competences ({dataEmployeeDescription.skillNumber})</a>
                      </li>
                      <li className="nav-item">
                          <a onClick={addCardLanguage} className={"nav-link "+navLinkLanguage} id="performance-tab" data-toggle="tab" href="#" role="tab" aria-selected="false">Langues ({dataEmployeeDescription.languageNumber})</a>
                      </li>
                      <li className="nav-item">
                          <a onClick={addCardOther} className={"nav-link "+navLinkOther} id="conversion-tab" data-toggle="tab" href="#" role="tab" aria-selected="false">Autres ({dataEmployeeDescription.otherFormationNumber})</a>
                      </li>
                    </ul>
    
                  {/* Affichage des modals de competences */}
                    <ModalAddSkill showSkill={showSkill} handleCloseSkill={handleCloseSkill} idEmployee={idEmployee} fetchData={fetchData} error={error} dataEmployeeDescription={dataEmployeeDescription}/>   
                    <ModalAddEducation showEducation={showEducation} handleCloseEducation={handleCloseEducation} idEmployee={idEmployee} fetchData={fetchData} error={error} dataEmployeeDescription={dataEmployeeDescription} />     
                    <ModalAddLanguage showLanguage={showLanguage} handleCloseLanguage={handleCloseLanguage} idEmployee={idEmployee} fetchData={fetchData} error={error} dataEmployeeDescription={dataEmployeeDescription} />     
                    <ModalAddOtherSkill showOtherSkill={showOther} handleCloseOtherSkill={handleCloseOther} idEmployee={idEmployee} fetchData={fetchData} error={error} dataEmployeeDescription={dataEmployeeDescription} /> 
                    <ModalEditSkill showEditSkill={showEditSkill} handleCloseEditSkill={handleCloseEditSkill} selectedSkill={selectedSkill} idEmployee={idEmployee} fetchData={fetchData} error={error} />  
                    <ModalEditEducation showEditEducation={showEditEducation} handleCloseEditEducation={handleCloseEditEducation} selectedEducation={selectedEducation} idEmployee={idEmployee} fetchData={fetchData} error={error} /> 
                    <ModalEditLanguage showEditLanguage={showEditLanguage} handleCloseEditLanguage={handleCloseEditLanguage} selectedLanguage={selectedLanguage} idEmployee={idEmployee} fetchData={fetchData} error={error} />  
                    <ModalEditOtherSkill showEditOtherSkill={showEditOtherSkill} handleCloseEditOtherSkill={handleCloseEditOtherSkill} selectedOtherSkill={selectedOtherSkill} idEmployee={idEmployee} fetchData={fetchData} error={error} /> 

                    <Modal show={showConfirmDelete} onHide={handleCloseDelete}>
                      <Modal.Header closeButton>
                        <Modal.Title>Confirmer la suppression</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>Êtes-vous sûr de vouloir supprimer {descriptionToDelete} ?
                        {error && <div className="alert alert-danger">{error}</div>}
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseDelete}>
                          Non
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirmed}>
                          Oui
                        </Button>
                      </Modal.Footer>
                    </Modal>
                 
                  {/*Condition d'affichage pour gerer les modales de competences a afficher */}
                    {modalDisplay === 2 ? (
                      <div className="d-md-block d-none">
                          <Button
                            variant="success"
                            onClick={handleShowEducation}
                            style={{
                              width: '25px',
                              height: '25px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'green'
                            }}
                          >
                            <i
                              className="mdi mdi-plus-box icon-add-skill"
                              style={{ fontSize: '20px' }}
                            ></i>
                          </Button>
                      </div>
                    ) : modalDisplay === 3 ? (
                      <div className="d-md-block d-none">
                          <Button
                            variant="success"
                            onClick={handleShowLanguage}
                            style={{
                              width: '25px',
                              height: '25px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'green'
                            }}
                          >
                            <i
                              className="mdi mdi-plus-box icon-add-skill"
                              style={{ fontSize: '20px' }}
                            ></i>
                          </Button>
                      </div>
                    ) : modalDisplay === 4 ? (
                      <div className="d-md-block d-none">
                          <Button
                            variant="success"
                            onClick={handleShowOther}
                            style={{
                              width: '25px',
                              height: '25px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'green'
                            }}
                          >
                            <i
                              className="mdi mdi-plus-box icon-add-skill"
                              style={{ fontSize: '20px' }}
                            ></i>
                          </Button>
                        </div>
                      ) : (
                        <div className="d-md-block d-none">
                          <Button
                            variant="success"
                            onClick={handleShowSkill}
                            style={{
                              width: '25px',
                              height: '25px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'green'
                            }}
                          >
                            <i
                              className="mdi mdi-plus-box icon-add-skill"
                              style={{ fontSize: '20px' }}
                            ></i>
                          </Button>
                        </div>
                    )}
                  </div>
                    <table className="table table-bordered table-skill">
                      <tbody>
                        <tr>
                          {dataColumn.map((item, index) => (
                            <th key={index}>{item}</th>
                          ))}
                        </tr>

                      {/* Affichage des tables de competences */}
                        {modalDisplay === 2 ? (
                          Array.isArray(data.education) && data.education.map((item, id) => (
                            <tr key={id}>
                              <td>{item.studyPathName}</td>
                              <td>{item.degreeName}</td>
                              <td>{item.schoolName}</td>
                              <td><DateDisplayNoTime isoDate= {item.startDate} /></td>
                              <td><DateDisplayNoTime isoDate= {item.endingDate} /></td>
                              <td>
                                <Button
                                  onClick={() => {
                                    setSelectedEducation(item); // Stockez l'élément sélectionné dans l'état
                                    handleShowEditEducation(); // Ouvrez la modale de modification
                                  }}
                                  style={{
                                    width: '25px',
                                    height: '25px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    border: 'white',
                                  }}
                                >
                                  <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                </Button>
                              </td>
                              <td>
                                <Button
                                  onClick={() => confirmDeleteItem(`/EmployeeEducation/${item.employeeEducationId}`, ` le diplome & formation ${item.studyPathName} ${item.degreeName}`, 2)}
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
                          ))
                        ) : modalDisplay === 3 ? (
                          Array.isArray(data.language) && data.language.map((item, id) => (
                            <tr key={id}>
                              <td>{item.languageName}</td>
                              <td>
                                {item.level == 0 ? (
                                  <span>NULL</span>
                                ) : (
                                  <span>{item.level} %</span>
                                )}
                              </td>
                              <td>
                                <label className={getBadgeState(item.state)}>
                                  {getStateLetter(item.state)}
                                </label>
                              </td>
                              <td>
                                <Button
                                  onClick={() => {
                                    setSelectedLanguage(item); // Stockez l'élément sélectionné dans l'état
                                    handleShowEditLanguage(); // Ouvrez la modale de modification
                                  }}
                                  style={{
                                    width: '25px',
                                    height: '25px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    border: 'white',
                                  }}
                                >
                                  <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                </Button>
                              </td>
                              <td>
                                <Button
                                  onClick={() => confirmDeleteItem(`/EmployeeLanguage/${item.employeeLanguageId}`, ` la competence linguistique ${item.languageName}`, 3)}
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
                          ))
                        ) : modalDisplay === 4 ? (
                          Array.isArray(data.otherSkills) && data.otherSkills.map((item, id) => (
                            <tr key={id}>
                              <td>{item.description}</td>
                              <td><FormattedDate date={item.startDate} /></td>
                              <td><FormattedDate date={item.endDate} /></td>
                              <td>{item.comment}</td>
                              <td>
                                <Button
                                  onClick={() => {
                                    setSelectedOtherSkill(item); // Stockez l'élément sélectionné dans l'état
                                    handleShowEditOtherSkill(); // Ouvrez la modale de modification
                                  }}
                                  style={{
                                    width: '25px',
                                    height: '25px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    border: 'white',
                                  }}
                                >
                                  <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                </Button>
                              </td>
                              <td>
                                <Button
                                  onClick={() => confirmDeleteItem(`/EmployeeOtherFormation/${item.employeeOtherFormationId}`, ` la formation ${item.description}`, 4)}
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
                          ))
                        ) : (
                          data.skills && data.skills.map((item, id) => (
                            <tr key={id}>
                              <td>{item.domainSkillName}</td>
                              <td>{item.skillName}</td>
                              <td>
                                {item.level == 0 ? (
                                  <span>NULL</span>
                                ) : (
                                  <span>{item.level} %</span>
                                )}
                              </td>
                              <td>
                                <label className={getBadgeState(item.state)}>
                                  {getStateLetter(item.state)}
                                </label>
                              </td>
                              <td>
                                <Button
                                  onClick={() => {
                                    setSelectedSkill(item); // Stockez l'élément sélectionné dans l'état
                                    handleShowEditSkill(); // Ouvrez la modale de modification
                                  }}
                                  style={{
                                    width: '25px',
                                    height: '25px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'white',
                                    border: 'white',
                                  }}
                                >
                                  <i className="mdi mdi-pencil icon-edit" style={{ fontSize: '20px' }}></i>
                                </Button>
                              </td>
                              <td>
                                <Button
                                  onClick={() => confirmDeleteItem(`/employeeSkills/${item.employeeSkillId}`, ` la competence ${item.skillName}`, 1)}
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
                          ))
                        )}

                      </tbody>
                    </table>
                </div>
              </div>
            </div>
        </div>
      );
    }

export default CardSkills;