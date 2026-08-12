import React from 'react';
import { Link } from 'react-router-dom';

// Gestion des url d'en-tete de page
function PageHeader({ module, action, url }) {
  return (
    <div className="page-header d-flex justify-content-between align-items-center mb-4">
      <h3 className="page-title mb-0 font-weight-bold" style={{ color: '#333', fontSize: '1.5rem' }}>
        {action || module}
      </h3>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0 bg-transparent p-0" style={{ fontSize: '0.9rem' }}>
          <li className="breadcrumb-item">
            <Link to={url} className="text-decoration-none d-flex align-items-center" style={{ color: '#6c757d' }}>
              <i className="mdi mdi-home-outline mr-1" style={{ fontSize: '1.1rem' }}></i>
              {module}
            </Link>
          </li>
          <li className="breadcrumb-item active font-weight-bold" aria-current="page" style={{ color: '#333' }}>
            {action}
          </li>
        </ol>
      </nav>
    </div>
  );
}

export default PageHeader;
