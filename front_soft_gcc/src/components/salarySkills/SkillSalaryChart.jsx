import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    state: 0,
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const fetchFilteredData = useCallback(async (appliedFilter) => {
    if (!appliedFilter.employeeId) return;

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
    setFilter((prev) => ({ ...prev, employeeId }));
  }, [employeeId]);

  useEffect(() => {
    debouncedFetchData(filter);
  }, [filter, debouncedFetchData]);

  const stateFilter = Number(filter.state);

  const preparedDatas = datasLevelSkills.map((item) => ({
    label: stateFilter === 0 ? item.stateLetter : item.skillName,
    value: stateFilter === 0 ? item.number : item.level,
    color:
      item.state === 1
        ? 'rgba(255, 99, 132, 0.7)'
        : item.state === 5
          ? 'rgba(255, 206, 86, 0.7)'
          : 'rgba(75, 192, 192, 0.7)',
    borderColor:
      item.state === 1
        ? 'rgba(255, 99, 132, 1)'
        : item.state === 5
          ? 'rgba(255, 206, 86, 1)'
          : 'rgba(75, 192, 192, 1)',
  }));

  return (
    <div className="skills-card">
      <div className="skills-card-header">
        <h5>
          <i className="mdi mdi-chart-bar" />
          Analyse des compétences
        </h5>
      </div>
      <div className="skills-card-body">
        <p className="skills-chart-desc">Niveaux des compétences obtenues</p>

        <div className="skills-chart-filter">
          <select
            name="state"
            value={filter.state}
            onChange={handleFilterChange}
            className="skills-form-control"
            aria-label="Filtrer par état"
          >
            <option value="0">Tous</option>
            <option value="1">Non validé</option>
            <option value="5">Validé par évaluation</option>
          </select>
        </div>

        {loading && <LoaderComponent />}
        {error && <p className="skills-error-state mb-2">{error}</p>}

        {!loading && !error && (
          <div className="skills-chart-body">
            <BarNivoChart
              datas={preparedDatas}
              type={1}
              legendBottom="Compétences"
              legendLeft="Nombre de compétences"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillSalaryChart;
