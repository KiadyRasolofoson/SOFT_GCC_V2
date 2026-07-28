import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import Template from '../Template';
import '../../styles/skillsStyle.css';
import '../../styles/pagination.css';
import ChartLine from '../../components/ChartLine';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../helpers/Loader';
import '../../styles/pagination.css';
import Fetcher from '../../components/Fetcher';
import useSWR from 'swr';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';

 
// Fonction pour initialiser les données du graphe
function initializeGraph(setWishesEvolutionGraph) {
  setWishesEvolutionGraph([
    { month: 1, monthLetter: 'Jan', DemandRequestValue: 0 },
    { month: 2, monthLetter: 'Fév', DemandRequestValue: 0 },
    { month: 3, monthLetter: 'Mar', DemandRequestValue: 0 },
    { month: 4, monthLetter: 'Avr', DemandRequestValue: 0 },
    { month: 5, monthLetter: 'Mai', DemandRequestValue: 0 },
    { month: 6, monthLetter: 'Juin', DemandRequestValue: 0 },
    { month: 7, monthLetter: 'Juil', DemandRequestValue: 0 },
    { month: 8, monthLetter: 'Août', DemandRequestValue: 0 },
    { month: 9, monthLetter: 'Sep', DemandRequestValue: 0 },
    { month: 10, monthLetter: 'Oct', DemandRequestValue: 0 },
    { month: 11, monthLetter: 'Nov', DemandRequestValue: 0 },
    { month: 12, monthLetter: 'Déc', DemandRequestValue: 0 },
  ]);
}

// Page de suivi des souhaits d'évolution
function FollowedWishEvolution() {
  const module = 'Souhait évolution';
  const action = 'Suivi';
  const url = '/SouhaitEvolution/Suivi';
  const navigate = useNavigate();

  // États principaux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishesEvolution, setWishesEvolution] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [wishesEvolutionGraph, setWishesEvolutionGraph] = useState([]);
  const [dataGraph, setDataGraph] = useState([]);
  const currentYear = new Date().getFullYear();
  const [pageSize] = useState(10);

  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0
  });

  // États pour les filtres
  const [filters, setFilters] = useState({
    keyWord: '',
    dateRequestMin: '',
    dateRequestMax: '',
    wishTypeId: '',
    positionId: '',
    priority: '',
    state: '',
    year: currentYear,
  });

  // Données pour les options de filtres
  const { data: dataWishType } = useSWR('/WishType', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Fetch des données avec filtres
  const fetchFilteredData = useCallback(
    async (appliedFilters) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          ...appliedFilters,
          page: currentPage,
          pageSize,
        }).toString();

        const response = await Fetcher(`/WishEvolution/filter?${queryParams}`);
        if (response.success) {
          setWishesEvolution(response.data);
          setTotalPages(response.totalPages);
          setPaginationResult({
            totalRecords: response.totalCount,
            pageSize: response.pageSize,
            currentPage: response.currentPage,
            totalPages: response.totalPages
          });
        } else {
          setWishesEvolution([]);
          setError(response.message);
        }
      } catch (err) {
        setWishesEvolution([]);
        setError('Erreur inattendue : ' + err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentPage]
  );

  // Fetch des données pour le graphe
  const fetchFilteredGraph = useCallback(async () => {
    try {
      const response = await Fetcher(`/WishEvolution/graphe/${filters.year}`);
      setDataGraph(response || []);
    } catch (err) {
      console.log(err.message);
      setDataGraph([]);
    }
  }, [filters.year]);

  // Effet pour synchroniser les données du graphe
  useEffect(() => {
    initializeGraph(setWishesEvolutionGraph);
    if (dataGraph.length > 0) {
      const updatedGraph = wishesEvolutionGraph.map((entry) => {
        const match = dataGraph.find((data) => data.month === entry.month);
        return match
          ? { ...entry, DemandRequestValue: match.totalRequests }
          : entry;
      });
      setWishesEvolutionGraph(updatedGraph);
    }
  }, [dataGraph]);

  // Debounce des filtres
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 1000);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Effet unique pour le chargement initial, la pagination et les filtres
  useEffect(() => {
    fetchFilteredData(debouncedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedFilters]);

  // Fetch graph (debounced, ne modifie pas le loading du tableau)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFilteredGraph();
    }, 1000);
    return () => clearTimeout(handler);
  }, [filters.year]);

  // Navigation pour ajout
  const handleClick = () => {
    navigate('/soft-gcc/souhaits-evolution/ajouter');
  };

  // Navigation pour details souhait evolution
  const handleWishEvolutionDetails = (wishEvolutionId) => {
    navigate(`/soft-gcc/souhaits-evolution/details/${wishEvolutionId}`);
  };

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

    return (
        <Template>
          {loading && <Loader />} {/* Affichez le loader lorsque `loading` est true */}

          <div className="title-container">
            <div className="col-lg-10 skill-header">
              <i className="mdi mdi-trending-up skill-icon"></i>
              <p className="skill-title">SOUHAIT D'ÉVOLUTION</p>
            </div>
                                
          </div>
          <BreadcrumbPers
            items={[
              { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
              { label: 'Souhait évolution', path: '/soft-gcc/souhaits-evolution/suivi' },
              { label: 'Liste', path: '/soft-gcc/souhaits-evolution/suivi' }
            ]}
          />
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="row mt-3">
            <div className="col-12 d-flex justify-content-end" style={{marginBottom: '10px'}}>
              <button className="btn-add btn-success btn-fw" onClick={handleClick} style={{float: 'right'}}>
                <i className="mdi mdi-plus"></i>
                Ajouter
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
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nom, prénom ou matricule"
                          name="keyWord"
                          value={filters.keyWord}
                          onChange={handleFilterChange}
                        />
                      </div>
                      <div className="col-sm-3">
                        <input
                          type="date"
                          className="form-control"
                          placeholder="Date demande min"
                          name="dateRequestMin"
                          value={filters.dateRequestMin}
                          onChange={handleFilterChange}
                        />
                      </div>
                      <div className="col-sm-3">
                        <input
                          type="date"
                          className="form-control"
                          placeholder="Date demande max"
                          name="dateRequestMax"
                          value={filters.dateRequestMax}
                          onChange={handleFilterChange}
                        />
                      </div>
                    </div>
                    <div className="form-group row">
                      <div className="col-sm-3">
                        <select
                          name="wishTypeId"
                          className="form-control"
                          value={filters.wishTypeId}
                          onChange={handleFilterChange}
                        >
                          <option value="">Filtrer par type de souhait</option>
                          {dataWishType?.map((item) => (
                            <option key={item.wishTypeId} value={item.wishTypeId}>
                              {item.designation}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-sm-3">
                        <select
                          name="positionId"
                          className="form-control"
                          value={filters.positionId}
                          onChange={handleFilterChange}
                        >
                          <option value="">Filtrer par poste souhaité</option>
                          {dataPosition?.map((item) => (
                            <option key={item.positionId} value={item.positionId}>
                              {item.positionName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-sm-3">
                        <select
                          name="priority"
                          className="form-control"
                          value={filters.priority}
                          onChange={handleFilterChange}
                        >
                          <option value="">Filtrer par priorite</option>
                          <option value="1">Bas</option>
                          <option value="5">Moyen</option>
                          <option value="10">Elevé</option>
                        </select>
                      </div>
                      <div className="col-sm-3">
                        <select
                          name="state"
                          className="form-control"
                          value={filters.state}
                          onChange={handleFilterChange}
                        >
                          <option value="">Filtrer par status</option>
                          <option value="1">En attente</option>
                          <option value="5">En cours</option>
                          <option value="10">Validé</option>
                          <option value="0">Refusé</option>
                        </select>
                      </div>
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
                  <h3 className="mb-0" style={{color: '#B8860B'}}>Liste des demandes</h3>
                </div>
                <div className="card-body">
                  {!loading && (
                    <>
                      <table className="table table-competences">
                        <thead>
                          <tr>
                            <th>Matricule</th>
                            <th>Employe</th>
                            <th>Type souhait</th>
                            <th>Poste souhaite</th>
                            <th>Priorite</th>
                            <th>Date de demande</th>
                            <th>Statut</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {wishesEvolution?.length > 0 ? (
                            wishesEvolution.map((item) => (
                              <tr key={item.wishEvolutionCareerId} onClick={() => {handleWishEvolutionDetails(item.wishEvolutionCareerId)}}>
                                <td>{item.registrationNumber}</td>
                                <td>{item.firstName} {item.name}</td>
                                <td>{item.wishTypeName}</td>
                                <td style={{color: '#B8860B'}}>{item.wishPositionName}</td>
                                <td>{item.priorityLetter}</td>
                                <td>{new Date(item.requestDate).toLocaleDateString()}</td>
                                {item.state === 1 ? (
                                  <td><label className="badge badge-warning">{item.stateLetter}</label ></td>
                                ) : item.state === 5 ? (
                                  <td><label className="badge badge-warning">{item.stateLetter}</label ></td>
                                ) : item.state === 10 ? (
                                  <td><label className="badge badge-success">{item.stateLetter}</label ></td>
                                ) : (
                                  <td><label className="badge badge-danger">{item.stateLetter}</label ></td>
                                )}
                                <td>
                                  <button className="btn-details text-primary" >
                                    <Icon path={mdiEyeOutline} size={1} /> Voir demande
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
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-12 grid-margin stretch-card">
              <div className="card shadow-sm border-0">
                <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                  <i className="mdi mdi-chart-bar me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
                  <h3 className="mb-0" style={{color: '#B8860B'}}>Analyse des demandes par mois</h3>
                </div>
                <div className="card-body">
                  <p className="card-description text-left">Un aperçu des demandes au cours de l'année</p>
                  <div className="form-group row">
                    <div className="col-sm-3">
                      <select
                        name="year"
                        className="form-control"
                        value={filters.year}
                        onChange={handleFilterChange}
                      >
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                      </select>
                    </div>
                  </div>
                  <ChartLine data={wishesEvolutionGraph} year={filters.year}/>
                </div>
              </div>
            </div>
          </div>
        </Template>
      );
}

export default FollowedWishEvolution;
