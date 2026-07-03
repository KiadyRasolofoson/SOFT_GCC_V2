import React from 'react';
import { Link } from 'react-router-dom';

// Gestion des url d'en-tete de page
function PageHeader({ module, action, url }) {
  return (
    <div className="page-header">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
            <Link to={url}>
              {module}
            </Link >
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {action}
            </li>
          </ol>
        </nav>
    </div>
  );
}

export default PageHeader;
