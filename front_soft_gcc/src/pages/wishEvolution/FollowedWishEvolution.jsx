import React, { useState, useEffect, useCallback } from 'react';
import Template from '../Template';
import ChartLine from '../../components/ChartLine';
import { useNavigate } from 'react-router-dom';
import Loader from '../../helpers/Loader';
import Fetcher from '../../components/Fetcher';
import useSWR from 'swr';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';
import ListPageHeader from '../../components/listPage/ListPageHeader';
import FilterCard, { FilterField, FilterGrid } from '../../components/listPage/FilterCard';
import ResponsiveDataTable from '../../components/listPage/ResponsiveDataTable';
import '../../styles/listPage.css';

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

function getStateBadgeClass(state) {
  if (state === 10) return 'success';
  if (state === 0) return 'danger';
  return 'warning';
}

function FollowedWishEvolution() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishesEvolution, setWishesEvolution] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [wishesEvolutionGraph, setWishesEvolutionGraph] = useState([]);
  const [dataGraph, setDataGraph] = useState([]);
  const [pageSize] = useState(10);

  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0,
  });

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

  const { data: dataWishType } = useSWR('/WishType', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

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
            totalPages: response.totalPages,
          });
        } else {
          setWishesEvolution([]);
          setError(response.message);
        }
      } catch (err) {
        setWishesEvolution([]);
        setError(`Erreur inattendue : ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  const fetchFilteredGraph = useCallback(async () => {
    try {
      const response = await Fetcher(`/WishEvolution/graphe/${filters.year}`);
      setDataGraph(response || []);
    } catch (err) {
      console.log(err.message);
      setDataGraph([]);
    }
  }, [filters.year]);

  useEffect(() => {
    initializeGraph(setWishesEvolutionGraph);
    if (dataGraph.length > 0) {
      setWishesEvolutionGraph((prev) =>
        prev.map((entry) => {
          const match = dataGraph.find((data) => data.month === entry.month);
          return match ? { ...entry, DemandRequestValue: match.totalRequests } : entry;
        })
      );
    }
  }, [dataGraph]);

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      if (currentPage !== 1) setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchFilteredData(debouncedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedFilters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFilteredGraph();
    }, 1000);
    return () => clearTimeout(handler);
  }, [filters.year, fetchFilteredGraph]);

  const handleWishEvolutionDetails = (item) => {
    navigate(`/soft-gcc/souhaits-evolution/details/${item.wishEvolutionCareerId}`);
  };

  const columns = [
    { key: 'registrationNumber', header: 'Matricule' },
    {
      key: 'employee',
      header: 'Employé',
      render: (item) => `${item.firstName} ${item.name}`,
    },
    { key: 'wishTypeName', header: 'Type de souhait' },
    {
      key: 'wishPositionName',
      header: 'Poste souhaité',
      render: (item) => <span style={{ color: '#b8860b', fontWeight: 500 }}>{item.wishPositionName}</span>,
    },
    { key: 'priorityLetter', header: 'Priorité' },
    {
      key: 'requestDate',
      header: 'Date de demande',
      render: (item) => new Date(item.requestDate).toLocaleDateString('fr-FR'),
    },
    {
      key: 'state',
      header: 'Statut',
      render: (item) => (
        <span className={`list-badge ${getStateBadgeClass(item.state)}`}>{item.stateLetter}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="list-btn-view" type="button">
          <Icon path={mdiEyeOutline} size={0.8} /> Voir demande
        </button>
      ),
    },
  ];

  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - i);

  return (
    <Template>
      {loading && <Loader />}

      <ListPageHeader
        icon="mdi-trending-up"
        title="Souhait d'évolution"
        subtitle="Suivez les demandes d'évolution de carrière"
        actions={
          <button
            className="list-page-btn-primary success"
            type="button"
            onClick={() => navigate('/soft-gcc/souhaits-evolution/ajouter')}
          >
            <i className="mdi mdi-plus"></i>
            Ajouter
          </button>
        }
      />

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Souhait évolution', path: '/soft-gcc/souhaits-evolution' },
          { label: 'Liste', path: '/soft-gcc/souhaits-evolution' },
        ]}
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <FilterCard>
        <FilterGrid>
          <FilterField label="Recherche">
            <input
              type="text"
              placeholder="Nom, prénom ou matricule"
              name="keyWord"
              value={filters.keyWord}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Date demande min">
            <input
              type="date"
              name="dateRequestMin"
              value={filters.dateRequestMin}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Date demande max">
            <input
              type="date"
              name="dateRequestMax"
              value={filters.dateRequestMax}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Type de souhait">
            <select name="wishTypeId" value={filters.wishTypeId} onChange={handleFilterChange}>
              <option value="">Tous les types</option>
              {dataWishType?.map((item) => (
                <option key={item.wishTypeId} value={item.wishTypeId}>
                  {item.designation}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Poste souhaité">
            <select name="positionId" value={filters.positionId} onChange={handleFilterChange}>
              <option value="">Tous les postes</option>
              {dataPosition?.map((item) => (
                <option key={item.positionId} value={item.positionId}>
                  {item.positionName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Priorité">
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="">Toutes les priorités</option>
              <option value="1">Bas</option>
              <option value="5">Moyen</option>
              <option value="10">Élevé</option>
            </select>
          </FilterField>
          <FilterField label="Statut">
            <select name="state" value={filters.state} onChange={handleFilterChange}>
              <option value="">Tous les statuts</option>
              <option value="1">En attente</option>
              <option value="5">En cours</option>
              <option value="10">Validé</option>
              <option value="0">Refusé</option>
            </select>
          </FilterField>
        </FilterGrid>
      </FilterCard>

      {!loading && (
        <>
          <ResponsiveDataTable
            title="Liste des demandes"
            count={paginationResult.totalRecords}
            columns={columns}
            data={wishesEvolution}
            rowKey={(item) => item.wishEvolutionCareerId}
            onRowClick={handleWishEvolutionDetails}
            mobileTitle={(item) => `${item.firstName} ${item.name}`}
            mobileSubtitle={(item) => `Matricule : ${item.registrationNumber}`}
            pagination={{
              currentPage,
              totalPages,
              totalRecords: paginationResult.totalRecords,
              pageSize: paginationResult.pageSize,
              onPageChange: setCurrentPage,
            }}
          />
        </>
      )}

      <div className="list-data-card" style={{ marginTop: '24px' }}>
        <div className="list-data-card-header">
          <div className="list-data-card-header-left">
            <i className="mdi mdi-chart-bar"></i>
            <span>Analyse des demandes par mois</span>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
            Un aperçu des demandes au cours de l'année
          </p>
          <div style={{ maxWidth: '200px', marginBottom: '20px' }}>
            <FilterField label="Année">
              <select name="year" value={filters.year} onChange={handleFilterChange}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
          <ChartLine data={wishesEvolutionGraph} year={filters.year} />
        </div>
      </div>
    </Template>
  );
}

export default FollowedWishEvolution;
