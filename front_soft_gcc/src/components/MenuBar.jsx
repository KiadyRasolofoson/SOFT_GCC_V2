import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function MenuBar() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/SoftGcc/carriere') || pathname.startsWith('/retraite') || pathname.startsWith('/softGcc/souhaitEvolution')) {
      setOpenMenu('carriere');
    } else if (pathname.startsWith('/salary-list') || pathname.startsWith('/planning') || pathname.startsWith('/homeInterview') || pathname.startsWith('/history')) {
      setOpenMenu('evaluation');
    } else if (pathname.startsWith('/softGcc/settings') || pathname.startsWith('/EvaluationSettings') || pathname.startsWith('/user-management')) {
      setOpenMenu('param');
    } else {
      setOpenMenu(null);
    }
  }, [location.pathname]);

  const toggleMenu = (menu) => {
    setOpenMenu(prev => (prev === menu ? null : menu));
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="sidebar sidebar-offcanvas" id="sidebar" style={{ paddingTop: '30px' }}>
      <ul className="nav">
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/softGcc/tableauBord') ? 'active-menu' : ''}`} to="/softGcc/tableauBord">
            <span className="icon-bg"><i className="mdi mdi-view-grid menu-icon"></i></span>
            <span className="menu-title">Analyse statistiques</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link className={`nav-link ${isActive('/softGcc/competences') ? 'active-menu' : ''}`} to="/softGcc/competences">
            <span className="icon-bg"><i className="mdi mdi-school menu-icon"></i></span>
            <span className="menu-title">Compétences</span>
          </Link>
        </li>

        <li className="nav-item">
          <div
            className={`nav-link ${openMenu === 'carriere' ? 'active-menu' : ''}`}
            onClick={() => toggleMenu('carriere')}
            style={{ cursor: 'pointer' }}
          >
            <span className="icon-bg"><i className="mdi mdi-crosshairs-gps menu-icon"></i></span>
            <span className="menu-title">Carrières</span>
            <i className={`menu-arrow ${openMenu === 'carriere' ? 'rotate-90' : ''}`}></i>
          </div>
          {openMenu === 'carriere' && (
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/SoftGcc/carriere') ? 'active-menu' : ''}`} to="/SoftGcc/carriere" onClick={() => setOpenMenu(null)}>Plan de carrière</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/retraite') ? 'active-menu' : ''}`} to="/retraite" onClick={() => setOpenMenu(null)}>Départ à la retraite</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/softGcc/souhaitEvolution') ? 'active-menu' : ''}`} to="/softGcc/souhaitEvolution/suivi" onClick={() => setOpenMenu(null)}>Évolution de carrière</Link>
              </li>
            </ul>
          )}
        </li>

        <li className="nav-item">
          <div className={`nav-link ${openMenu === 'evaluation' ? 'active-menu' : ''}`} onClick={() => toggleMenu('evaluation')} style={{ cursor: 'pointer' }}>
            <span className="icon-bg"><i className="mdi mdi-lock menu-icon"></i></span>
            <span className="menu-title">Évaluations</span>
            <i className={`menu-arrow ${openMenu === 'evaluation' ? 'rotate-90' : ''}`}></i>
          </div>
          {openMenu === 'evaluation' && (
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/salary-list') ? 'active-menu' : ''}`} to="/salary-list" onClick={() => setOpenMenu(null)}>Notation d'évaluation</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/planning') ? 'active-menu' : ''}`} to="/planning" onClick={() => setOpenMenu(null)}>Planning d'évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/homeInterview') ? 'active-menu' : ''}`} to="/homeInterview" onClick={() => setOpenMenu(null)}>Entretien d'évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/history') ? 'active-menu' : ''}`} to="/history" onClick={() => setOpenMenu(null)}>Historique d'évaluations</Link>
              </li>
            </ul>
          )}
        </li>

        <li className="nav-item">
          <Link className={`nav-link ${isActive('/softGcc/effectif') ? 'active-menu' : ''}`} to="/softGcc/effectif">
            <span className="icon-bg"><i className="mdi mdi-sitemap menu-icon"></i></span>
            <span className="menu-title">Organigramme et effectif</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link className={`nav-link ${isActive('/softGcc/activityHistory') ? 'active-menu' : ''}`} to="/softGcc/activityHistory">
            <span className="icon-bg"><i className="mdi mdi-history menu-icon"></i></span>
            <span className="menu-title">Historiques des activités</span>
          </Link>
        </li>

        <li className="nav-item">
          <div className={`nav-link ${openMenu === 'param' ? 'active-menu' : ''}`} onClick={() => toggleMenu('param')} style={{ cursor: 'pointer' }}>
            <span className="icon-bg"><i className="mdi mdi-settings menu-icon"></i></span>
            <span className="menu-title">Paramètres</span>
            <i className={`menu-arrow ${openMenu === 'param' ? 'rotate-90' : ''}`}></i>
          </div>
          {openMenu === 'param' && (
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/softGcc/settings/competence') ? 'active-menu' : ''}`} to="/softGcc/settings/competence" onClick={() => setOpenMenu(null)}>Gestion Compétences</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/softGcc/settings/carriere') ? 'active-menu' : ''}`} to="/softGcc/settings/carriere" onClick={() => setOpenMenu(null)}>Gestion Carrières</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/softGcc/settings/employeeManagement/liste') ? 'active-menu' : ''}`} to="/softGcc/settings/employeeManagement/liste" onClick={() => setOpenMenu(null)}>Gestion employés</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/EvaluationSettings') ? 'active-menu' : ''}`} to="/EvaluationSettings" onClick={() => setOpenMenu(null)}>Gestion des évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/user-management') ? 'active-menu' : ''}`} to="/user-management" onClick={() => setOpenMenu(null)}>Gestion des utilisateurs</Link>
              </li>
            </ul>
          )}
        </li>

        <li className="nav-item sidebar-user-actions">
          <div className="sidebar-user-menu">
            <a href="#" className="nav-link">
              <i className="mdi mdi-logout menu-icon"></i>
              <span className="menu-title">Déconnexion</span>
            </a>
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default MenuBar;
