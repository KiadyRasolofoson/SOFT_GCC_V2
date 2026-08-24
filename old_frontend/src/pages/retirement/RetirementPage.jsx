import React, { useState, useEffect, useCallback } from 'react';
import Template from '../Template';
import Loader from '../../helpers/Loader';
import ModalParameter from '../../components/retirement/ModalParameter';
import Fetcher from '../../components/Fetcher';
import useSWR from 'swr';
import FormattedDate from '../../helpers/FormattedDate';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import ListPageHeader from '../../components/listPage/ListPageHeader';
import FilterCard, { FilterField, FilterGrid } from '../../components/listPage/FilterCard';
import ResponsiveDataTable from '../../components/listPage/ResponsiveDataTable';
import '../../styles/listPage.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showParameter, setShowParameter] = useState(false);
  const [sortedDataRetirement, setSortedDataRetirement] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('updatedDate');

  const { data: dataCivilite } = useSWR('/Civilite', Fetcher);
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);

  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0,
  });

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

        const response = await Fetcher(`/Retirement/filter?${queryParams}`);

        if (response.success) {
          if (!Array.isArray(response.data)) {
            setError('Données invalides reçues.');
            setDataRetirement([]);
          } else {
            setDataRetirement(response.data);
          }

          setTotalPages(response.totalPages || 0);
          setPaginationResult({
            totalRecords: response.totalCount || 0,
            pageSize: response.pageSize || 0,
            currentPage: response.currentPage || 0,
            totalPages: response.totalPages || 0,
          });
        } else {
          setError(`${response.message} ${response.details || ''}`);
          setDataRetirement([]);
        }
      } catch (err) {
        setError(`Erreur inattendue lors du chargement des données : ${err.message}`);
        setDataRetirement([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  useEffect(() => {
    if (!Array.isArray(dataRetirement)) {
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
      }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setSortedDataRetirement(sorted);
  }, [sortDirection, dataRetirement, sortColumn]);

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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const columns = [
    { key: 'civiliteName', header: 'Civilité', sortable: true },
    {
      key: 'name',
      header: 'Nom complet',
      sortable: true,
      render: (item) => <span style={{ fontWeight: 500 }}>{`${item.name} ${item.firstName}`}</span>,
    },
    { key: 'registrationNumber', header: 'Matricule', sortable: true },
    { key: 'departmentName', header: 'Département', sortable: true },
    { key: 'positionName', header: 'Poste', sortable: true },
    {
      key: 'age',
      header: 'Âge',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.age}</span>,
    },
    {
      key: 'dateDepart',
      header: 'Départ à la retraite',
      sortable: true,
      render: (item) => (
        <span style={{ color: '#0d6efd', fontWeight: 500 }}>
          <FormattedDate date={item.dateDepart} />
        </span>
      ),
    },
  ];

  return (
    <Template>
      {loading && <Loader />}
      <ModalParameter
        Fetcher={Fetcher}
        showParameter={showParameter}
        handleCloseParameter={() => setShowParameter(false)}
        fetchFilteredData={fetchFilteredData}
      />

      <ListPageHeader
        icon="mdi-calendar-check"
        title="Départ à la retraite"
        subtitle="Anticipez et planifiez les départs en retraite"
        actions={
          <button
            className="list-page-btn-primary outline"
            type="button"
            onClick={() => setShowParameter(true)}
          >
            <i className="mdi mdi-cog"></i>
            Paramètres
          </button>
        }
      />

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Retraite', path: '/soft-gcc/retraite' },
          { label: 'Liste', path: '/soft-gcc/retraite' },
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
          <FilterField label="Âge">
            <input
              type="text"
              placeholder="Ex : 24 ou 20-50"
              name="age"
              value={filters.age}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Année de départ">
            <input
              type="text"
              placeholder="Ex : 2024 ou 2030-2040"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Civilité">
            <select name="civiliteId" value={filters.civiliteId} onChange={handleFilterChange}>
              <option value="">Toutes les civilités</option>
              {dataCivilite?.map((item) => (
                <option key={item.civiliteId} value={item.civiliteId}>
                  {item.civiliteName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Département">
            <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange}>
              <option value="">Tous les départements</option>
              {dataDepartment?.map((item) => (
                <option key={item.departmentId} value={item.departmentId}>
                  {item.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Poste">
            <select name="positionId" value={filters.positionId} onChange={handleFilterChange}>
              <option value="">Tous les postes</option>
              {dataPosition?.map((item) => (
                <option key={item.positionId} value={item.positionId}>
                  {item.positionName}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterGrid>
      </FilterCard>

      {!loading && (
        <>
          <ResponsiveDataTable
            title="Liste des départs prévus"
            count={paginationResult.totalRecords}
            columns={columns}
            data={sortedDataRetirement}
            rowKey={(item) => item.registrationNumber}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            mobileTitle={(item) => `${item.name} ${item.firstName}`}
            mobileSubtitle={(item) => `${item.civiliteName} — ${item.registrationNumber}`}
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
    </Template>
  );
}

export default RetirementPage;
