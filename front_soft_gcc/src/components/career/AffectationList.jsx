import React, {useState, useEffect} from 'react';
import { Dropdown, Button, Modal, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import FormattedDate from '../../helpers/FormattedDate';

// Pour lister les types d'affectation
function AffectationList({ dataAssignmentAppointment, dataAssignmentAdvancement, dataAssignmentAvailability, fetchData }) {
    // Initialisation des variables 
    const navigate = useNavigate();
    const [selectedAssignment, setSelectedAssignment] = useState(1);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false); // State pour la modale de confirmation
    const [itemToDelete, setItemToDelete] = useState(null); // L'élément à supprimer
    const [descriptionToDelete, setDescriptionToDelete] = useState(null); // Description a afficher au moment de la validation de suppression
    const [successMessage, setSuccessMessage] = useState(null); // État pour le message de succès
    const [error, setError] = useState(null); 

    // Mapping des types d'affectation
    const assignmentTypes = {
    1: 'Nomination',
    2: 'Avancements',
    3: 'Mise en disponibilités'
    };

    // Click sur le bouton edit 
    const handleClickEdit = (item) => {
        navigate(`/softGcc/carriere/fiche/edit/${item.careerPlanId}`); 
    };

    // Click sur le bouton détails
    const handleClickDetail = (item) => {
        navigate(`/softGcc/carriere/fiche/detail/${item.careerPlanId}`); 
    };

    /// Affichage d'une modale de confirmation d'une suppression d'item de competence
    const confirmDeleteItem = (url, description) => {
        setItemToDelete(url);
        setDescriptionToDelete(description);
        setShowConfirmDelete(true); 
    };

    // Fermer la modale de suppression
    const handleCloseDelete = () => setShowConfirmDelete(false);

    // Valider une suppression d'item de competence
    const handleDeleteConfirmed = async () => {
        try {
            await axios.put(urlApi(itemToDelete));
            setShowConfirmDelete(false);
            setSuccessMessage("L'élément a été supprimé avec succès."); 
            await fetchData();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            setError('Erreur lors de la suppression:' + error.message);
        }
    };

    // Réinitialise les messages après un certain temps
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000); 

            return () => clearTimeout(timer); 
        }
    }, [successMessage, error]);

    return (
        <div className="row"> 
            {successMessage && (
                <Alert variant="success" className="mb-4">
                    {successMessage}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}
            <div className="col-md-12 grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">  
                        <div className="template-demo">
                            <Dropdown>
                                <Dropdown.Toggle variant="warning" id="dropdown-basic">
                                {selectedAssignment ? assignmentTypes[selectedAssignment] : "Type d'affectation"}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                <Dropdown.Header>Type d'affectation</Dropdown.Header>
                                {Object.entries(assignmentTypes).map(([key, label]) => (
                                    <Dropdown.Item
                                    key={key}
                                    active={selectedAssignment === parseInt(key)}
                                    onClick={() => setSelectedAssignment(parseInt(key))}
                                    >
                                    {label}
                                    </Dropdown.Item>
                                ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <Modal show={showConfirmDelete} onHide={handleCloseDelete}>
                        <Modal.Header closeButton>
                            <Modal.Title>Confirmer la suppression</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Êtes-vous sûr de vouloir supprimer {descriptionToDelete} ?</Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseDelete}>
                            Non
                            </Button>
                            <Button variant="danger" onClick={handleDeleteConfirmed}>
                            Oui
                            </Button>
                        </Modal.Footer>
                        </Modal>
                        <br></br>
                        <div className='table-responsive'>
                            {selectedAssignment === 1 ? (
                                <>
                                    {/* Nomination */}
                                    <h4 className="title" 
                                        style={{
                                        color: '#B8860B',  
                                        borderBottom: '2px solid #B8860B', 
                                        paddingBottom: '5px',
                                        marginBottom: '50px'
                                        }}
                                    >Nomination</h4>
                                    <table className="table table-competences">
                                        <thead>
                                            <tr>
                                                <th>Date d'affectation</th>
                                                <th>Etablissement</th>
                                                <th>Département</th>
                                                <th>Poste</th>
                                                <th>Type</th>
                                                <th>Debut</th>
                                                <th>Fin</th>
                                                <th>Salaire</th>
                                                <th>Etat</th>
                                                <th>action</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(dataAssignmentAppointment) && dataAssignmentAppointment.map((item, id) => (
                                                <tr key={id}>
                                                    <td>{new Date(item.assignmentDate).toLocaleDateString()}</td>
                                                    <td>{item.establishmentName}</td> 
                                                    <td>{item.departmentName}</td>
                                                    <td>{item.positionName}</td>
                                                    <td>{item.employeeTypeName}</td>
                                                    <td><FormattedDate date={item.assignmentDate} /></td>
                                                    <td><FormattedDate date={item.endingContract} /></td>
                                                    <td>{item.netSalary}</td>
                                                    
                                                    {item.careerState !== 'terminé' ? (
                                                        <>
                                                            <td>
                                                                <label className='badge badge-success'>{item.careerState}</label>
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    onClick={() => {
                                                                        handleClickEdit(item);
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
                                                                    onClick={() => confirmDeleteItem(`/CareerPlan/delete/${item.careerPlanId}`, ` la carriere ${item.assignmentTypeName} pour l'employe ${item.registrationNumber}`)}
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>
                                                                <label className='badge badge-warning'>{item.careerState}</label>
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    onClick={() => {
                                                                        handleClickDetail(item);
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
                                                        </>
                                                    )}
                                                    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : selectedAssignment === 2 ? (
                                <>
                                    {/* Avancements */}
                                    <h4 className="title" 
                                        style={{
                                            color: '#B8860B',  
                                            borderBottom: '2px solid #B8860B', 
                                            paddingBottom: '5px',
                                            marginBottom: '50px'
                                        }}
                                    >Avancements</h4>
                                    <table className="table table-competences">
                                        <thead>
                                            <tr>
                                                <th>Date d'affectation</th>
                                                <th>Departement</th>
                                                <th>Categorie socio-professionnelle</th>
                                                <th>Indice</th>
                                                <th>Echelon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(dataAssignmentAdvancement) && dataAssignmentAdvancement.map((item, id) => (
                                                <tr>
                                                    <td>{new Date(item.assignmentDate).toLocaleDateString()}</td>
                                                    <td>{item.departmentName}</td>
                                                    <td>{item.socioCategoryProfessionalName}</td>
                                                    <td>{item.indicationName}</td>
                                                    <td>{item.echelonName}</td>
                                                    <td>
                                                        <Button
                                                            onClick={() => {
                                                                handleClickEdit(item);
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
                                                            onClick={() => confirmDeleteItem(`/CareerPlan/delete/${item.careerPlanId}`, ` la carriere ${item.assignmentTypeName} pour l'employe ${item.registrationNumber}`)}
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
                                </>
                            ) : (
                                <>
                                    {/* Mise en disponibilite */}
                                    <h4 className="title" 
                                            style={{
                                            color: '#B8860B',  
                                            borderBottom: '2px solid #B8860B', 
                                            paddingBottom: '5px',
                                            marginBottom: '50px'
                                        }}
                                    >Mise en disponibilité</h4>
                                    <table className="table table-competences">
                                        <thead>
                                            <tr>
                                                <th>Date d'affectation</th>
                                                <th>Institution</th>
                                                <th>Debut</th>
                                                <th>fin</th>
                                                <th>Motif</th>
                                                <th>Etat</th>
                                                <th>Action</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(dataAssignmentAvailability) && dataAssignmentAvailability.map((item, id) => (
                                                <tr>
                                                    <td>{new Date(item.assignmentDate).toLocaleDateString()}</td>
                                                    <td>{item.assigningInstitution}</td> 
                                                    <td>{new Date(item.startDate).toLocaleDateString()}</td>
                                                    <td>{new Date(item.endDate).toLocaleDateString()}</td>
                                                    <td>{item.reason}</td>
                                                    
                                                    {item.careerState !== 'terminé' ? (
                                                        <>
                                                            <td>
                                                                <label className='badge badge-success'>{item.careerState}</label>
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    onClick={() => {
                                                                        handleClickEdit(item);
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
                                                                    onClick={() => confirmDeleteItem(`/CareerPlan/delete/${item.careerPlanId}`, ` la carriere ${item.assignmentTypeName} pour l'employe ${item.registrationNumber}`)}
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>
                                                                <label className='badge badge-warning'>{item.careerState}</label>
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    onClick={() => {
                                                                        handleClickDetail(item);
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
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AffectationList;
