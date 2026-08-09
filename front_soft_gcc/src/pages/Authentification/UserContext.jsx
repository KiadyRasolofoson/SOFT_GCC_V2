import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { urlApi } from '../../helpers/utils';
import { getAccessMap, getMyModules } from '../../services/ModuleService';

const UserContext = createContext(null);

function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
    }
    return context;
}

/** Normalise un chemin URL pour comparaison */
export function normalizeRoutePath(path) {
    if (!path || typeof path !== 'string') return '';
    const clean = path.split('?')[0].split('#')[0].trim();
    if (!clean) return '';
    const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
    return withSlash.replace(/\/+$/, '') || '/';
}

/**
 * Vérifie si un pathname est autorisé selon les routes Role_Modules.
 * - Si le catalogue contient une route couvrant le path : la plus longue doit être dans allowed.
 * - Sinon (sous-page non déclarée, ex. /evaluations/details/1) : autorise si une section
 *   /soft-gcc/{area} est couverte par au moins une route autorisée.
 * - Si le catalogue est vide (tables absentes) : fail-open (true).
 */
export function checkRouteAccess(pathname, allowedRoutes = [], catalogRoutes = []) {
    const path = normalizeRoutePath(pathname);
    if (!path.startsWith('/soft-gcc')) return true;

    const allowed = (allowedRoutes || []).map(normalizeRoutePath).filter(Boolean);
    const catalog = (catalogRoutes || []).map(normalizeRoutePath).filter(Boolean);

    // Système modules pas encore en place → ne pas bloquer
    if (catalog.length === 0) return true;

    const covers = (route, target) => target === route || target.startsWith(`${route}/`);

    const coveringCatalog = catalog
        .filter(r => covers(r, path))
        .sort((a, b) => b.length - a.length);

    if (coveringCatalog.length > 0) {
        const best = coveringCatalog[0];
        return allowed.includes(best);
    }

    // Sous-chemin non déclaré dans Modules : même section /soft-gcc/{area}
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length < 2) return false;
    const section = `/${pathParts[0]}/${pathParts[1]}`; // /soft-gcc/evaluations

    return allowed.some(r => r === section || r.startsWith(`${section}/`));
}

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [visibleModules, setVisibleModules] = useState([]);
    const [myModules, setMyModules] = useState([]);
    const [allowedRoutes, setAllowedRoutes] = useState([]);
    const [catalogRoutes, setCatalogRoutes] = useState([]);
    const [modulesAccessReady, setModulesAccessReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const clearUserData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        setUser(null);
        setUserRole(null);
        setUserPermissions([]);
        setVisibleModules([]);
        setMyModules([]);
        setAllowedRoutes([]);
        setCatalogRoutes([]);
        setModulesAccessReady(false);
        setIsInitialized(false);
    };

    const isTokenValid = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (error) {
            console.error('Erreur lors de la vérification du token', error);
            return false;
        }
    };

    const loadModuleAccess = async () => {
        try {
            const [accessMap, modulesTree] = await Promise.all([
                getAccessMap().catch(() => ({ allowedRoutes: [], catalogRoutes: [] })),
                getMyModules().catch(() => [])
            ]);

            const allowed = Array.isArray(accessMap?.allowedRoutes) ? accessMap.allowedRoutes : [];
            const catalog = Array.isArray(accessMap?.catalogRoutes) ? accessMap.catalogRoutes : [];
            const tree = Array.isArray(modulesTree) ? modulesTree : [];

            setAllowedRoutes(allowed);
            setCatalogRoutes(catalog);
            setMyModules(tree);
            setModulesAccessReady(true);
            return { allowed, catalog, tree };
        } catch (error) {
            console.warn('Chargement carte d\'accès modules impossible', error);
            setAllowedRoutes([]);
            setCatalogRoutes([]);
            setMyModules([]);
            setModulesAccessReady(true);
            return { allowed: [], catalog: [], tree: [] };
        }
    };

    const fetchUserData = async (token) => {
        try {
            const profileResponse = await axios.get(urlApi('/me/profile'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const profile = profileResponse.data;

            const userData = {
                id: profile.userId,
                username: profile.userName,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                roleId: profile.roleId,
                roleTitle: profile.roleTitle,
                employeeId: profile.employeeId,
                registrationNumber: profile.registrationNumber,
                departmentName: profile.departmentName
            };

            const permissions = profile.permissions || [];
            const modules = profile.visibleModules || [];

            if (!Array.isArray(permissions)) {
                console.error('Format de permissions invalide');
                throw new Error('Format de permissions invalide');
            }

            setUser(userData);
            setUserPermissions(permissions);
            setUserRole(profile.roleTitle);
            setVisibleModules(modules);

            const access = await loadModuleAccess();

            localStorage.setItem('userProfile', JSON.stringify({
                ...userData,
                permissions,
                visibleModules: modules,
                allowedRoutes: access.allowed,
                catalogRoutes: access.catalog
            }));

            return true;
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur', error);
            return false;
        }
    };

    const initializeUser = async () => {
        setLoading(true);

        const token = localStorage.getItem('token');

        if (!token || !isTokenValid(token)) {
            clearUserData();
            setModulesAccessReady(true);
            setLoading(false);
            setIsInitialized(true);
            return;
        }

        const success = await fetchUserData(token);
        if (!success) {
            clearUserData();
            setModulesAccessReady(true);
        }

        setLoading(false);
        setIsInitialized(true);
    };

    useEffect(() => {
        initializeUser();
    }, []);

    const hasPermission = (permission) => {
        if (!Array.isArray(userPermissions)) {
            return false;
        }

        return userPermissions.some(p => {
            const permName = typeof p === 'string' ? p : p?.name;
            return permName === permission;
        });
    };

    const canAccessRoute = useCallback((pathname) => {
        if (!modulesAccessReady) return true;
        return checkRouteAccess(pathname, allowedRoutes, catalogRoutes);
    }, [modulesAccessReady, allowedRoutes, catalogRoutes]);

    const logout = () => {
        clearUserData();
    };

    const refreshPermissions = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUserPermissions([]);
            return;
        }

        try {
            const profileResponse = await axios.get(urlApi('/me/profile'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const profile = profileResponse.data;
            const permissions = profile.permissions || [];

            if (Array.isArray(permissions)) {
                setUserPermissions(permissions);
                setVisibleModules(profile.visibleModules || []);
                const access = await loadModuleAccess();
                const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
                stored.permissions = permissions;
                stored.visibleModules = profile.visibleModules || [];
                stored.allowedRoutes = access.allowed;
                stored.catalogRoutes = access.catalog;
                localStorage.setItem('userProfile', JSON.stringify(stored));
            }
        } catch (error) {
            console.error('Erreur lors du rechargement des permissions', error);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            userRole,
            userPermissions,
            visibleModules,
            myModules,
            allowedRoutes,
            catalogRoutes,
            modulesAccessReady,
            loading,
            isInitialized,
            setUser,
            logout,
            hasPermission,
            canAccessRoute,
            initializeUser,
            refreshPermissions
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export { useUser };
