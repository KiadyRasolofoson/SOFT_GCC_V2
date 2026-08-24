import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../pages/Authentification/UserContext';
import { getMyModules } from '../services/ModuleService';

/**
 * MenuBar dynamique — le menu est construit à partir des modules
 * retournés par GET /api/Module/my-modules.
 * Remplace l'ancien menu codé en dur.
 */
function MenuBar() {
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const { visibleModules, myModules, modulesAccessReady } = useUser();

    useEffect(() => {
        if (!modulesAccessReady) return;

        // Cache UserContext : tableau (éventuellement vide) = vérité Role_Modules
        if (Array.isArray(myModules)) {
            setModules(myModules);
            setLoading(false);
            return;
        }

        const fetchModules = async () => {
            try {
                setLoading(true);
                const data = await getMyModules();
                setModules(Array.isArray(data) ? data : []);
            } catch (err) {
                console.warn('MenuBar: erreur API, fallback sur visibleModules');
                setModules(buildFallbackMenu(visibleModules || []));
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, [visibleModules, myModules, modulesAccessReady]);

    useEffect(() => {
        const pathname = location.pathname;
        let matched = null;
        for (const mod of modules) {
            if (mod.route && pathname.startsWith(mod.route.split('?')[0])) {
                matched = mod.name;
                break;
            }
            if (mod.childModules) {
                for (const child of mod.childModules) {
                    if (child.route && pathname.startsWith(child.route.split('?')[0])) {
                        matched = mod.name;
                        break;
                    }
                }
                if (matched) break;
            }
        }
        setOpenMenu(matched);
    }, [location.pathname, modules]);

    // Largeur du menu adaptée au texte le plus long
    useEffect(() => {
        if (loading) return;

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const MIN_WIDTH = 258;
        const MAX_WIDTH = 400;
        let cancelled = false;
        let outerFrame = 0;
        let innerFrame = 0;

        const updateSidebarWidth = () => {
            if (cancelled || document.body.classList.contains('sidebar-icon-only')) return;

            const subMenus = Array.from(sidebar.querySelectorAll('.sub-menu'));
            const previousVisibility = subMenus.map((el) => ({
                el,
                className: el.className,
            }));

            // Afficher temporairement tous les sous-menus pour mesurer le texte le plus long
            subMenus.forEach((el) => {
                el.classList.remove('d-none');
                el.classList.add('d-block');
            });

            const previousWidth = sidebar.style.width;
            const previousOverflow = sidebar.style.overflow;
            sidebar.style.width = 'max-content';
            sidebar.style.overflow = 'visible';

            const measured = Math.ceil(sidebar.getBoundingClientRect().width);

            sidebar.style.width = previousWidth;
            sidebar.style.overflow = previousOverflow;
            previousVisibility.forEach(({ el, className }) => {
                el.className = className;
            });

            const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, measured + 12));
            document.documentElement.style.setProperty('--sidebar-width', `${nextWidth}px`);
        };

        outerFrame = requestAnimationFrame(() => {
            innerFrame = requestAnimationFrame(updateSidebarWidth);
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(outerFrame);
            cancelAnimationFrame(innerFrame);
        };
    }, [loading, modules]);

    // Nettoyage de la variable CSS au démontage uniquement
    useEffect(() => {
        return () => {
            document.documentElement.style.removeProperty('--sidebar-width');
        };
    }, []);

    const toggleMenu = (menuName) => {
        setOpenMenu(prev => (prev === menuName ? null : menuName));
    };

    const isActive = (path) => {
        if (!path) return false;
        return location.pathname.startsWith(path.split('?')[0]);
    };

    const renderIcon = (iconClass) => {
        if (!iconClass) return null;
        return <span className="icon-bg"><i className={`${iconClass} menu-icon`}></i></span>;
    };

    const renderSubMenu = (children, parentName) => {
        if (!children || children.length === 0) return null;
        const isOpen = openMenu === parentName;
        return (
            <ul className={`nav flex-column sub-menu ${isOpen ? 'd-block' : 'd-none'}`}>
                {children.map(child => (
                    <li key={child.moduleId} className="nav-item">
                        <Link
                            className={`nav-link ${isActive(child.route) ? 'active-menu' : ''}`}
                            to={child.route || '#'}
                        >
                            {child.displayName}
                        </Link>
                    </li>
                ))}
            </ul>
        );
    };

    const renderModule = (mod) => {
        const hasChildren = mod.childModules && mod.childModules.length > 0;
        const isOpen = openMenu === mod.name;

        if (hasChildren) {
            return (
                <li key={mod.moduleId} className="nav-item">
                    <div
                        className={`nav-link ${isOpen || isActive(mod.route) ? 'active-menu' : ''}`}
                        onClick={() => toggleMenu(mod.name)}
                        style={{ cursor: 'pointer' }}
                    >
                        {renderIcon(mod.icon)}
                        <span className="menu-title">{mod.displayName}</span>
                        <i className={`menu-arrow ${isOpen ? 'rotate-90' : ''}`}></i>
                    </div>
                    {renderSubMenu(mod.childModules, mod.name)}
                </li>
            );
        }

        return (
            <li key={mod.moduleId} className="nav-item">
                <Link
                    className={`nav-link ${isActive(mod.route) ? 'active-menu' : ''}`}
                    to={mod.route || '#'}
                >
                    {renderIcon(mod.icon)}
                    <span className="menu-title">{mod.displayName}</span>
                </Link>
            </li>
        );
    };

    const renderLogout = () => (
        <li className="nav-item sidebar-user-actions">
            <div className="sidebar-user-menu">
                <a href="#" className="nav-link" onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userProfile');
                    window.location.href = '/login';
                }}>
                    <i className="mdi mdi-logout menu-icon"></i>
                    <span className="menu-title">Déconnexion</span>
                </a>
            </div>
        </li>
    );

    return (
        <nav className="sidebar sidebar-offcanvas" id="sidebar" style={{ paddingTop: '30px' }}>
            {loading ? (
                <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-light" role="status" />
                </div>
            ) : (
                <ul className="nav">
                    {modules
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map(mod => renderModule(mod))}
                    {renderLogout()}
                </ul>
            )}
        </nav>
    );
}

export default MenuBar;

/**
 * Construit le menu de fallback (ancien menu statique).
 * Utilisé uniquement en cas d'erreur réseau — un tableau vide Role_Modules
 * doit rester un menu vide, pas ce catalogue complet.
 */
function buildFallbackMenu(visibleModules) {
    const modules = new Set(visibleModules);

    const menu = [
        // 1. Dashboard
        { moduleId: 'dashboard', name: 'dashboard', displayName: 'Analyse statistiques', icon: 'mdi mdi-view-grid', route: '/soft-gcc/tableau-de-bord', sortOrder: 1, childModules: [] },

        // 2. Compétences
        { moduleId: 'competences', name: 'competences', displayName: 'Compétences', icon: 'mdi mdi-school', route: '/soft-gcc/competences', sortOrder: 2, childModules: [
            { moduleId: 'competences_profil', name: 'competences_profil', displayName: 'Profil des compétences', route: '/soft-gcc/competences' },
            { moduleId: 'competences_bulletin', name: 'competences_bulletin', displayName: 'Bulletin de compétences', route: '/soft-gcc/evaluations/bulletin' }
        ]},

        // 3. Carrières (inclut Retraite + Souhaits)
        { moduleId: 'carrieres', name: 'carrieres', displayName: 'Carrières', icon: 'mdi mdi-crosshairs-gps', route: '/soft-gcc/carrieres', sortOrder: 3, childModules: [
            { moduleId: 'carrieres_plan', name: 'carrieres_plan', displayName: 'Plan de carrière', route: '/soft-gcc/carrieres' },
            ...(modules.has('retraite') ? [{ moduleId: 'retraite', name: 'retraite', displayName: 'Départ à la retraite', route: '/soft-gcc/retraite' }] : []),
            ...(modules.has('souhaits') ? [{ moduleId: 'souhaits', name: 'souhaits', displayName: 'Évolution de carrière', route: '/soft-gcc/souhaits-evolution' }] : [])
        ]},

        // 4. Évaluations
        { moduleId: 'evaluations', name: 'evaluations', displayName: 'Évaluations', icon: 'mdi mdi-clipboard-check', route: '/soft-gcc/evaluations/liste', sortOrder: 4, childModules: [
            { moduleId: 'eval_notation', name: 'eval_notation', displayName: "Notation d'évaluation", route: '/soft-gcc/evaluations/liste' },
            { moduleId: 'eval_planning', name: 'eval_planning', displayName: "Planning d'évaluations", route: '/soft-gcc/evaluations/planning' },
            { moduleId: 'eval_entretien', name: 'eval_entretien', displayName: "Entretien d'évaluations", route: '/soft-gcc/evaluations/accueil' },
            { moduleId: 'eval_historique', name: 'eval_historique', displayName: "Historique d'évaluations", route: '/soft-gcc/evaluations/historique' },
            { moduleId: 'eval_objectifs', name: 'eval_objectifs', displayName: 'Récap objectifs', route: '/soft-gcc/evaluations/objectifs' }
        ]},

        // 5. Organigramme
        { moduleId: 'organigramme', name: 'organigramme', displayName: 'Organigramme et effectif', icon: 'mdi mdi-sitemap', route: '/soft-gcc/effectifs', sortOrder: 5, childModules: [] },

        // 6. Historique
        { moduleId: 'historique', name: 'historique', displayName: 'Historiques des activités', icon: 'mdi mdi-history', route: '/soft-gcc/historique', sortOrder: 6, childModules: [] },

        // 7. Paramètres
        { moduleId: 'parametrage', name: 'parametrage', displayName: 'Paramètres', icon: 'mdi mdi-settings', route: '/soft-gcc/parametres', sortOrder: 7, childModules: [
            { moduleId: 'param_competences', name: 'param_competences', displayName: 'Gestion Compétences', route: '/soft-gcc/parametres/competences' },
            { moduleId: 'param_carrieres', name: 'param_carrieres', displayName: 'Gestion Carrières', route: '/soft-gcc/parametres/carrieres' },
            { moduleId: 'param_employes', name: 'param_employes', displayName: 'Gestion employés', route: '/soft-gcc/parametres/employes/liste' },
            { moduleId: 'param_evaluations', name: 'param_evaluations', displayName: 'Gestion des évaluations', route: '/soft-gcc/evaluations/parametres' },
            { moduleId: 'param_utilisateurs', name: 'param_utilisateurs', displayName: 'Gestion des utilisateurs', route: '/soft-gcc/parametres/utilisateurs' },
            { moduleId: 'param_synchronisation', name: 'param_synchronisation', displayName: 'Synchro. Employés (T_SAL)', route: '/soft-gcc/parametres/synchronisation' }
        ]},

        // 8. Attestations
        { moduleId: 'attestations', name: 'attestations', displayName: 'Attestations', icon: 'mdi mdi-certificate', route: '/soft-gcc/attestations', sortOrder: 8, childModules: [] }
    ];

    // Filtrer par visibleModules
    return menu.filter(m => modules.has(m.name));
}
