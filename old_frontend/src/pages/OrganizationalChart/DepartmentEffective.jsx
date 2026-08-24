import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Template from '../Template';
import { useNavigate } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import axios from 'axios';
import Loader from '../../helpers/Loader';
import '../../styles/orgChart.css';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import { useUser } from '../Authentification/UserContext';
import PermissionService from '../../services/PermissionService';

function DepartmentEffective() {
  const navigate = useNavigate();
  const { hasPermission } = useUser();
  const canImport = PermissionService.hasFunctionalPermission(hasPermission, 'IMPORT_ORG');

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(urlApi('/Org/effectifDepartement'));
      setDepartments(response.data || []);
    } catch (err) {
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      (d.departmentName || 'Département inconnu').toLowerCase().includes(q)
    );
  }, [departments, search]);

  const totalEmployees = useMemo(
    () => departments.reduce((sum, d) => sum + (d.nEmployee || 0), 0),
    [departments]
  );

  const assignedDepts = useMemo(
    () => departments.filter((d) => d.departmentId != null).length,
    [departments]
  );

  return (
    <Template>
      {loading && <Loader />}

      <div className="org-page">
        <div className="org-breadcrumb">
          <BreadcrumbPers
            items={[
              { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
              { label: 'Effectifs', path: '/soft-gcc/effectifs' },
            ]}
          />
        </div>

        <header className="org-header">
          <div>
            <p className="org-header__eyebrow">Organisation</p>
            <h1 className="org-header__title">Effectifs par département</h1>
            <p className="org-header__subtitle">
              Répartition des collaborateurs et accès rapide à l&apos;organigramme.
            </p>
          </div>
          <div className="org-header__actions">
            {canImport && (
              <button
                type="button"
                className="org-btn org-btn--ghost"
                onClick={() => navigate('/soft-gcc/effectifs/importer')}
              >
                <i className="mdi mdi-upload" />
                Importer CSV
              </button>
            )}
            <button
              type="button"
              className="org-btn org-btn--primary"
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
              <p className="org-kpi__label">Collaborateurs</p>
              <p className="org-kpi__value">{totalEmployees}</p>
            </div>
          </div>
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--cyan">
              <i className="mdi mdi-office-building" />
            </span>
            <div>
              <p className="org-kpi__label">Départements</p>
              <p className="org-kpi__value">{assignedDepts}</p>
            </div>
          </div>
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--green">
              <i className="mdi mdi-eye-outline" />
            </span>
            <div>
              <p className="org-kpi__label">Affichés</p>
              <p className="org-kpi__value">{filtered.length}</p>
            </div>
          </div>
        </div>

        <div className="org-toolbar">
          <div className="org-search">
            <i className="mdi mdi-magnify" />
            <input
              type="search"
              placeholder="Rechercher un département…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un département"
            />
          </div>
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="org-panel">
            <div className="org-empty">
              <i className="mdi mdi-domain-off" />
              Aucun département trouvé.
            </div>
          </div>
        ) : (
          <div className="org-dept-grid">
            {filtered.map((item) => {
              const departmentName = item.departmentName || 'Département inconnu';
              const key = item.departmentId ?? `unknown-${departmentName}`;
              return (
                <button
                  type="button"
                  key={key}
                  className="org-dept-card"
                  onClick={() => {
                    if (item.departmentId != null) {
                      navigate(`/soft-gcc/effectifs/details/${item.departmentId}`);
                    }
                  }}
                  disabled={item.departmentId == null}
                >
                  <div className="org-dept-card__media">
                    {item.departmentPhoto && item.departmentId != null ? (
                      <img
                        src={urlApi(`/Department/photo/${item.departmentId}`)}
                        alt=""
                      />
                    ) : (
                      <span className="org-dept-card__media-fallback">
                        <i className="mdi mdi-office-building-outline" />
                      </span>
                    )}
                  </div>
                  <div className="org-dept-card__body">
                    <h3 className="org-dept-card__name">{departmentName}</h3>
                    <p className="org-dept-card__meta">
                      <i className="mdi mdi-account-multiple-outline" />
                      {item.nEmployee || 0}{' '}
                      {(item.nEmployee || 0) > 1 ? 'collaborateurs' : 'collaborateur'}
                    </p>
                    <div className="org-dept-card__footer">
                      <span>Voir le détail</span>
                      <span className="org-dept-card__count">{item.nEmployee || 0}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Template>
  );
}

export default DepartmentEffective;
