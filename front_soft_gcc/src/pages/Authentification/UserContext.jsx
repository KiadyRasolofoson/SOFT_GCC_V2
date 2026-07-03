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
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fonction pour nettoyer toutes les données utilisateur
    const clearUserData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userPermissions');
        setUser(null);
        setUserRole(null);
        setUserPermissions([]);
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

    // Fonction pour récupérer les données utilisateur
    const fetchUserData = async (token) => {
        try {
            // Récupération des informations de l'utilisateur
            const userResponse = await axios.get(urlApi("/Authentification/current-user"), {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const userData = userResponse.data;

            // Récupération des permissions
            const permissionsResponse = await axios.get(urlApi(`/Permission/user/${userData.id}`), {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const permissions = permissionsResponse.data;

            if (!Array.isArray(permissions)) {
                console.error("Format de permissions invalide");
                throw new Error("Format de permissions invalide");
            }

            // Attribution du rôle
            let roleTitle;
            switch (userData.roleId) {
                case 1:
                    roleTitle = "RH";
                    break;
                case 2:
                    roleTitle = "Manager";
                    break;
                case 3:
                    roleTitle = "Director";
                    break;
                default:
                    roleTitle = "Unknown";
                    break;
            }

            // Mise à jour des états
            setUser({ ...userData, roleTitle });
            setUserPermissions(permissions);
            setUserRole(roleTitle);

            // Stockage dans le localStorage
            localStorage.setItem('userData', JSON.stringify({ ...userData, roleTitle }));
            localStorage.setItem('userPermissions', JSON.stringify(permissions));

            return true;
        } catch (error) {
            console.error("Erreur lors de la récupération des données utilisateur", error);
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
        
        return userPermissions.some(p => p.name === permission);
    };

    //  déconnexion
    const logout = () => {
        clearUserData();
    };

    const refreshPermissions = async () => {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (!token || !userData?.id) {
            setUserPermissions([]);
            return;
        }

        try {
            const response = await axios.get(urlApi(`/Permission/user/${userData.id}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setUserPermissions(response.data);
                localStorage.setItem('userPermissions', JSON.stringify(response.data));
            } else {
                console.error("Format de données invalide lors du rechargement des permissions");
                // Conserver les permissions existantes en cas d'erreur
                const existingPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
                setUserPermissions(existingPermissions);
            }
        } catch (error) {
            console.error('Erreur lors du rechargement des permissions', error);
            // Conserver les permissions existantes en cas d'erreur
            const existingPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
            setUserPermissions(existingPermissions);
        }
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            userRole, 
            userPermissions, 
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