import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Template from '../Template';
import { urlApi } from '../../helpers/utils';
import axios from 'axios';
import Loader from '../../helpers/Loader';
import '../../styles/orgChart.css';
import { useNavigate, useParams } from 'react-router-dom';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

function getInitials(name, firstName) {
  const a = (name || '').trim().charAt(0);
  const b = (firstName || '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

function DetailDepartment() {
  const navigate = useNavigate();
  const { departmentId: DepartmentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [department, setDepartment] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!DepartmentId) {
      setError('ID du département introuvable.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [employeeListResponse, departmentResponse] = await Promise.all([
        axios.get(urlApi(`/Org/detailDepartement/${DepartmentId}`)),
        axios.get(urlApi(`/Department/${DepartmentId}`)),
      ]);

      setEmployeeList(employeeListResponse.data || []);
      setDepartment(departmentResponse.data || {});
    } catch (err) {
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [DepartmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employeeList;
    return employeeList.filter((item) => {
      const fullName = `${item.name || ''} ${item.firstName || ''}`.toLowerCase();
      const matricule = (item.registrationNumber || '').toLowerCase();
      const poste = (item.positionName || '').toLowerCase();
      return fullName.includes(q) || matricule.includes(q) || poste.includes(q);
    });
  }, [employeeList, search]);

  return (
    <Template>
      {loading && <Loader />}

      <div className="org-page">
        <div className="org-breadcrumb">
          <BreadcrumbPers
            items={[
              { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
              { label: 'Effectifs', path: '/soft-gcc/effectifs' },
              {
                label: department?.name || 'Détails',
                path: `/soft-gcc/effectifs/details/${DepartmentId}`,
              },
            ]}
          />
        </div>

        <header className="org-header">
          <div>
            <p className="org-header__eyebrow">Effectifs</p>
            <h1 className="org-header__title">
              {department?.name || 'Département'}
            </h1>
            <p className="org-header__subtitle">
              Liste des collaborateurs rattachés à ce département.
            </p>
          </div>
          <div className="org-header__actions">
            <button
              type="button"
              className="org-btn org-btn--ghost"
              onClick={() => navigate('/soft-gcc/effectifs')}
            >
              <i className="mdi mdi-arrow-left" />
              Retour
            </button>
            <button
              type="button"
              className="org-btn org-btn--soft"
              onClick={() => navigate('/soft-gcc/organigramme')}
            >
              <i className="mdi mdi-sitemap" />
              Organigramme
            </button>
          </div>
        </header>

        {error && <div className="org-alert">{error}</div>}

        <div className="org-kpi-row">
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--blue">
              <i className="mdi mdi-account-group" />
            </span>
            <div>
              <p className="org-kpi__label">Effectif</p>
              <p className="org-kpi__value">{employeeList.length}</p>
            </div>
          </div>
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--cyan">
              <i className="mdi mdi-filter-outline" />
            </span>
            <div>
              <p className="org-kpi__label">Résultats</p>
              <p className="org-kpi__value">{filtered.length}</p>
            </div>
          </div>
        </div>

        <div className="org-panel">
          <div className="org-panel__head">
            <div className="org-panel__title-wrap">
              <span className="org-panel__icon">
                <i className="mdi mdi-format-list-bulleted" />
              </span>
              <div>
                <h2 className="org-panel__title">Collaborateurs</h2>
                <p className="org-panel__desc">
                  Matricule, poste, date d&apos;embauche et ancienneté.
                </p>
              </div>
            </div>
            <div className="org-search">
              <i className="mdi mdi-magnify" />
              <input
                type="search"
                placeholder="Nom, matricule, poste…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Filtrer les collaborateurs"
              />
            </div>
          </div>

          <div className="org-panel__body">
            {filtered.length === 0 ? (
              <div className="org-empty">
                <i className="mdi mdi-account-off-outline" />
                Aucun collaborateur trouvé.
              </div>
            ) : (
              <div className="org-table-wrap">
                <table className="org-table">
                  <thead>
                    <tr>
                      <th>Collaborateur</th>
                      <th>Matricule</th>
                      <th>Poste</th>
                      <th>Embauche</th>
                      <th>Ancienneté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const fullName = `${item.name || ''} ${item.firstName || ''}`.trim() || '—';
                      return (
                        <tr key={item.employeeId ?? item.registrationNumber}>
                          <td>
                            <div className="org-employee-cell">
                              {item.photo ? (
                                <img
                                  className="org-avatar"
                                  src={urlApi(`/Employee/photo/${item.employeeId}`)}
                                  alt=""
                                />
                              ) : (
                                <span className="org-avatar org-avatar--initials">
                                  {getInitials(item.name, item.firstName)}
                                </span>
                              )}
                              <div>
                                <p className="org-employee-name">{fullName}</p>
                                <p className="org-employee-sub">
                                  {item.civiliteName || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="org-badge">
                              {item.registrationNumber || '—'}
                            </span>
                          </td>
                          <td>{item.positionName || 'Poste non défini'}</td>
                          <td>{formatDate(item.hiringDate)}</td>
                          <td>
                            <span className="org-badge org-badge--success">
                              {item.seniority || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Template>
  );
}

export default DetailDepartment;
