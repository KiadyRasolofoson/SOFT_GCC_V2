import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../pages/Authentification/UserContext';

function MenuBar() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const { visibleModules } = useUser();

  // Conversion du tableau visibleModules en Set pour des recherches rapides
  const modules = new Set(visibleModules || []);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/soft-gcc/carrieres') || pathname.startsWith('/soft-gcc/retraite') || pathname.startsWith('/soft-gcc/souhaits-evolution')) {
      setOpenMenu('carriere');
    } else if (pathname.startsWith('/soft-gcc/evaluations/') && !pathname.startsWith('/soft-gcc/evaluations/parametres')) {
      setOpenMenu('evaluation');
    } else if (pathname.startsWith('/soft-gcc/parametres') || pathname.startsWith('/soft-gcc/evaluations/parametres')) {
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
        {/* Dashboard — visible pour tous les utilisateurs authentifiés */}
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/soft-gcc/tableau-de-bord') ? 'active-menu' : ''}`} to="/soft-gcc/tableau-de-bord">
            <span className="icon-bg"><i className="mdi mdi-view-grid menu-icon"></i></span>
            <span className="menu-title">Analyse statistiques</span>
          </Link>
        </li>

        {/* Compétences */}
        {modules.has('competences') && (
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/soft-gcc/competences') ? 'active-menu' : ''}`} to="/soft-gcc/competences">
            <span className="icon-bg"><i className="mdi mdi-school menu-icon"></i></span>
            <span className="menu-title">Compétences</span>
          </Link>
        </li>
        )}

        {/* Carrières */}
        {modules.has('carrieres') && (
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
                <Link className={`nav-link ${isActive('/soft-gcc/carrieres') ? 'active-menu' : ''}`} to="/soft-gcc/carrieres" onClick={() => setOpenMenu(null)}>Plan de carrière</Link>
              </li>
              {modules.has('retraite') && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/retraite') ? 'active-menu' : ''}`} to="/soft-gcc/retraite" onClick={() => setOpenMenu(null)}>Départ à la retraite</Link>
              </li>
              )}
              {modules.has('souhaits') && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/souhaits-evolution') ? 'active-menu' : ''}`} to="/soft-gcc/souhaits-evolution" onClick={() => setOpenMenu(null)}>Évolution de carrière</Link>
              </li>
              )}
            </ul>
          )}
        </li>
        )}

        {/* Évaluations */}
        {modules.has('evaluations') && (
        <li className="nav-item">
          <div className={`nav-link ${openMenu === 'evaluation' ? 'active-menu' : ''}`} onClick={() => toggleMenu('evaluation')} style={{ cursor: 'pointer' }}>
            <span className="icon-bg"><i className="mdi mdi-lock menu-icon"></i></span>
            <span className="menu-title">Évaluations</span>
            <i className={`menu-arrow ${openMenu === 'evaluation' ? 'rotate-90' : ''}`}></i>
          </div>
          {openMenu === 'evaluation' && (
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/evaluations/liste') ? 'active-menu' : ''}`} to="/soft-gcc/evaluations/liste" onClick={() => setOpenMenu(null)}>Notation d'évaluation</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/evaluations/planning') ? 'active-menu' : ''}`} to="/soft-gcc/evaluations/planning" onClick={() => setOpenMenu(null)}>Planning d'évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/evaluations/accueil') ? 'active-menu' : ''}`} to="/soft-gcc/evaluations/accueil" onClick={() => setOpenMenu(null)}>Entretien d'évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/evaluations/historique') ? 'active-menu' : ''}`} to="/soft-gcc/evaluations/historique" onClick={() => setOpenMenu(null)}>Historique d'évaluations</Link>
              </li>
            </ul>
          )}
        </li>
        )}

        {/* Organigramme et effectif */}
        {modules.has('organigramme') && (
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/soft-gcc/effectifs') ? 'active-menu' : ''}`} to="/soft-gcc/effectifs">
            <span className="icon-bg"><i className="mdi mdi-sitemap menu-icon"></i></span>
            <span className="menu-title">Organigramme et effectif</span>
          </Link>
        </li>
        )}

        {/* Historiques des activités */}
        {modules.has('historique') && (
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/soft-gcc/historique') ? 'active-menu' : ''}`} to="/soft-gcc/historique">
            <span className="icon-bg"><i className="mdi mdi-history menu-icon"></i></span>
            <span className="menu-title">Historiques des activités</span>
          </Link>
        </li>
        )}

        {/* Paramètres (admin seulement) */}
        {modules.has('parametrage') && (
        <li className="nav-item">
          <div className={`nav-link ${openMenu === 'param' ? 'active-menu' : ''}`} onClick={() => toggleMenu('param')} style={{ cursor: 'pointer' }}>
            <span className="icon-bg"><i className="mdi mdi-settings menu-icon"></i></span>
            <span className="menu-title">Paramètres</span>
            <i className={`menu-arrow ${openMenu === 'param' ? 'rotate-90' : ''}`}></i>
          </div>
          {openMenu === 'param' && (
            <ul className="nav flex-column sub-menu">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/parametres/competences') ? 'active-menu' : ''}`} to="/soft-gcc/parametres/competences" onClick={() => setOpenMenu(null)}>Gestion Compétences</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/parametres/carrieres') ? 'active-menu' : ''}`} to="/soft-gcc/parametres/carrieres" onClick={() => setOpenMenu(null)}>Gestion Carrières</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/parametres/employes/liste') ? 'active-menu' : ''}`} to="/soft-gcc/parametres/employes/liste" onClick={() => setOpenMenu(null)}>Gestion employés</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/evaluations/parametres') ? 'active-menu' : ''}`} to="/soft-gcc/evaluations/parametres" onClick={() => setOpenMenu(null)}>Gestion des évaluations</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/soft-gcc/parametres/utilisateurs') ? 'active-menu' : ''}`} to="/soft-gcc/parametres/utilisateurs" onClick={() => setOpenMenu(null)}>Gestion des utilisateurs</Link>
              </li>
            </ul>
          )}
        </li>
        )}

        {/* Attestations */}
        {modules.has('attestations') && (
        <li className="nav-item">
          <Link className={`nav-link ${isActive('/soft-gcc/attestations') ? 'active-menu' : ''}`} to="/soft-gcc/attestations/modeles">
            <span className="icon-bg"><i className="mdi mdi-certificate menu-icon"></i></span>
            <span className="menu-title">Attestations</span>
          </Link>
        </li>
        )}

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
