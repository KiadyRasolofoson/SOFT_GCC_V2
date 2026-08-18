import React from 'react';

function ListPageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="list-page-header">
      <div className="list-page-header-left">
        <div className="list-page-header-icon">
          <i className={`mdi ${icon}`}></i>
        </div>
        <div>
          <h1 className="list-page-header-title">{title}</h1>
          {subtitle && <p className="list-page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="list-page-actions">{actions}</div>}
    </div>
  );
}

export default ListPageHeader;
