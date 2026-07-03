import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import '../../styles/skillsStyle.css';
import Loader from '../../helpers/Loader';
import '../../styles/pagination.css';
import ModalParameter from '../../components/retirement/ModalParameter';
import Fetcher from '../../components/Fetcher';
import useSWR from 'swr';
import FormattedDate from '../../helpers/FormattedDate';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

// Fonction debounce pour éviter les appels excessifs
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function RetirementPage() {
  const [filters, setFilters] = useState({
    keyWord: '',
    civiliteId: '',
    departmentId: '',
    positionId: '',
    age: '',
    year: '',
  });

  const [dataRetirement, setDataRetirement] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showParameter, setShowParameter] = useState(false);
  const [sortedDataRetirement, setSortedDataRetirement] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('updatedDate');

  // Récupération des options pour les filtres
  const { data: dataCivilite } = useSWR('/Civilite', Fetcher);
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher); 
  
  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0
  });

  // Fonction de mise à jour des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Fonction de recherche des données avec filtres
  const fetchFilteredData = useCallback(async (appliedFilters) => {
    setLoading(true);
    setError(null);
  
    try {
      const queryParams = new URLSearchParams({
        ...appliedFilters,
        page: currentPage,
        pageSize,
      }).toString();
  
      const response = await Fetcher(`/Retirement/filter?${queryParams}`);
  
      if (response.success) {
        if (!Array.isArray(response.data)) {
          console.error("Données invalides reçues :", response.data);
          setError("Données invalides reçues :", response.data);
          setDataRetirement([]);
        } else {
          setDataRetirement(response.data);
        }
  
        setError(null);
        setTotalPages(response.totalPages || 0);
        setPaginationResult({
          totalRecords: response.totalCount || 0,
          pageSize: response.pageSize || 0,
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0
        });
      } else {
        setError(response.message + " " + response.details);
        setDataRetirement([]);
      }
    } catch (err) {
      setError("Erreur inattendue lors du chargement des données : " + err.message);
      setDataRetirement([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);
  

  // Mise à jour des données triées
  // Appliquer le tri chaque fois que `sortDirection` ou `careers` change
  useEffect(() => {
    if (!Array.isArray(dataRetirement)) {
      console.error("dataRetirement n'est pas un tableau :", dataRetirement);
      setSortedDataRetirement([]);
      return;
    }
  
    const sorted = [...dataRetirement].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
  
      if (sortColumn === 'dateDepart') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });
  
    setSortedDataRetirement(sorted);
  }, [sortDirection, dataRetirement, sortColumn]);
  

  // Débouncer la recherche avec un délai de 3 secondes
  const debouncedFetchData = useCallback(debounce(fetchFilteredData, 3000), [fetchFilteredData]);

  // Déclencher la recherche à chaque modification des filtres
  useEffect(() => {
    debouncedFetchData(filters);
  }, [filters, debouncedFetchData]);

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <Template>
      {loading && <Loader />}
      <ModalParameter Fetcher={Fetcher} showParameter={showParameter} handleCloseParameter={() => setShowParameter(false)} fetchFilteredData={fetchFilteredData} />

      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-calendar-check skill-icon"></i>
          <p className="skill-title">DÉPART À LA RETRAITE</p>
        </div>
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/softGcc/tableauBord' },
          { label: 'Souhait évolution', path: '/softGcc/souhaitEvolution/suivi' },
          { label: 'Liste', path: '/softGcc/souhaitEvolution/suivi' }
        ]}
      />
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row mt-3">
        <div className="col-12 d-flex justify-content-end" style={{marginBottom: '10px'}}>
          <button className="btn-add btn-success btn-fw" onClick={() => setShowParameter(true)} style={{float: 'right'}}>
            <i className="mdi mdi-settings"></i>
              Paramètre
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card search-card">
           <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
              <i className="mdi mdi-filter-outline me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
              <h3 className="mb-0" style={{color: '#B8860B'}}>Filtres</h3>
            </div>
            <div className="card-body">
              <form className="form-sample">
                <div className="form-group row">
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nom, prénom ou matricule"
                      name="keyWord"
                      value={filters.keyWord}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Âge, ex: 24 ou 20-50"
                      name="age"
                      value={filters.age}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Année, ex: 2024 ou 2030-2040"
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-4">
                    <select
                      name="civiliteId"
                      className="form-control"
                      value={filters.civiliteId}
                      onChange={handleFilterChange}
                    >
                      <option value="">Filtrer par civilité</option>
                      {dataCivilite?.map((item) => (
                        <option key={item.civiliteId} value={item.civiliteId}>
                          {item.civiliteName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <select
                      name="departmentId"
                      className="form-control"
                      value={filters.departmentId}
                      onChange={handleFilterChange}
                    >
                      <option value="">Filtrer par département</option>
                      {dataDepartment?.map((item) => (
                        <option key={item.departmentId} value={item.departmentId}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <select
                      name="positionId"
                      className="form-control"
                      value={filters.positionId}
                      onChange={handleFilterChange}
                    >
                      <option value="">Filtrer par poste</option>
                      {dataPosition?.map((item) => (
                        <option key={item.positionId} value={item.positionId}>
                          {item.positionName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
              {error && <p className="text-danger">{error}</p>}
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
              {dataRetirement?.length > 0 ? (
                <>
                  <table className="table table-competences">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('civiliteName')} className="sortable-header">
                          Civilité {sortColumn === 'civiliteName' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('name')} className="sortable-header">
                          Nom complet {sortColumn === 'name' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('registrationNumber')} className="sortable-header">
                          Matricule {sortColumn === 'registrationNumber' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('departmentName')} className="sortable-header">
                          Département {sortColumn === 'departmentName' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('positionName')} className="sortable-header">
                          Poste {sortColumn === 'positionName' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('age')} className="sortable-header">
                          Âge {sortColumn === 'age' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                        <th onClick={() => handleSort('dateDepart')} className="sortable-header">
                          Départ à la retraite {sortColumn === 'dateDepart' ? (sortDirection === 'asc' ? '▼' : '▲') : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {Array.isArray(sortedDataRetirement) && sortedDataRetirement.length ? (
                      sortedDataRetirement.map((item, index) => (
                        <tr key={index}>
                          <td>{item.civiliteName}</td>
                          <td style={{color: '#58d8a3'}}>{`${item.name} ${item.firstName}`}</td>
                          <td>{item.registrationNumber}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.positionName}</td>
                          <td>{item.age}</td>
                          <td style={{color: '#57c7d4'}}><FormattedDate date={item.dateDepart} /></td>
                        </tr>
                     ))) : (
                        <tr> 
                          <td colSpan="7" className="text-center">
                            Aucun résultat trouvé.
                          </td>
                        </tr>
)}

                    </tbody>
                  </table>
                  <div className="pagination">
                    <h4>{paginationResult.totalRecords} resultats aux totals</h4>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        className={`pagination-button ${i + 1 === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      Suivant
                    </button>
                    <h4>Page {paginationResult.currentPage} sur {paginationResult.totalPages} pour {paginationResult.pageSize} resultats</h4>
                  </div>
                </>
              ) : (
                !error && <p>{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
}

export default RetirementPage;
