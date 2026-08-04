import { urlApi } from '../helpers/utils';
import axios from 'axios';

/**
 * Service frontend pour la gestion des modules/pages de l'application.
 * Appelle les endpoints /api/Module et /api/Permission.
 */

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Récupère tous les modules (arbre complet : parents + enfants)
 */
export const getAllModules = async () => {
    const response = await axios.get(urlApi('/Module'), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère les modules avec leurs permissions incluses (pour l'UI admin)
 */
export const getModulesWithPermissions = async () => {
    const response = await axios.get(urlApi('/Module/with-permissions'), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère un module par son ID
 */
export const getModuleById = async (id) => {
    const response = await axios.get(urlApi(`/Module/${id}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Crée un nouveau module
 */
export const createModule = async (moduleData) => {
    const response = await axios.post(urlApi('/Module'), moduleData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
};

/**
 * Met à jour un module existant
 */
export const updateModule = async (id, moduleData) => {
    const response = await axios.put(urlApi(`/Module/${id}`), moduleData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
};

/**
 * Supprime un module (soft delete)
 */
export const deleteModule = async (id) => {
    const response = await axios.delete(urlApi(`/Module/${id}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère les modules assignés à un rôle
 */
export const getRoleModules = async (roleId) => {
    const response = await axios.get(urlApi(`/Module/role/${roleId}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Met à jour les modules d'un rôle (remplace tout)
 */
export const updateRoleModules = async (roleId, moduleIds) => {
    const response = await axios.put(urlApi(`/Module/role/${roleId}`), 
        { moduleIds },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
    );
    return response.data;
};

/**
 * Récupère les modules visibles pour l'utilisateur connecté (menu dynamique)
 */
export const getMyModules = async () => {
    const response = await axios.get(urlApi('/Module/my-modules'), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère toutes les permissions
 */
export const getAllPermissions = async () => {
    const response = await axios.get(urlApi('/Permission'), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère les permissions d'un module spécifique
 */
export const getPermissionsByModule = async (moduleId) => {
    const response = await axios.get(urlApi(`/Permission/by-module/${moduleId}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Récupère les permissions d'un rôle
 */
export const getRolePermissions = async (roleId) => {
    const response = await axios.get(urlApi(`/Permission/role/${roleId}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Met à jour les permissions d'un rôle
 */
export const updateRolePermissions = async (roleId, permissionIds) => {
    const response = await axios.put(urlApi(`/Permission/role/${roleId}`),
        { permissionIds },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
    );
    return response.data;
};

/**
 * Récupère tous les rôles
 */
export const getAllRoles = async () => {
    const response = await axios.get(urlApi('/Role'), {
        headers: getAuthHeaders()
    });
    // Normaliser les clés (roleid → roleId)
    return response.data.map(role => ({
        roleId: role.roleid,
        title: role.title,
        state: role.state
    }));
};

/**
 * Crée un rôle
 */
export const createRole = async (roleData) => {
    const response = await axios.post(urlApi('/Role'), roleData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
};

/**
 * Met à jour un rôle
 */
export const updateRole = async (id, roleData) => {
    const response = await axios.put(urlApi(`/Role/${id}`), roleData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
};

/**
 * Supprime un rôle
 */
export const deleteRole = async (id) => {
    const response = await axios.delete(urlApi(`/Role/${id}`), {
        headers: getAuthHeaders()
    });
    return response.data;
};
