import React from 'react';

function FilterCard({ title = 'Filtres', icon = 'mdi-filter-outline', children }) {
  return (
    <div className="list-filter-card">
      <div className="list-filter-header">
        <i className={`mdi ${icon}`}></i>
        <span>{title}</span>
      </div>
      <div className="list-filter-body">{children}</div>
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <div className="list-filter-field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function FilterGrid({ children }) {
  return <div className="list-filter-grid">{children}</div>;
}

export default FilterCard;
