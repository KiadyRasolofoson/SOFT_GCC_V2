import React, { useState } from 'react';
import '../../styles/orgChart.css';
import { urlApi } from '../../helpers/utils';

function getInitials(name, firstName) {
  const a = (name || '').trim().charAt(0);
  const b = (firstName || '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}

function Avatar({ data }) {
  if (data.hasPhoto && data.employeeId) {
    return (
      <img
        className="org-avatar org-avatar--lg"
        src={urlApi(`/Employee/photo/${data.employeeId}`)}
        alt=""
      />
    );
  }

  return (
    <span className="org-avatar org-avatar--lg org-avatar--initials">
      {getInitials(data.name, data.firstName)}
    </span>
  );
}

function OrgNode({ data, isRoot = false, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showDetails, setShowDetails] = useState(false);
  const children = data.children || [];
  const hasChildren = children.length > 0;
  const fullName = `${data.firstName || ''} ${data.name || ''}`.trim() || 'Collaborateur';

  return (
    <div className="org-tree">
      <div className="org-tree__node">
        <div
          className={`org-tree__card${isRoot ? ' org-tree__card--root' : ''}`}
          onMouseEnter={() => setShowDetails(true)}
          onMouseLeave={() => setShowDetails(false)}
        >
          <div className="org-tree__avatar-wrap">
            <Avatar data={data} />
          </div>
          <p className="org-tree__name">{fullName}</p>
          <p className="org-tree__position">{data.position || 'Poste non défini'}</p>
          <p className="org-tree__dept">{data.department || 'Non assigné'}</p>

          {showDetails && (
            <div className="org-tree__details">
              <div>
                <strong>Civilité :</strong> {data.civilite || '—'}
              </div>
              <div>
                <strong>Département :</strong> {data.department || '—'}
              </div>
              <div>
                <strong>Poste :</strong> {data.position || '—'}
              </div>
            </div>
          )}

          {hasChildren && (
            <button
              type="button"
              className="org-tree__toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <i className={`mdi mdi-chevron-${expanded ? 'up' : 'down'}`} />
              {expanded ? 'Réduire' : `${children.length} N+1`}
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="org-tree__children">
          {children.map((child, index) => (
            <div className="org-tree__child" key={child.employeeId ?? `${fullName}-${index}`}>
              <OrgNode data={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const OrgChart = ({ data, scale = 1 }) => {
  const roots = Array.isArray(data) ? data : data ? [data] : [];

  if (roots.length === 0) {
    return (
      <div className="org-empty">
        <i className="mdi mdi-sitemap" />
        Aucune donnée d&apos;organigramme.
      </div>
    );
  }

  return (
    <div className="org-chart" style={{ transform: `scale(${scale})` }}>
      <div className={`org-chart__forest${roots.length > 1 ? ' org-chart__forest--multi' : ''}`}>
        {roots.map((root, index) => (
          <div className="org-chart__forest-item" key={root.employeeId ?? `root-${index}`}>
            <OrgNode data={root} isRoot />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrgChart;
