import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types'; // Importer PropTypes
import { urlApi } from '../../helpers/utils';

const UserContext = createContext(null);

function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
    }
    return context;
}

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [visibleModules, setVisibleModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fonction pour nettoyer toutes les données utilisateur
    const clearUserData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        setUser(null);
        setUserRole(null);
        setUserPermissions([]);
        setVisibleModules([]);
        setIsInitialized(false);
    };

    // Fonction pour vérifier si le token est valide
    const isTokenValid = (token) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const isValid = payload.exp * 1000 > Date.now();
            return isValid;
        } catch (error) {
            console.error("Erreur lors de la vérification du token", error);
            return false;
        }
    };

    // Fonction pour récupérer les données utilisateur via le nouvel endpoint profil
    const fetchUserData = async (token) => {
        try {
            // Un seul appel : GET /api/me/profile (RBAC + ABAC + Profile)
            const profileResponse = await axios.get(urlApi("/me/profile"), {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const profile = profileResponse.data;

            // Extraction des données du profil
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
                console.error("Format de permissions invalide");
                throw new Error("Format de permissions invalide");
            }

            // Mise à jour des états
            setUser(userData);
            setUserPermissions(permissions);
            setUserRole(profile.roleTitle);
            setVisibleModules(modules);

            // Stockage dans le localStorage
            localStorage.setItem('userProfile', JSON.stringify({
                ...userData,
                permissions,
                visibleModules: modules
            }));

            return true;
        } catch (error) {
            console.error("Erreur lors de la récupération du profil utilisateur", error);
            return false;
        }
    };

    // Fonction d'initialisation qui peut être appelée après la connexion
    const initializeUser = async () => {
        setLoading(true);
        
        const token = localStorage.getItem('token');

        if (!token || !isTokenValid(token)) {
            clearUserData();
            setLoading(false);
            return;
        }

        const success = await fetchUserData(token);
        if (!success) {
            clearUserData();
        }

        setLoading(false);
        setIsInitialized(true);
    };

    useEffect(() => {
        initializeUser();
    }, []);

    //  vérifier si l'utilisateur a une permission spécifique
    const hasPermission = (permission) => {
        if (!Array.isArray(userPermissions)) {
            return false;
        }
        
        return userPermissions.some(p => {
            // Supporte à la fois les chaînes (nouveau profil) et les objets {name} (ancien format)
            const permName = typeof p === 'string' ? p : p?.name;
            return permName === permission;
        });
    };

    //  déconnexion
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
            // Recharger via le même endpoint profil
            const profileResponse = await axios.get(urlApi("/me/profile"), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const profile = profileResponse.data;
            const permissions = profile.permissions || [];

            if (Array.isArray(permissions)) {
                setUserPermissions(permissions);
                setVisibleModules(profile.visibleModules || []);
                // Mettre à jour le localStorage
                const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
                stored.permissions = permissions;
                stored.visibleModules = profile.visibleModules || [];
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
            loading, 
            isInitialized,
            setUser, 
            logout,
            hasPermission,
            initializeUser,
            refreshPermissions
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.propTypes = {
    children: PropTypes.node.isRequired // Valider que "children" est un élément React valide
};

export { useUser };