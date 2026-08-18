import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import Template from '../Template';
import pic1 from '/src/assets/images/male-default.webp';
import Loader from '../../helpers/Loader';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import api from '../../helpers/api';
import { mdiEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';
import ListPageHeader from '../../components/listPage/ListPageHeader';
import FilterCard, { FilterField, FilterGrid } from '../../components/listPage/FilterCard';
import ResponsiveDataTable from '../../components/listPage/ResponsiveDataTable';
import '../../styles/listPage.css';

function ListSkillSalaryPage() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [sortedSkills, setSortedSkills] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortColumn, setSortColumn] = useState('updatedDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationResult, setPaginationResult] = useState({
    totalRecords: 0,
    pageSize: 0,
    currentPage: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const sorted = [...skills].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      if (sortColumn === 'updatedDate') {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setSortedSkills(sorted);
  }, [sortDirection, skills, sortColumn]);

  const fetchSkills = useCallback(
    async (term) => {
      setLoading(true);
      setError(null);
      try {
        const route = term ? '/EmployeeSkills/filter' : '/EmployeeSkills/list';
        const params = term
          ? { keyWord: term, pageNumber: currentPage, pageSize }
          : { pageNumber: currentPage, pageSize };

        const response = await api.get(route, { params });
        setSkills(response.data.data);
        setTotalPages(response.data.totalPages);
        setPaginationResult({
          totalRecords: response.data.totalRecords,
          pageSize: response.data.pageSize,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
        });
      } catch {
        setError('Erreur lors de la récupération des données.');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    fetchSkills(debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

  const handleSkillsDetails = (item) => {
    navigate(`/soft-gcc/employes/fiche/${item.employeeId}?espace=competences`);
  };

  const renderAvatar = (item) =>
    item.photo ? (
      <img src={urlApi(`/Employee/photo/${item.employeeId}`)} alt={`Employé ${item.registrationNumber}`} />
    ) : (
      <img src={pic1} alt={item.registrationNumber} />
    );

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
      key: 'updatedDate',
      header: 'Dernière modification',
      sortable: true,
      render: (item) => <DateDisplayWithTime isoDate={item.updatedDate} />,
    },
    {
      key: 'educationNumber',
      header: 'Diplômes & formations',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.educationNumber}</span>,
    },
    {
      key: 'skillNumber',
      header: 'Compétences',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.skillNumber}</span>,
    },
    {
      key: 'languageNumber',
      header: 'Langues',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.languageNumber}</span>,
    },
    {
      key: 'otherFormationNumber',
      header: 'Autres',
      sortable: true,
      render: (item) => <span className="list-stat-pill">{item.otherFormationNumber}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="list-btn-view" type="button">
          <Icon path={mdiEyeOutline} size={0.8} /> Voir profil
        </button>
      ),
    },
  ];

  return (
    <Template>
      {loading && <Loader />}
      {error && <div className="alert alert-danger">{error}</div>}

      <ListPageHeader
        icon="mdi-school"
        title="Compétences des salariés"
        subtitle="Consultez et gérez les compétences de chaque employé"
      />

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Compétences', path: '/soft-gcc/competences' },
          { label: 'Liste des compétences', path: '/soft-gcc/competences' },
        ]}
      />

      <FilterCard title="Filtre de recherche" icon="mdi-magnify">
        <FilterGrid>
          <FilterField label="Recherche">
            <input
              type="text"
              placeholder="Nom, prénom ou matricule"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FilterField>
        </FilterGrid>
      </FilterCard>

      {!loading && !error && (
        <>
          <ResponsiveDataTable
            title="Nombre de compétences par employé"
            count={paginationResult.totalRecords}
            columns={columns}
            data={sortedSkills}
            rowKey={(item) => item.employeeId}
            onRowClick={handleSkillsDetails}
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
        </>
      )}
    </Template>
  );
}

export default ListSkillSalaryPage;
