import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Fetcher from '../../../components/Fetcher';
import PageHeader from '../../../components/PageHeader';
import Template from '../../Template';
import '../../../styles/skillsStyle.css';
import Loader from '../../../helpers/Loader';
import '../../../styles/pagination.css';
import FormattedDate from '../../../helpers/FormattedDate';
import { urlApi } from '../../../helpers/utils';
import defaultImg from '../../../assets/images/male-default.webp';
import '../../../styles/orgChart.css';
import ModalImportEmployee from '../../../components/organizationalChart/ModalImportEmployee';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import api from '../../../helpers/api';

// Map des images des départements
const departmentImages = {
    default: defaultImg,
};

// Fonction pour obtenir le chemin de l'image
const getDepartmentImage = (departmentName) => {
    return departmentImages[departmentName.toLowerCase()] || departmentImages.default;
};

// Fonction debounce pour limiter les appels API
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function ListEmployeePage() {
  const module = "Employe";
  const action = "Liste";
  const url = "/employe";
  const navigate = useNavigate();

  // États
  const [employees, setEmployees] = useState([]);
  const [sortedEmployees, setSortedEmployees] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('birthday'); // Colonne de tri par défaut
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ keyWord: '', departmentId: '', hiringDate1: '', hiringDate2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const [showModalImport, setShowModalImport] = useState(false);

  const handleCloseModalImport = () => setShowModalImport(false);
  const handleShowModalImport = () => setShowModalImport(true);

  // Fonction pour gérer les filtres
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1); // Réinitialisation à la première page lors d'un filtre
  };

  // Fonction pour récupérer les employés avec pagination et filtres
  const fetchFilteredData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: currentPage,
        pageSize: pageSize
      }).toString();

      const response = await api.get(`/Employee/filter?${queryParams}`);
      
      if (response.data.success) {
        setEmployees(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        setEmployees([]);
        setError(response.data.message);
      }
    } catch (err) {
      setEmployees([]);
      setError('Erreur inattendue : ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // Débouncer la recherche
  const debouncedFetchData = useCallback(debounce(fetchFilteredData, 3000), [fetchFilteredData]);

  // Charger les données à chaque changement de page ou de filtres
  useEffect(() => {
    debouncedFetchData();
  }, [filters, currentPage, debouncedFetchData]);

  // Fonction pour trier les employés
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    const sorted = [...employees].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      if (sortColumn === 'birthday' || sortColumn === 'hiringDate') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });
    setSortedEmployees(sorted);
  }, [sortDirection, employees, sortColumn]);

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Navigation pour ajout
  const handleClick = () => {
    navigate('/softGcc/settings/employeeManagement/create');
  };

  return (
    <Template>
      {loading && <Loader />}
      <ModalImportEmployee showModalImport={showModalImport} handleCloseModalImport={handleCloseModalImport} />
      {error && <div className="alert alert-danger">{error}</div>}


      <div className="title-container">
        <div className="col-lg-8 skill-header">
          <i className="mdi mdi-settings skill-icon"></i>
          <p className="skill-title">LISTE DES EMPLOYÉS</p>
        </div>
        
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/softGcc/tableauBord' },
          { label: 'Gestion employés', path: '/softGcc/settings/employeeManagement/liste' },
          { label: 'Liste', path: '/softGcc/settings/employeeManagement/liste' },
        ]}
      />

      <div className="row mt-3">
        <div className="col-12 d-flex justify-content-end" style={{marginBottom: '10px'}}>
          <button
            type="button"
            className="btn btn-success me-2"
            onClick={handleShowModalImport}
            style={{marginRight: '10px'}}
          >
            <i className="mdi mdi-import button-logo"></i> Import employés
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClick}
          >
            <i className="mdi mdi-plus button-logo"></i> Ajouter
          </button>
        </div>
      </div>


      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
              <i className="mdi mdi-filter-outline me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
              <h3 className="mb-0" style={{color: '#B8860B'}}>Filtres</h3>
            </div>
            <div className="card-body">
              <form className="filter-form">
                <div className="form-group">
                  <label>Nom, prénom, matricule ou responsable</label>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    name="keyWord"
                    value={filters.keyWord}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Département</label>
                  <select
                    name="departmentId"
                    value={filters.departmentId}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les départements</option>
                    {dataDepartment?.map((item) => (
                    <option key={item.departmentId} value={item.departmentId}>
                      {item.name}
                    </option>
                  ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date d'embauche min</label>
                  <input
                    type="date"
                    name="hiringDate1"
                    value={filters.hiringDate1}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date d'embauche max</label>
                  <input
                    type="date"
                    name="hiringDate2"
                    value={filters.hiringDate2}
                    onChange={handleFilterChange}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
              <i className="mdi mdi-format-list-bulleted me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
              <h3 className="mb-0" style={{color: '#B8860B'}}>Liste</h3>
            </div>
            <div className="card-body">
              {!loading && !error && (
                <>
                  <table className="table table-competences">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th onClick={() => handleSort('firstName')} className="sortable-header">
                          Nom complet {sortColumn === 'firstName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('registrationNumber')} className="sortable-header">
                          Matricule {sortColumn === 'registrationNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('birthday')} className="sortable-header">
                          Naissance {sortColumn === 'birthday' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('departmentName')} className="sortable-header">
                          Département {sortColumn === 'departmentName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('hiringDate')} className="sortable-header">
                          Date d'embauche {sortColumn === 'hiringDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('managerName')} className="sortable-header">
                          Responsable {sortColumn === 'managerName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEmployees.length > 0 ? (
                        sortedEmployees.map((item) => (
                          <tr key={item.employeeId} onClick={() => navigate(`/softGcc/competences/profil/${item.employeeId}`)}>
                            <td className="py-1">
                              {item.photo ? (
                                <img src={urlApi(`/Employee/photo/${item.employeeId}`)} alt={'Employe '+item.registrationNumber} />
                              ) : (
                                <img
                                src={getDepartmentImage(item.departmentName)}
                                alt={item.departmentName}
                                className="department-image"/>
                              )}
                            </td>                            <td>{item.firstName} {item.name}</td>
                            <td>{item.registrationNumber}</td>
                            <td><FormattedDate date={item.birthday} /></td>
                            <td>{item.departmentName}</td>
                            <td><FormattedDate date={item.hiringDate} /></td>
                            <td>{item.managerName + ' ' + item.managerFirstName}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="7" className="text-center">Aucun résultat trouvé.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Précédent</button>
                    <span>Page {currentPage} sur {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Suivant</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
}

export default ListEmployeePage;