import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import PageHeader from '../../components/PageHeader';
import SkillSalaryChart from '../../components/salarySkills/SkillSalaryChart';
import SalaryDescription from '../../components/salarySkills/SalaryDescription';
import CardSkills from '../../components/salarySkills/CardSkills';
import Loader from '../../helpers/Loader';
import Template from '../Template';
import '../../styles/skillsStyle.css';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import CancelButton from '../../helpers/CancelButton';
import api from '../../helpers/api';

// Gestion d'affichage du page salaryProfile (profile des competences salaries)
function SalaryProfilePage({ task }) {
  // Gestion d'affichage d'url dans l'entete du page
  const module = "Compétences";
  const action = "Profil";
  const url = "/competences";

  // Gestion des states
  const { idEmployee } = useParams();
  const [employeeDescription, setEmployeeDescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  // Récupération des données à l'aide de l'API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); 
      try {
        const response = await api.get(`/EmployeeSkills/description/${idEmployee}`);
        const data = await response.data;
        setEmployeeDescription(data);
      } catch (error) {
        setError(`Erreur lors de la récupération des données de description des employés : ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idEmployee]);

  // Vérifier si les données sont bien reçues
  if (!employeeDescription || employeeDescription.length === 0) {
    return(
      <Template>
        <div>Aucune donnée trouvée. {error}</div>
      </Template>
    ); 
  }

  // Si c'est un tableau, on accède au premier élément (l'index 0)
  const employee = employeeDescription[0];

  return (
    <Template>
      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-school skill-icon"></i>
          <p className="skill-title">PROFIL DES COMPÉTENCES</p>
        </div>
        <div className="col-lg-2">
          <CancelButton to="competences" />
        </div>  
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Compétences', path: '/soft-gcc/competences' },
          { label: 'Profil', path: '/soft-gcc/competences/profil' }
        ]}
      />
      {loading && <Loader />}
      {error && <div className="alert alert-danger">{error}</div>}

      <SalaryDescription dataEmployeeDescription={employee} />

      <CardSkills dataEmployeeDescription={employee} idEmployee={idEmployee} />

      <SkillSalaryChart employeeId={idEmployee} />
    </Template>
  );
}

export default SalaryProfilePage;
