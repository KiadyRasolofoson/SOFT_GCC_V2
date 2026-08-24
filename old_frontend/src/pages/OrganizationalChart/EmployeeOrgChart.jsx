import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Template from '../Template';
import { urlApi } from '../../helpers/utils';
import axios from 'axios';
import Loader from '../../helpers/Loader';
import OrgChart from '../../components/organizationalChart/OrgChart';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import { useNavigate } from 'react-router-dom';
import '../../styles/orgChart.css';

const ALL_DEPARTMENTS = 'all';

function countNodes(node) {
  if (!node) return 0;
  const kids = node.children || [];
  return 1 + kids.reduce((sum, c) => sum + countNodes(c), 0);
}

function matchesDepartment(node, departmentKey) {
  if (departmentKey === ALL_DEPARTMENTS) return true;
  if (departmentKey === 'none') {
    return node.departmentId == null;
  }
  return String(node.departmentId) === String(departmentKey);
}

/** Conserve uniquement les collaborateurs du département sélectionné. */
function pruneToDepartment(node, departmentKey) {
  const children = (node.children || [])
    .map((child) => pruneToDepartment(child, departmentKey))
    .filter(Boolean);

  if (!matchesDepartment(node, departmentKey)) {
    return null;
  }

  return { ...node, children };
}

/**
 * Branches du département : chaque employé du département dont le manager
 * n'est pas dans ce département (ou n'a pas de manager) devient une racine.
 */
function getDepartmentBranches(roots, departmentKey) {
  if (departmentKey === ALL_DEPARTMENTS) {
    return roots;
  }

  const branches = [];

  function visit(node) {
    if (matchesDepartment(node, departmentKey)) {
      const pruned = pruneToDepartment(node, departmentKey);
      if (pruned) branches.push(pruned);
      return;
    }
    (node.children || []).forEach(visit);
  }

  roots.forEach(visit);
  return branches;
}

function collectDepartmentsFromTree(roots) {
  const map = new Map();

  function visit(node) {
    const key = node.departmentId == null ? 'none' : String(node.departmentId);
    const label = node.department || 'Non assigné';
    if (!map.has(key)) {
      map.set(key, { key, label, departmentId: node.departmentId ?? null });
    }
    (node.children || []).forEach(visit);
  }

  roots.forEach(visit);
  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })
  );
}

function EmployeeOrgChart() {
  const navigate = useNavigate();
  const [orgRoots, setOrgRoots] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(urlApi('/Org/organigramme'));
      const roots = Array.isArray(response.data) ? response.data : [];
      setOrgRoots(roots);
    } catch (err) {
      setError(`Erreur lors de la récupération des données : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const departments = useMemo(() => collectDepartmentsFromTree(orgRoots), [orgRoots]);

  const filteredRoots = useMemo(
    () => getDepartmentBranches(orgRoots, selectedDepartment),
    [orgRoots, selectedDepartment]
  );

  const totalPeople = useMemo(
    () => filteredRoots.reduce((sum, root) => sum + countNodes(root), 0),
    [filteredRoots]
  );

  const selectedLabel = useMemo(() => {
    if (selectedDepartment === ALL_DEPARTMENTS) return 'Tous les départements';
    return departments.find((d) => d.key === selectedDepartment)?.label || 'Département';
  }, [selectedDepartment, departments]);

  const zoomIn = () => setScale((s) => Math.min(1.4, Number((s + 0.1).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(2))));
  const zoomReset = () => setScale(1);

  return (
    <Template>
      {loading && <Loader />}

      <div className="org-page">
        <div className="org-breadcrumb">
          <BreadcrumbPers
            items={[
              { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
              { label: 'Effectifs', path: '/soft-gcc/effectifs' },
              { label: 'Organigramme', path: '/soft-gcc/organigramme' },
            ]}
          />
        </div>

        <header className="org-header">
          <div>
            <p className="org-header__eyebrow">Organisation</p>
            <h1 className="org-header__title">Organigramme</h1>
            <p className="org-header__subtitle">
              Hiérarchie managériale par département. Survolez une fiche pour plus de détails.
            </p>
          </div>
          <div className="org-header__actions">
            <button
              type="button"
              className="org-btn org-btn--ghost"
              onClick={() => navigate('/soft-gcc/effectifs')}
            >
              <i className="mdi mdi-arrow-left" />
              Effectifs
            </button>
            <button
              type="button"
              className="org-btn org-btn--soft"
              onClick={fetchData}
            >
              <i className="mdi mdi-refresh" />
              Actualiser
            </button>
          </div>
        </header>

        {error && <div className="org-alert">{error}</div>}

        <div className="org-kpi-row">
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--blue">
              <i className="mdi mdi-account-tie" />
            </span>
            <div>
              <p className="org-kpi__label">Dans la vue</p>
              <p className="org-kpi__value">{totalPeople}</p>
            </div>
          </div>
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--cyan">
              <i className="mdi mdi-source-branch" />
            </span>
            <div>
              <p className="org-kpi__label">Branches</p>
              <p className="org-kpi__value">{filteredRoots.length}</p>
            </div>
          </div>
          <div className="org-kpi">
            <span className="org-kpi__icon org-kpi__icon--green">
              <i className="mdi mdi-office-building" />
            </span>
            <div>
              <p className="org-kpi__label">Filtre</p>
              <p className="org-kpi__value" style={{ fontSize: '1rem', lineHeight: 1.2 }}>
                {selectedLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="org-chart-shell">
          <div className="org-chart-toolbar">
            <div className="org-chart-toolbar__left">
              <label className="org-chart-filter" htmlFor="org-department-filter">
                <span className="org-chart-filter__label">Département</span>
                <select
                  id="org-department-filter"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  aria-label="Filtrer l'organigramme par département"
                >
                  <option value={ALL_DEPARTMENTS}>Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept.key} value={dept.key}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="org-chart-toolbar__hint">
                Cliquez sur « N+1 » pour développer ou réduire une branche.
              </p>
            </div>
            <div className="org-chart-toolbar__controls">
              <button type="button" className="org-btn org-btn--ghost" onClick={zoomOut} title="Zoom arrière">
                <i className="mdi mdi-magnify-minus-outline" />
              </button>
              <button type="button" className="org-btn org-btn--ghost" onClick={zoomReset} title="Réinitialiser">
                {Math.round(scale * 100)}%
              </button>
              <button type="button" className="org-btn org-btn--ghost" onClick={zoomIn} title="Zoom avant">
                <i className="mdi mdi-magnify-plus-outline" />
              </button>
            </div>
          </div>

          <div className="org-chart-viewport">
            {filteredRoots.length > 0 ? (
              <OrgChart data={filteredRoots} scale={scale} />
            ) : (
              !loading && (
                <div className="org-empty">
                  <i className="mdi mdi-sitemap" />
                  Aucune branche pour ce département.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Template>
  );
}

export default EmployeeOrgChart;
