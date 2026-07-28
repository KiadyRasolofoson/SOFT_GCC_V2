import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import pic1 from '/src/assets/images/male-default.webp';
import '../../styles/skillsStyle.css';
import Loader from '../../helpers/Loader';
import '../../styles/pagination.css';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import api from '../../helpers/api';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';

// Page liste des competences
function ListSkillSalaryPage() {
  const navigate = useNavigate();

  // Initialisation des variables de states
  const [skills, setSkills] = useState([]);
  const [sortedSkills, setSortedSkills] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('updatedDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationResult, setPaginationResult] = useState({
      totalRecords: 0,
      pageSize: 0,
      currentPage: 0,
      totalPages: 0
  });

  // Appliquer le tri chaque fois que `sortDirection` ou `skills` change
  useEffect(() => {
      const sorted = [...skills].sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];
  
        if (sortColumn === 'updatedDate') {
          const dateA = new Date(valueA);
          const dateB = new Date(valueB);
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
          if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
      });
      setSortedSkills(sorted);
    }, [sortDirection, skills, sortColumn]);

  // Chargement des donnees de competences salaries
  const fetchSkills = useCallback(
    async (searchTerm) => {
    setLoading(true);
    setError(null);

    try {
      const route = searchTerm ? '/EmployeeSkills/filter' : '/EmployeeSkills/list';
      const params = searchTerm
        ? { keyWord: searchTerm, pageNumber: currentPage, pageSize }
        : { pageNumber: currentPage, pageSize };

      const response = await api.get(route, { params });
      setSkills(response.data.data);
      setTotalPages(response.data.totalPages);
      setPaginationResult({
        totalRecords: response.data.totalRecords,
        pageSize: response.data.pageSize,
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      });
    } catch (err) {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  },
  [currentPage, pageSize]
);

  // Gerer les filtres par recherche
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  //Gerer le changement de page par pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Gerer le tri par colonne
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Affichage des numeros de page de pagination
  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };



  // Debounce de la recherche textuelle
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 1000);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Effet unique pour le chargement initial, la pagination et la recherche
  useEffect(() => {
    fetchSkills(debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

  // Navigation pour details competences
  const handleSkillsDetails = (employeeId) => {
    navigate(`/soft-gcc/competences/profil/${employeeId}`);
  };

  return (
    <Template>
      {loading && <Loader />}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-school skill-icon"></i>
          <p className="skill-title">COMPÉTENCES DES SALARIÉS</p>
        </div>
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Compétences', path: '/soft-gcc/competences' },
          { label: 'Liste des compétences', path: '/soft-gcc/competences' }
        ]}
      />
      
      <div className="row">                    
        <div className="col-lg-12 grid-margin">
            <div className="search-card">
              <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                <i className="mdi mdi-magnify me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                <h3 className="mb-0" style={{color: '#B8860B'}}>Filtre de recherche</h3>
              </div>
             
              <div className="card-body">
                <form className="search-form">
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Nom, prénom ou matricule"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
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
              <h3 className="mb-0" style={{color: '#B8860B'}}> Nombre de compétences par Employé </h3>
            </div>
            <div className="card-body">
              {!loading && !error && (
                <>
                  <table className="table table-competences">
                    <thead>
                      <tr>
                        <th>Employé</th>
                        <th onClick={() => handleSort('firstName')} className="sortable-header">
                          Nom complet {sortColumn === 'firstName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('updatedDate')} className="sortable-header">
                          Dernière modification {sortColumn === 'updatedDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('educationNumber')} className="sortable-header">
                          Diplômes & formations {sortColumn === 'educationNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('skillNumber')} className="sortable-header">
                          Compétences {sortColumn === 'skillNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('languageNumber')} className="sortable-header">
                          Langues {sortColumn === 'languageNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('otherFormationNumber')} className="sortable-header">
                          Autres {sortColumn === 'otherFormationNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSkills.length > 0 ? (
                        sortedSkills.map((item, id) => (
                          <tr key={id} onClick={() => {handleSkillsDetails(item.employeeId)}}>
                            <td className="py-1">
                              {item.photo ? (
                                <img src={urlApi(`/Employee/photo/${item.employeeId}`)} alt={'Employe '+item.registrationNumber} />
                              ) : (
                                <img
                                  src={pic1}
                                  alt={item.registrationNumber}
                                  className="department-image"/>
                              )}
                            </td>   
                            <td>{item.firstName} {item.name}</td>
                            <td><DateDisplayWithTime isoDate={item.updatedDate} /></td> {/* Affichez la vraie date de mise à jour */}
                            <td>{item.educationNumber}</td>
                            <td>{item.skillNumber}</td>
                            <td>{item.languageNumber}</td>
                            <td>{item.otherFormationNumber}</td>
                            <td>
                              <button className="btn-details text-primary" >
                                <Icon path={mdiEyeOutline} size={1} /> Voir profil
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">Aucun résultat trouvé.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <h4>{paginationResult.totalRecords} resultats aux totals</h4>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      Précédent
                    </button>
                    {renderPageNumbers()}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      Suivant
                    </button>
                    <h4>Page {paginationResult.currentPage} sur {paginationResult.totalPages} pour {paginationResult.pageSize} resultats</h4>
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

export default ListSkillSalaryPage;
