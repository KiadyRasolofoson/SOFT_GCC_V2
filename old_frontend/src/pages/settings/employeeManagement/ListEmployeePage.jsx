import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Fetcher from '../../../components/Fetcher';
import Template from '../../Template';
import Loader from '../../../helpers/Loader';
import FormattedDate from '../../../helpers/FormattedDate';
import { urlApi } from '../../../helpers/utils';
import defaultImg from '../../../assets/images/male-default.webp';
import ModalImportEmployee from '../../../components/organizationalChart/ModalImportEmployee';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import api from '../../../helpers/api';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';
import ListPageHeader from '../../../components/listPage/ListPageHeader';
import FilterCard, { FilterField, FilterGrid } from '../../../components/listPage/FilterCard';
import ResponsiveDataTable from '../../../components/listPage/ResponsiveDataTable';
import '../../../styles/listPage.css';

function ListEmployeePage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [sortedEmployees, setSortedEmployees] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('birthday');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    keyWord: '',
    departmentId: '',
    hiringDate1: '',
    hiringDate2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const [showModalImport, setShowModalImport] = useState(false);

  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0,
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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

        const response = await api.get(`/Employee/filter?${queryParams}`);

        if (response.data.success) {
          setEmployees(response.data.data);
          setTotalPages(response.data.totalPages);
          setPaginationResult({
            totalRecords: response.data.totalCount,
            pageSize: response.data.pageSize,
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
          });
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
    },
    [currentPage, pageSize]
  );

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);
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

  useEffect(() => {
    const sorted = [...employees].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      if (sortColumn === 'birthday' || sortColumn === 'hiringDate') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setSortedEmployees(sorted);
  }, [sortDirection, employees, sortColumn]);

  const handleEmployeeDetails = (item) => {
    navigate(`/soft-gcc/employes/fiche/${item.employeeId}?espace=infos`);
  };

  const renderAvatar = (item) =>
    item.photo ? (
      <img src={urlApi(`/Employee/photo/${item.employeeId}`)} alt={`Employé ${item.registrationNumber}`} />
    ) : (
      <img src={defaultImg} alt={item.registrationNumber} />
    );

  const formatManagerName = (item) => {
    const fullName = [item.managerName, item.managerFirstName].filter(Boolean).join(' ');
    return fullName || '—';
  };

  const columns = [
    {
      key: 'photo',
      header: '',
      className: 'td-avatar',
      hideOnMobile: true,
      render: renderAvatar,
    },
    {
      key: 'firstName',
      header: 'Nom complet',
      sortable: true,
      render: (item) => `${item.firstName} ${item.name}`,
    },
    {
      key: 'registrationNumber',
      header: 'Matricule',
      sortable: true,
    },
    {
      key: 'birthday',
      header: 'Naissance',
      sortable: true,
      render: (item) => <FormattedDate date={item.birthday} />,
    },
    {
      key: 'departmentName',
      header: 'Département',
      sortable: true,
    },
    {
      key: 'hiringDate',
      header: "Date d'embauche",
      sortable: true,
      render: (item) => <FormattedDate date={item.hiringDate} />,
    },
    {
      key: 'managerName',
      header: 'Responsable',
      sortable: true,
      render: formatManagerName,
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="list-btn-view" type="button">
          <Icon path={mdiEyeOutline} size={0.8} /> Voir fiche
        </button>
      ),
    },
  ];

  return (
    <Template>
      {loading && <Loader />}
      <ModalImportEmployee
        showModalImport={showModalImport}
        handleCloseModalImport={() => setShowModalImport(false)}
      />
      {error && <div className="alert alert-danger">{error}</div>}

      <ListPageHeader
        icon="mdi-account-group"
        title="Liste des employés"
        subtitle="Consultez et gérez les informations de chaque employé"
        actions={
          <>
            <button
              className="list-page-btn-primary outline"
              type="button"
              onClick={() => setShowModalImport(true)}
            >
              <i className="mdi mdi-import"></i>
              Import employés
            </button>
            <button
              className="list-page-btn-primary success"
              type="button"
              onClick={() => navigate('/soft-gcc/parametres/employes/creer')}
            >
              <i className="mdi mdi-plus"></i>
              Ajouter
            </button>
          </>
        }
      />

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Gestion employés', path: '/soft-gcc/parametres/employes/liste' },
          { label: 'Liste', path: '/soft-gcc/parametres/employes/liste' },
        ]}
      />

      <FilterCard title="Filtre de recherche" icon="mdi-magnify">
        <FilterGrid>
          <FilterField label="Recherche">
            <input
              type="text"
              placeholder="Nom, prénom, matricule ou responsable"
              name="keyWord"
              value={filters.keyWord}
              onChange={handleFilterChange}
            />
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
          <FilterField label="Date d'embauche min">
            <input
              type="date"
              name="hiringDate1"
              value={filters.hiringDate1}
              onChange={handleFilterChange}
            />
          </FilterField>
          <FilterField label="Date d'embauche max">
            <input
              type="date"
              name="hiringDate2"
              value={filters.hiringDate2}
              onChange={handleFilterChange}
            />
          </FilterField>
        </FilterGrid>
      </FilterCard>

      {!loading && !error && (
        <ResponsiveDataTable
          title="Liste des employés"
          count={paginationResult.totalRecords}
          columns={columns}
          data={sortedEmployees}
          rowKey={(item) => item.employeeId}
          onRowClick={handleEmployeeDetails}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          mobileAvatar={renderAvatar}
          mobileTitle={(item) => `${item.firstName} ${item.name}`}
          mobileSubtitle={(item) => `Matricule : ${item.registrationNumber || '—'}`}
          pagination={{
            currentPage,
            totalPages,
            totalRecords: paginationResult.totalRecords,
            pageSize: paginationResult.pageSize,
            onPageChange: setCurrentPage,
          }}
        />
      )}
    </Template>
  );
}

export default ListEmployeePage;
