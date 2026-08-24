import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Template from '../../Template';
import Loader from '../../../helpers/Loader';
import FormattedDate from '../../../helpers/FormattedDate';
import useSWR from 'swr';
import Fetcher from '../../../components/Fetcher';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';
import ListPageHeader from '../../../components/listPage/ListPageHeader';
import FilterCard, { FilterField, FilterGrid } from '../../../components/listPage/FilterCard';
import ResponsiveDataTable from '../../../components/listPage/ResponsiveDataTable';
import '../../../styles/listPage.css';

const ListCareerPage = () => {
  const [careers, setCareers] = useState([]);
  const [sortedCareers, setSortedCareers] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('updatedDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    keyWord: '',
    departmentId: '',
    positionId: '',
    dateAssignmentMin: '',
    dateAssignmentMax: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);
  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0,
  });

  const fetchFilteredData = useCallback(
    async (appliedFilters) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          ...appliedFilters,
          pageNumber: currentPage,
          pageSize,
        }).toString();

        const response = await Fetcher(`/CareerPlan/filter?${queryParams}`);
        if (response.success) {
          setCareers(response.data);
          setTotalPages(response.totalPages || 0);
          setPaginationResult({
            totalRecords: response.totalCount,
            pageSize: response.pageSize,
            currentPage: response.currentPage,
            totalPages: response.totalPages,
          });
        } else {
          setError(response.message || 'Erreur lors du chargement.');
          setCareers([]);
        }
      } catch (err) {
        setError(`Erreur inattendue : ${err.message}`);
        setCareers([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      if (currentPage !== 1) setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchFilteredData(debouncedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedFilters]);

  useEffect(() => {
    const sorted = [...careers].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      if (sortColumn === 'assignmentDate') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setSortedCareers(sorted);
  }, [sortDirection, careers, sortColumn]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCareersDetails = (career) => {
    navigate(`/soft-gcc/employes/fiche/${career.registrationNumber}?espace=carrieres`);
  };

  const columns = [
    {
      key: 'registrationNumber',
      header: 'Matricule',
      sortable: true,
    },
    {
      key: 'firstName',
      header: 'Nom complet',
      sortable: true,
      render: (item) => `${item.name} ${item.firstName}`,
    },
    {
      key: 'departmentName',
      header: 'Département',
      sortable: true,
    },
    {
      key: 'positionName',
      header: 'Poste',
      sortable: true,
    },
    {
      key: 'assignmentDate',
      header: "Date d'affectation",
      sortable: true,
      render: (item) => <FormattedDate date={item.assignmentDate} />,
    },
    {
      key: 'careerPlan',
      header: 'Plan de carrière',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.careerPlanNumber}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="list-btn-view" type="button">
          <Icon path={mdiEyeOutline} size={0.8} /> Voir carrière
        </button>
      ),
    },
  ];

  return (
    <Template>
      {loading && <Loader />}
      {error && <div className="alert alert-danger">{error}</div>}

      <ListPageHeader
        icon="mdi-map-marker-path"
        title="Plan de carrière"
        subtitle="Suivez les parcours professionnels de vos collaborateurs"
        actions={
          <button
            className="list-page-btn-primary success"
            type="button"
            onClick={() => navigate('/soft-gcc/carrieres/creation')}
          >
            <i className="mdi mdi-plus"></i>
            Nouveau plan
          </button>
        }
      />

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Plan de carrière', path: '/soft-gcc/carrieres' },
          { label: 'Liste', path: '/soft-gcc/carrieres' },
        ]}
      />

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
          <FilterField label="Département">
            <select name="departmentId" value={filters.departmentId} onChange={handleFilterChange}>
              <option value="">Tous les départements</option>
              {dataDepartment?.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Poste">
            <select name="positionId" value={filters.positionId} onChange={handleFilterChange}>
              <option value="">Tous les postes</option>
              {dataPosition?.map((pos) => (
                <option key={pos.positionId} value={pos.positionId}>
                  {pos.positionName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Date d'affectation min">
            <input
              type="date"
              name="dateAssignmentMin"
              value={filters.dateAssignmentMin}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Date d'affectation max">
            <input
              type="date"
              name="dateAssignmentMax"
              value={filters.dateAssignmentMax}
              onChange={handleFilterChange}
            />
          </FilterField>
        </FilterGrid>
      </FilterCard>

      {!loading && (
        <>
          <ResponsiveDataTable
            title="Plan de carrière par employé"
            count={paginationResult.totalRecords}
            columns={columns}
            data={sortedCareers}
            rowKey={(item) => item.registrationNumber}
            onRowClick={handleCareersDetails}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            mobileTitle={(item) => `${item.name} ${item.firstName}`}
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
    </Template>
  );
};

export default ListCareerPage;
