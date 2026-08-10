import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SkillSalaryChart from '../../components/salarySkills/SkillSalaryChart';
import SalaryDescription from '../../components/salarySkills/SalaryDescription';
import CardSkills from '../../components/salarySkills/CardSkills';
import Loader from '../../helpers/Loader';
import Template from '../Template';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import api from '../../helpers/api';
import './SalaryProfilePage.css';

function SalaryProfilePage() {
  const navigate = useNavigate();
  const { employeeId: idEmployee } = useParams();
  const [employeeDescription, setEmployeeDescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!idEmployee) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/EmployeeSkills/description/${idEmployee}`);
        setEmployeeDescription(response.data);
      } catch (err) {
        setError(`Erreur lors de la récupération des données de description des employés : ${err.message}`);
        setEmployeeDescription(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idEmployee]);

  const handleRetour = () => {
    navigate('/soft-gcc/competences');
  };

  const employee = Array.isArray(employeeDescription) ? employeeDescription[0] : null;
  const hasData = Boolean(employee);

  return (
    <Template>
      <div className="skills-profile">
        <BreadcrumbPers
          items={[
            { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
            { label: 'Compétences', path: '/soft-gcc/competences' },
            { label: 'Profil', path: `/soft-gcc/competences/profil/${idEmployee}` },
          ]}
        />

        <div className="skills-page-header">
          <div className="skills-header-left">
            <div className="skills-header-icon">
              <i className="mdi mdi-account-star" />
            </div>
            <h1 className="skills-header-title">Profil des compétences</h1>
          </div>
          <div className="skills-header-actions">
            <button type="button" className="skills-btn skills-btn-secondary" onClick={handleRetour}>
              <i className="mdi mdi-arrow-left" />
              Retour
            </button>
          </div>
        </div>

        {loading && <Loader />}

        {!loading && error && (
          <div className="skills-error-state alert alert-danger mb-3">{error}</div>
        )}

        {!loading && !error && !hasData && (
          <div className="skills-empty-state">Aucune donnée trouvée pour ce salarié.</div>
        )}

        {!loading && hasData && (
          <>
            <div className="skills-section">
              <SalaryDescription dataEmployeeDescription={employee} />
            </div>

            <div className="row skills-main-row">
              <div className="col-lg-8">
                <CardSkills dataEmployeeDescription={employee} idEmployee={idEmployee} />
              </div>
              <div className="col-lg-4">
                <SkillSalaryChart employeeId={idEmployee} />
              </div>
            </div>
          </>
        )}
      </div>
    </Template>
  );
}

export default SalaryProfilePage;
