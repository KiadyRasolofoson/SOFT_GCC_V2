import React, {useState, useEffect} from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import AffectationList from '../../../components/career/AffectationList';
import Certificate from '../../../components/career/Certificate';
import History from '../../../components/career/History';
import '../../../styles/careerStyle.css';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import Loader from '../../../helpers/Loader';
import { useParams } from 'react-router-dom';
import FormattedDate from '../../../helpers/FormattedDate';
import { useNavigate } from 'react-router-dom';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';

// Page détails du plan de carrière
function CareerProfilePage({ onSearch }) {
    // Url d'en-tete de page
    const module = "Plan de carrière";
    const action = "Fiche";
    const url = "/carriere";

    // Initialisation des variables utiles
    const { registrationNumber } = useParams();
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(false); 
    const navigate = useNavigate();

    // Appel api pour les donnees du formulaire
    const [dataEmployee, setDataEmployee] = useState([]); 
    const [dataAssignmentAdvancement, setDataAssignmentAdvancement] = useState([]);
    const [dataAssignmentAppointment, setDataAssignmentAppointment] = useState([]);
    const [dataAssignmentAvailability, setDataAssignmentAvailability] = useState([]);
    const [componentToDisplay, setComponentToDisplay] = useState(1);

    // Pour gerer la navigation
    const [navLinkAttestationGenerate, setNavLinkAttestationGenerate] = useState("");
    const [navLinkCareerHistory, setNavLinkCareerHistory] = useState("active");
    const [navLinkAttestationHistory, setNavLinkAttestationHistory] = useState("");

    // Mise à jour du coomposant responsable à l'affichage
    const updateComponent = (value) => {
        setComponentToDisplay(value);
        if(value === 1) {
            setNavLinkAttestationGenerate("");
            setNavLinkCareerHistory("active");
            setNavLinkAttestationHistory("");
        } else if (value === 2) {
            setNavLinkAttestationGenerate("active");
            setNavLinkCareerHistory("");
            setNavLinkAttestationHistory("");
        } else {
            setNavLinkAttestationGenerate("");
            setNavLinkCareerHistory("");
            setNavLinkAttestationHistory("active");
        }
    };

    // Chargement des donnees depuis l'api 
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [employeeResponse, advancementResponse, appointmentResponse, availabilityResponse] = await Promise.all([
                axios.get(urlApi(`/CareerPlan/careers/${registrationNumber}`)),
                axios.get(urlApi(`/CareerPlan/employee/${registrationNumber}/advancement`)),
                axios.get(urlApi(`/CareerPlan/employee/${registrationNumber}/appointment`)),
                axios.get(urlApi(`/CareerPlan/employee/${registrationNumber}/availability`))
            ]);
            setDataEmployee(employeeResponse.data || []);
            setDataAssignmentAdvancement(advancementResponse.data || []);
            setDataAssignmentAppointment(appointmentResponse.data || []);
            setDataAssignmentAvailability(availabilityResponse.data || []);
        } catch (error) {
            setError(`Erreur lors de la recuperation des donnees : ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [registrationNumber]);

    // Fonction qui gère le retour en arrière de la page
    const handleRetour = () => {
        navigate(`/SoftGcc/carriere`);
    };

    return (
        <Template>
            {isLoading && <Loader />} {/* Affichez le loader lorsque `loading` est true */}            
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="title-container">
                <div className="col-lg-10 skill-header">
                    <i className="mdi mdi-note-text skill-icon"></i>
                    <p className="skill-title">SUIVI PLAN DE CARRIÈRE</p>
                </div>
                            
                <div className="col-lg-2">
                    <button onClick={handleRetour} className="btn-outline-dark btn-fw" style={{float: 'right'}}>
                        <i className="mdi mdi-arrow-left-circle icon-cancel" style={{}}></i>
                        Retour
                    </button>
                </div>  
            </div>

            <BreadcrumbPers
                items={[
                    { label: 'Accueil', path: '/softGcc/tableauBord' },
                    { label: 'Plan de carrière', path: '/softGcc/carriere' },
                    { label: 'Détails', path: '/softGcc/carriere/fiche' }
                ]}
            />

            <div className="row description">
                <div className="col-md-12">
                    <div className="card shadow-sm">
                        <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                            <i className="mdi mdi-information-outline me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                            <h3 className="mb-0" style={{color: '#B8860B'}}>Informations salariés</h3>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {/* Colonne gauche */}
                                <div className="col-md-4">
                                    <p><strong className="label-title">Employé :</strong><span className="value-profil">{dataEmployee.firstName} {dataEmployee.name}</span></p>
                                    <p><strong className="label-title">Matricule :</strong><span className="value-profil">{dataEmployee.registrationNumber}</span></p>
                                    <p><strong className="label-title">Date naissance :</strong><span className="value-profil"><FormattedDate date={dataEmployee.birthday} /></span></p>
                                </div>

                                {/* Colonne droite */}
                                <div className="col-md-4">
                                    <p><strong className="label-title">Poste actuel :</strong><span className="value-profil text-primary">{dataEmployee.positionName}</span></p>
                                    <p><strong className="label-title">Salaire :</strong><span className="value-profil text-info">{dataEmployee.baseSalary} Ar</span></p>
                                    <p><strong className="label-title">Date d'embauche :</strong><span className="value-profil"><FormattedDate date={dataEmployee.assignmentDate} /></span></p>
                                </div>

                                {/* Colonne droite */}
                                <div className="col-md-4">
                                    <p><strong className="label-title-email">Email :</strong><span className="value-profil-email">{dataEmployee.email}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <div className="row">
                <div className="col-lg-12 grid-margin">
                    {/* Menu de navigation des compétences */}
                    <ul className="nav nav-tabs tab-transparent" role="tablist">
                        <li className="nav-item">
                            <a onClick={() => updateComponent(2)} className={"nav-link "+navLinkAttestationGenerate} id="home-tab" data-toggle="tab" href="#" role="tab" aria-selected="true">Génération d'attestation</a>
                        </li>
                        <li className="nav-item">
                            <a onClick={() => updateComponent(1)} className={"nav-link "+navLinkCareerHistory} id="business-tab" data-toggle="tab" href="#business-1" role="tab" aria-selected="false">Suivi carrière</a>
                        </li>
                        <li className="nav-item">
                            <a onClick={() => updateComponent(3)} className={"nav-link "+navLinkAttestationHistory} id="performance-tab" data-toggle="tab" href="#" role="tab" aria-selected="false">Historiques d'attestation</a>
                        </li>
                    </ul>
                </div>
            </div>

            {componentToDisplay === 2 ? (   // Certification
                <Certificate dataEmployee={dataEmployee}/>
            ) : componentToDisplay === 3 ? (    // Historique
                <History registrationNumber={registrationNumber} />
            ) : (   // Liste d'affectation
                <AffectationList dataAssignmentAppointment={dataAssignmentAppointment} dataAssignmentAdvancement={dataAssignmentAdvancement} dataAssignmentAvailability={dataAssignmentAvailability} fetchData={fetchData} />
            )}
        </Template>
    );
}

export default CareerProfilePage;
