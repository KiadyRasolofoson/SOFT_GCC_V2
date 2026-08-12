import React, { useState, useEffect, useCallback } from 'react';
import Template from '../Template';
import Loader from '../../helpers/Loader';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import MyPieChart from '../../components/chart/MyPieChart';
import HorizontalBarChart from '../../components/chart/HorizontalBarChart';
import SummaryCards from '../../components/chart/SummaryCards';
import BarNivoChart from '../../components/chart/BarNivoChart';
import api from '../../helpers/api';
import './DashboardPage.css';

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function transformDataDistribution(datas, helper) {
  if (helper === 1) {
    return datas.map(({ ageDistribution, employeesNumber }) => ({
      id: ageDistribution,
      label: ageDistribution,
      value: employeesNumber,
      details: 'employés',
    }));
  }
  return datas.map(({ experienceRange, employeeCount }) => ({
    ageGroup: experienceRange,
    count: employeeCount,
    details: 'employés',
  }));
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [careers, setCareers] = useState([]);
  const [datasSkills, setDatasSkills] = useState([]);
  const [datasCareer, setDatasCareer] = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [employeesAgeDistribution, setEmployeesAgeDistribution] = useState([]);
  const [employeesExperienceDistribution, setEmployeesExperienceDistribution] = useState([]);
  const [displaySkillsType, setDisplaySkillsType] = useState('1');
  const [displayCareersType, setDisplayCareersType] = useState('1');

  const [filterSkills, setFilterSkills] = useState({
    departmentId: 1,
    state: 1,
  });

  const [filterCareers, setFilterCareers] = useState({
    departmentId: 1,
  });

  const handleFilterSkillsChange = (e) => {
    const { name, value } = e.target;
    setFilterSkills((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleFilterCareersChange = (e) => {
    const { name, value } = e.target;
    setFilterCareers((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const fetchFilteredData = useCallback(async (appliedFilterSkills, appliedFilterCareers) => {
    setLoading(true);
    setError(null);

    try {
      const queryParamSkills = new URLSearchParams({
        ...appliedFilterSkills,
      }).toString();

      const queryParamCareers = new URLSearchParams({
        ...appliedFilterCareers,
      }).toString();

      const [skillsResponse, careersResponse] = await Promise.all([
        api.get(`/Dashboard/employeeSkillByDepartment?${queryParamSkills}`),
        api.get(`/Dashboard/employeeCareerByDepartment?${queryParamCareers}`),
      ]);

      setSkills(skillsResponse.data || []);
      setCareers(careersResponse.data || []);
      setError(null);
    } catch (err) {
      setSkills([]);
      setCareers([]);
      setError('Erreur lors de la récuperation des données : ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        rapportResponse,
        departmentListResponse,
        employeeDistributionAgeResponse,
        employeeDistributionExperienceResponse,
      ] = await Promise.all([
        api.get('/Dashboard'),
        api.get('/Department'),
        api.get('/Dashboard/employeeAgeDistribution'),
        api.get('/Dashboard/employeeExperienceDistribution'),
      ]);

      setDashboard(rapportResponse.data);
      setDepartments(departmentListResponse.data || []);
      setEmployeesAgeDistribution(
        transformDataDistribution(employeeDistributionAgeResponse.data, 1)
      );
      setEmployeesExperienceDistribution(
        transformDataDistribution(employeeDistributionExperienceResponse.data, 2)
      );
    } catch (err) {
      console.log(err);
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchData = useCallback(debounce(fetchFilteredData, 1000), [fetchFilteredData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    debouncedFetchData(filterSkills, filterCareers);
  }, [filterSkills, filterCareers, debouncedFetchData]);

  useEffect(() => {
    setDatasSkills(
      skills.map((skill) => ({
        label: skill.skillName,
        value: skill.nEmployee,
        color:
          skill.state === 1
            ? 'rgba(255, 99, 132, 0.7)'
            : skill.state === 5
              ? 'rgba(255, 206, 86, 0.7)'
              : 'rgba(75, 192, 192, 0.7)',
        borderColor:
          skill.state === 1
            ? 'rgba(255, 99, 132, 1)'
            : skill.state === 5
              ? 'rgba(255, 206, 86, 1)'
              : 'rgba(75, 192, 192, 1)',
      }))
    );

    setDatasCareer(
      careers.map((career) => ({
        label: career.positionName,
        value: career.nEmployee,
        color: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
      }))
    );
  }, [skills, careers]);

  return (
    <Template>
      {loading && <Loader />}

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Analyse et statistique', path: '/soft-gcc/tableau-de-bord' },
        ]}
      />

      <div className="db-page">
        <header className="db-header">
          <div>
            <p className="db-header__eyebrow">Analyse &amp; statistiques</p>
            <h1 className="db-header__title">Tableau de bord</h1>
            <p className="db-header__subtitle">
              Vue d&apos;ensemble des effectifs, compétences et carrières. Cliquez sur un
              indicateur pour afficher le détail.
            </p>
          </div>
        </header>

        {error && (
          <div className="db-error" role="alert">
            <i className="mdi mdi-alert-circle-outline" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <SummaryCards dashboard={dashboard} />

        <div className="row db-charts-row">
          <div className="col-lg-6">
            <div className="db-panel">
              <div className="db-panel__head">
                <div className="db-panel__title-wrap">
                  <span className="db-panel__icon" aria-hidden="true">
                    <i className="mdi mdi-chart-pie" />
                  </span>
                  <div>
                    <h2 className="db-panel__title">Répartition par âge</h2>
                    <p className="db-panel__desc">Nombre d&apos;employés par tranche d&apos;âge</p>
                  </div>
                </div>
              </div>
              <div className="db-panel__body">
                <MyPieChart datas={employeesAgeDistribution} />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="db-panel">
              <div className="db-panel__head">
                <div className="db-panel__title-wrap">
                  <span className="db-panel__icon" aria-hidden="true">
                    <i className="mdi mdi-chart-bar" />
                  </span>
                  <div>
                    <h2 className="db-panel__title">Répartition par expérience</h2>
                    <p className="db-panel__desc">
                      Nombre d&apos;employés par années d&apos;expérience
                    </p>
                  </div>
                </div>
              </div>
              <div className="db-panel__body">
                <HorizontalBarChart datas={employeesExperienceDistribution} />
              </div>
            </div>
          </div>
        </div>

        <section className="db-section" aria-labelledby="db-skills-title">
          <div className="db-section__header">
            <div>
              <h2 id="db-skills-title" className="db-section__title">
                <i className="mdi mdi-school-outline" aria-hidden="true" />
                État des compétences
              </h2>
              <p className="db-section__hint">
                Effectifs par compétence selon le département et l&apos;état de validation
              </p>
            </div>
            <div className="db-toolbar">
              <div className="db-view-toggle" role="group" aria-label="Type d'affichage compétences">
                <button
                  type="button"
                  className={`db-view-toggle__btn${displaySkillsType === '1' ? ' is-active' : ''}`}
                  onClick={() => setDisplaySkillsType('1')}
                >
                  <i className="mdi mdi-chart-bar" aria-hidden="true" />
                  Graphique
                </button>
                <button
                  type="button"
                  className={`db-view-toggle__btn${displaySkillsType === '2' ? ' is-active' : ''}`}
                  onClick={() => setDisplaySkillsType('2')}
                >
                  <i className="mdi mdi-format-list-bulleted" aria-hidden="true" />
                  Liste
                </button>
              </div>
              <div className="db-field">
                <label htmlFor="skills-department">Département</label>
                <select
                  id="skills-department"
                  name="departmentId"
                  className="db-select"
                  value={filterSkills.departmentId}
                  onChange={handleFilterSkillsChange}
                >
                  <option value="">Tous les départements</option>
                  {departments?.map((item) => (
                    <option key={item.departmentId} value={item.departmentId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="db-field">
                <label htmlFor="skills-state">État</label>
                <select
                  id="skills-state"
                  name="state"
                  value={filterSkills.state}
                  onChange={handleFilterSkillsChange}
                  className="db-select"
                >
                  <option value="">Tous les états</option>
                  <option value="1">Non validé</option>
                  <option value="5">Validé par évaluation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="db-panel">
            {displaySkillsType === '1' ? (
              <div className="db-panel__body">
                <BarNivoChart
                  datas={datasSkills}
                  type={1}
                  legendBottom="Compétences"
                  legendLeft={"Nombre d'employés"}
                />
              </div>
            ) : (
              <div className="db-panel__body db-panel__body--flush">
                {skills?.length ? (
                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Département</th>
                          <th>Compétence</th>
                          <th>Employés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skills.map((item) => (
                          <tr key={item.skillId}>
                            <td className="db-table__id">{item.skillId}</td>
                            <td>{item.departmentName}</td>
                            <td>{item.skillName}</td>
                            <td className="db-table__metric">{item.nEmployee}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="db-empty">Aucune compétence pour ces filtres.</div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="db-section" aria-labelledby="db-careers-title">
          <div className="db-section__header">
            <div>
              <h2 id="db-careers-title" className="db-section__title">
                <i className="mdi mdi-map-marker-path" aria-hidden="true" />
                État des carrières
              </h2>
              <p className="db-section__hint">
                Répartition des employés par poste et département
              </p>
            </div>
            <div className="db-toolbar">
              <div className="db-view-toggle" role="group" aria-label="Type d'affichage carrières">
                <button
                  type="button"
                  className={`db-view-toggle__btn${displayCareersType === '1' ? ' is-active' : ''}`}
                  onClick={() => setDisplayCareersType('1')}
                >
                  <i className="mdi mdi-chart-bar" aria-hidden="true" />
                  Graphique
                </button>
                <button
                  type="button"
                  className={`db-view-toggle__btn${displayCareersType === '2' ? ' is-active' : ''}`}
                  onClick={() => setDisplayCareersType('2')}
                >
                  <i className="mdi mdi-format-list-bulleted" aria-hidden="true" />
                  Liste
                </button>
              </div>
              <div className="db-field">
                <label htmlFor="careers-department">Département</label>
                <select
                  id="careers-department"
                  name="departmentId"
                  className="db-select"
                  value={filterCareers.departmentId}
                  onChange={handleFilterCareersChange}
                >
                  <option value="">Tous les départements</option>
                  {departments?.map((item) => (
                    <option key={item.departmentId} value={item.departmentId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="db-panel">
            {displayCareersType === '1' ? (
              <div className="db-panel__body">
                <BarNivoChart
                  datas={datasCareer}
                  type={2}
                  legendBottom="Carrières"
                  legendLeft={"Nombre d'employés"}
                />
              </div>
            ) : (
              <div className="db-panel__body db-panel__body--flush">
                {careers?.length ? (
                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Département</th>
                          <th>Poste</th>
                          <th>Employés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {careers.map((item) => (
                          <tr key={item.positionId}>
                            <td className="db-table__id">{item.positionId}</td>
                            <td>{item.departmentName}</td>
                            <td>{item.positionName}</td>
                            <td className="db-table__metric">{item.nEmployee}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="db-empty">Aucun poste pour ces filtres.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </Template>
  );
}

export default DashboardPage;
