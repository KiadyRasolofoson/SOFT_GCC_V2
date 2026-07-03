import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/skillsStyle.css';
import '../../styles/pagination.css';
import BarChart from '../../components/BarChart';
import { urlApi } from '../../helpers/utils';
import axios from "axios";
import LoaderComponent from '../../helpers/LoaderComponent';
import BarNivoChart from '../chart/BarNivoChart';
import api from '../../helpers/api';

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function SkillSalaryChart({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [datasLevelSkills, setDatasLevelSkills] = useState([]);

  const [filter, setFilter] = useState({
    employeeId: employeeId,
    state: 0
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const fetchFilteredData = useCallback(async (appliedFilter) => {
    if (!appliedFilter.employeeId) return; // Évite les appels inutiles si employeeId est null

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(appliedFilter).toString();
      const response = await api.get(`/EmployeeSkills/skillLevel?${queryParams}`);
      setDatasLevelSkills(response.data || []);
    } catch (err) {
      setDatasLevelSkills([]);
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchData = useRef(debounce(fetchFilteredData, 1000)).current;

  useEffect(() => {
    debouncedFetchData(filter);
  }, [filter, debouncedFetchData]);

  // Conversion de filter.state en nombre pour éviter les incohérences de types
  const stateFilter = Number(filter.state);

  // Transformation des données pour l'affichage dans le graphique
  const preparedDatas = datasLevelSkills.map(item => ({
    label: stateFilter === 0 ? item.stateLetter : item.skillName,
    value: stateFilter === 0 ? item.number : item.level,
    color: item.state === 1 ? 'rgba(255, 99, 132, 0.7)' : item.state === 5 ? 'rgba(255, 206, 86, 0.7)' : 'rgba(75, 192, 192, 0.7)',
    borderColor: item.state === 1 ? 'rgba(255, 99, 132, 1)' : item.state === 5 ? 'rgba(255, 206, 86, 1)' : 'rgba(75, 192, 192, 1)'
  }));

  return (
    <div className="row">
      {loading && <LoaderComponent />}
      {error && <p className="error-message">{error}</p>}
      
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
            <i className="mdi mdi-chart-bar me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
            <h3 className="mb-0" style={{color: '#B8860B'}}> Graphes des compétences </h3>
          </div>
          <div className="card-body">
            <p className="card-description text-left">Niveaux des compétences obtenues</p>
            <div className="form-group row">
              <div className="col-sm-3">
                <select 
                  name="state" 
                  value={filter.state} 
                  onChange={handleFilterChange} 
                  className="form-control"
                >
                  <option value="0">Tous</option>
                  <option value="1">Non validé</option>
                  <option value="5">Validé par évaluation</option>
                </select>
              </div>
            </div>
            <BarNivoChart datas={preparedDatas} type={1} legendBottom='Compétences' legendLeft={'Nombre de compétences'} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillSalaryChart;
