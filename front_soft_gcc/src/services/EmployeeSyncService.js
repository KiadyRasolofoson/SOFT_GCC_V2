import api from '../helpers/api';

/**
 * Service de synchronisation des employés T_SAL (p_sw) → Employee (Soft_GCC).
 */

// Déclencher une synchronisation
export const runSync = async () => {
    const response = await api.post('/EmployeeSync/run');
    return response.data;
};

// Récupérer l'historique des synchronisations
export const getSyncLogs = async (page = 1, pageSize = 20) => {
    const response = await api.get('/EmployeeSync/logs', {
        params: { page, pageSize }
    });
    return response.data;
};
