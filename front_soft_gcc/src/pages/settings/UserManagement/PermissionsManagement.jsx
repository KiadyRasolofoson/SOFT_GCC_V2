import { useState, useEffect } from 'react';
import Template from '../../Template';
import axios from 'axios';
import { FaPlus, FaSave, FaTimes, FaChevronDown, FaChevronRight, FaSearch, FaUserLock } from 'react-icons/fa';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-hot-toast';

function PermissionsManagement() {
    const { hasPermission } = useUser();
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentPermission, setCurrentPermission] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [tempPermissions, setTempPermissions] = useState([]);
    const [permissionsByModule, setPermissionsByModule] = useState({});
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleSelectAll, setModuleSelectAll] = useState({});

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://localhost:7082/api/Permission');
            setPermissions(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des permissions:', error);
            toast.error('Erreur lors de la récupération des permissions');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('https://localhost:7082/api/Role');
            const normalizedRoles = response.data.map(role => ({
                roleId: role.roleid,
                title: role.title,
                state: role.state
            }));
            setRoles(normalizedRoles);
        } catch (error) {
            console.error('Erreur lors de la récupération des rôles:', error);
            toast.error('Erreur lors de la récupération des rôles');
        }
    };

    useEffect(() => {
        fetchPermissions();
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            fetchRolePermissions(selectedRole.roleId);
        }
    }, [selectedRole]);

    useEffect(() => {
        const grouped = {};
        permissions.forEach(permission => {
            const module = permission.module || 'Autre';
            if (!grouped[module]) {
                grouped[module] = [];
            }
            grouped[module].push(permission);
        });
        
        setPermissionsByModule(grouped);
        
        const initialExpanded = {};
        Object.keys(grouped).forEach(module => {
            initialExpanded[module] = true;
        });
        setExpandedModules(initialExpanded);
        
        updateModuleSelectAllState(grouped, tempPermissions);
    }, [permissions, tempPermissions]);

    const updateModuleSelectAllState = (modules, selectedPermissions) => {
        const selectAllState = {};
        Object.keys(modules).forEach(module => {
            const modulePermissions = modules[module];
            const modulePermissionIds = modulePermissions.map(p => p.permissionId);
            const allSelected = modulePermissionIds.every(id => 
                selectedPermissions.some(p => p.permissionId === id)
            );
            selectAllState[module] = allSelected;
        });
        setModuleSelectAll(selectAllState);
    };

    if (!hasPermission('MANAGE_PERMISSIONS')) {
        return (
            <Template>
                <div className="container mt-4">
                    <div className="alert alert-danger">
                        <h4>Accès non autorisé</h4>
                        <p>Cette section est réservée aux administrateurs système uniquement.</p>
                    </div>
                </div>
            </Template>
        );
    }

    const fetchRolePermissions = async (roleId) => {
        try {
            const response = await axios.get(`https://localhost:7082/api/Permission/role/${roleId}`);
            if (response.data && Array.isArray(response.data)) {
            setRolePermissions(response.data);
            setTempPermissions(response.data);
            setIsEditing(false);
                const newModuleSelectAll = {};
                Object.keys(permissionsByModule).forEach(module => {
                    const modulePermissions = permissionsByModule[module] || [];
                    const modulePermissionIds = modulePermissions.map(p => p.permissionId);
                    const allSelected = modulePermissionIds.every(id => 
                        response.data.some(p => p.permissionId === id)
                    );
                    newModuleSelectAll[module] = allSelected;
                });
                setModuleSelectAll(newModuleSelectAll);
            } else {
                console.error('Format de données invalide reçu:', response.data);
                toast.error('Format de données invalide reçu du serveur');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des permissions du rôle:', error);
            toast.error('Erreur lors de la récupération des permissions du rôle');
        }
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setIsEditing(false);
        setTempPermissions([]);
        const initialModuleSelectAll = {};
        Object.keys(permissionsByModule).forEach(module => {
            initialModuleSelectAll[module] = false;
        });
        setModuleSelectAll(initialModuleSelectAll);
        if (role) {
            fetchRolePermissions(role.roleId);
        }
    };

    const handlePermissionToggle = (permissionId) => {
        if (!isEditing) {
            setIsEditing(true);
        }
        
        const isCurrentlyAssigned = tempPermissions.some(p => p.permissionId === permissionId);
        let updatedPermissions;
        
        if (isCurrentlyAssigned) {
            updatedPermissions = tempPermissions.filter(p => p.permissionId !== permissionId);
        } else {
            const permissionToAdd = permissions.find(p => p.permissionId === permissionId);
            if (permissionToAdd) {
                updatedPermissions = [...tempPermissions, permissionToAdd];
            } else {
                console.error('Permission non trouvée:', permissionId);
                return;
            }
        }
        
        setTempPermissions(updatedPermissions);
        updateModuleSelectAllState(permissionsByModule, updatedPermissions);
    };

    const handleModuleToggle = (module) => {
        if (!isEditing) {
            setIsEditing(true);
        }
        
        const newSelectAllState = !moduleSelectAll[module];
        setModuleSelectAll({
            ...moduleSelectAll,
            [module]: newSelectAllState
        });
        
        const modulePermissions = permissionsByModule[module] || [];
        let updatedPermissions = [...tempPermissions];
        
        if (newSelectAllState) {
            modulePermissions.forEach(permission => {
                if (!updatedPermissions.some(p => p.permissionId === permission.permissionId)) {
                    updatedPermissions.push(permission);
                }
            });
        } else {
            updatedPermissions = updatedPermissions.filter(permission =>
                !modulePermissions.some(p => p.permissionId === permission.permissionId)
            );
        }
        
        setTempPermissions(updatedPermissions);
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) {
            toast.error('Veuillez sélectionner un rôle avant de modifier les permissions.');
            return;
        }

        try {
            const permissionIds = tempPermissions.map(p => p.permissionId);
            await axios.put(
                `https://localhost:7082/api/Permission/role/${selectedRole.roleId}`,
                { permissionIds },
                { headers: { 'Content-Type': 'application/json' } }
            );
            
            await fetchRolePermissions(selectedRole.roleId);
            setIsEditing(false);
            toast.success('Permissions mises à jour avec succès');
        } catch (error) {
            console.error('Erreur lors de la mise à jour des permissions:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour des permissions');
        }
    };

    const handleCancelEdit = () => {
        setTempPermissions(rolePermissions);
        setIsEditing(false);
        updateModuleSelectAllState(permissionsByModule, rolePermissions);
    };

    const formatPermissionName = (name) => {
        if (!name || typeof name !== 'string') return '';
        const parts = name.split('_');
        return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
    };

    const getFilteredModules = () => {
        if (!searchQuery.trim()) {
            return permissionsByModule;
        }
        
        const filtered = {};
        const search = searchQuery.toLowerCase().trim();
        
        Object.keys(permissionsByModule).forEach(module => {
            const filteredPermissions = permissionsByModule[module].filter(permission => 
                permission.name.toLowerCase().includes(search) || 
                (permission.description && permission.description.toLowerCase().includes(search))
            );
            
            if (filteredPermissions.length > 0) {
                filtered[module] = filteredPermissions;
            }
        });
        
        return filtered;
    };

    const filteredModules = getFilteredModules();

    return (
        <Template>
            <div className="container-fluid px-4">
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h1 className="h3 mb-2 text-primary fw-bold">
                            <FaUserLock className="mr-2 mb-1" /> Gestion des Accès
                        </h1>
                        <p className="text-muted">Gérez les permissions attribuées aux différents rôles du système</p>
                    </div>
                        <button
                        className="btn btn-primary shadow-sm d-flex align-items-center"
                            onClick={() => {
                            setFormData({ name: '', description: '' });
                            setCurrentPermission(null);
                                setShowModal(true);
                            }}
                        >
                            <FaPlus className="me-2" /> Nouvelle Permission
                        </button>
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 fw-bold text-primary d-flex align-items-center">
                                    Sélectionner un rôle
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="select-wrapper">
                            <select
                                        className="form-select custom-select"
                                value={selectedRole?.roleId || ''}
                                onChange={(e) => {
                                    const role = roles.find(r => r.roleId === parseInt(e.target.value));
                                    handleRoleSelect(role);
                                }}
                            >
                                <option value="">Choisir un rôle...</option>
                                {roles.map((role) => (
                                    <option key={role.roleId} value={role.roleId}>
                                        {role.title}
                                    </option>
                                ))}
                            </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 fw-bold text-primary d-flex align-items-center">
                                    <FaSearch className="me-2" /> Rechercher
                                </h6>
                            </div>
                            <div className="card-body">
                            <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0">
                                        <FaSearch className="text-muted" />
                                    </span>
                                <input
                                    type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="Rechercher une permission..."
                                    value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedRole && (
                    <div className="card shadow-sm border-0 mb-4 bg-light">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="avatar-circle bg-primary text-white">
                                        <FaUserLock size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h5 className="fw-bold mb-1">Rôle en cours de traitement</h5>
                                    <div className="d-flex align-items-center">
                                        <span className="badge bg-primary fs-6 me-2">{selectedRole.title}</span>
                                        <span className="text-muted">Modification des permissions</span>
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="ms-auto">
                                        <div className="badge bg-warning text-dark p-2">
                                            Modifications non enregistrées
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <style>{`
                            .avatar-circle {
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                        `}</style>
                    </div>
                )}

                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h6 className="m-0 fw-bold text-primary d-flex align-items-center">
                            {selectedRole ? (
                                <>Permissions du rôle: <span className="badge bg-primary ms-2">{selectedRole.title}</span></>
                            ) : (
                                'Veuillez sélectionner un rôle'
                            )}
                        </h6>
                        {isEditing && (
                            <div className="d-flex">
                                <button className="btn btn-success me-2 d-flex align-items-center" onClick={handleSavePermissions}>
                                                <FaSave className="me-2" /> Enregistrer
                                            </button>
                                <button className="btn btn-outline-secondary d-flex align-items-center" onClick={handleCancelEdit}>
                                                <FaTimes className="me-2" /> Annuler
                                            </button>
                                </div>
                            )}
                    </div>
                    <div className="card-body">
                            {loading ? (
                            <div className="text-center my-5 py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Chargement...</span>
                                        </div>
                                <p className="mt-3 text-muted">Chargement des permissions...</p>
                            </div>
                        ) : (
                            <div className="permissions-container">
                                {Object.keys(filteredModules).length === 0 ? (
                                    <div className="alert alert-info d-flex align-items-center">
                                        <FaSearch className="me-2" /> Aucune permission ne correspond à votre recherche.
                                    </div>
                                ) : (
                                    Object.keys(filteredModules).map(module => (
                                        <div key={module} className="module-section mb-3">
                                            <div 
                                                className="module-header d-flex align-items-center p-3 rounded"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setExpandedModules({
                                                    ...expandedModules,
                                                    [module]: !expandedModules[module]
                                                })}
                                            >
                                                <div className="form-check me-2">
                                                    <input
                                                        className="form-check-input custom-checkbox"
                                                        type="checkbox"
                                                        id={`module-${module}`}
                                                        checked={moduleSelectAll[module] || false}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleModuleToggle(module);
                                                        }}
                                                    />
                                                    <label 
                                                        className="form-check-label fw-bold" 
                                                        htmlFor={`module-${module}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {module}
                                                    </label>
                                                </div>
                                                <div className="ms-auto">
                                                    {expandedModules[module] ? 
                                                        <FaChevronDown className="text-primary" /> : 
                                                        <FaChevronRight className="text-primary" />
                                                    }
                                                </div>
                                            </div>
                                            
                                            {expandedModules[module] && (
                                                <div className="module-content mt-2 ms-4 p-3">
                                                    <div className="row">
                                                        {filteredModules[module].map(permission => (
                                                            <div key={permission.permissionId} className="col-md-4 mb-3">
                                                                <div className="permission-item d-flex align-items-center">
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input custom-checkbox"
                                                                            type="checkbox"
                                                                            id={`permission-${permission.permissionId}`}
                                                                            checked={tempPermissions.some(p => p.permissionId === permission.permissionId)}
                                                                            onChange={() => handlePermissionToggle(permission.permissionId)}
                                                                        />
                                                                        <label 
                                                                            className="form-check-label" 
                                                                            htmlFor={`permission-${permission.permissionId}`}
                                                                            title={permission.description}
                                                                        >
                                                                            {formatPermissionName(permission.name)}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showModal && (
                        <div className="modal fade show" style={{ display: 'block' }}>
                        <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                <div className="modal-header bg-white border-0">
                                    <h5 className="modal-title fw-bold text-primary">
                                        {currentPermission ? 'Modifier la permission' : 'Nouvelle permission'}
                                        </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        if (currentPermission) {
                                            await axios.put(
                                                `https://localhost:7082/api/Permission/${currentPermission.permissionId}`,
                                                { ...currentPermission, ...formData }
                                            );
                                        } else {
                                            await axios.post('https://localhost:7082/api/Permission', formData);
                                        }
                                        setShowModal(false);
                                        fetchPermissions();
                                        setFormData({ name: '', description: '' });
                                        setCurrentPermission(null);
                                        toast.success(currentPermission ? 'Permission modifiée avec succès' : 'Permission créée avec succès');
                                    } catch (error) {
                                        console.error('Erreur lors de l\'enregistrement:', error);
                                        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement de la permission');
                                    }
                                }}>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                            <label htmlFor="permissionName" className="form-label fw-semibold">Nom</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                id="permissionName"
                                                    value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            <small className="text-muted">Format recommandé: ACTION_RESSOURCE (ex: MANAGE_USERS)</small>
                                            </div>
                                            <div className="mb-3">
                                            <label htmlFor="permissionDescription" className="form-label fw-semibold">Description</label>
                                                <textarea
                                                    className="form-control"
                                                id="permissionDescription"
                                                    value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                            {currentPermission ? 'Modifier' : 'Créer'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                )}
                {showModal && <div className="modal-backdrop fade show"></div>}
            </div>
            
            <style>{`
                /* Styles généraux */
                .text-primary {
                    color:rgb(0, 0, 0) !important;
                }
                
                /* Styles des cartes */
                .card {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                
                /* Styles des boutons */
                .btn-primary {
                    background-color: #4e73df;
                    border-color: #4e73df;
                }
                .btn-primary:hover {
                    background-color: #2e59d9;
                    border-color: #2653d4;
                }
                .btn-success {
                    background-color: #1cc88a;
                    border-color: #1cc88a;
                }
                .btn-success:hover {
                    background-color: #17a673;
                    border-color: #169b6b;
                }
                
                /* Styles du dropdown custom */
                .select-wrapper {
                    position: relative;
                }
                .custom-select {
                    height: 48px;
                    appearance: none;
                    padding: 10px 15px;
                    background-color: white;
                    color: #5a5c69;
                    border: 1px solid #d1d3e2;
                    border-radius: 0.35rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                
                /* Styles des modules */
                .module-section {
                    overflow: hidden;
                }
                .module-header {
                    background-color: #f8f9fc;
                    transition: all 0.2s ease;
                    border-left: 4px solid #4e73df;
                }
                .module-header:hover {
                    background-color: #eaecf4;
                }
                .module-content {
                    background-color: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                }
                
                /* Styles des checkboxes */
                .custom-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                .form-check-input:checked {
                    background-color: #4e73df;
                    border-color: #4e73df;
                }
                
                /* Styles des éléments de permission */
                .permission-item {
                    padding: 5px;
                    border-radius: 0.25rem;
                    transition: background-color 0.2s;
                }
                .permission-item:hover {
                    background-color: #f8f9fc;
                }
                
                /* Styles du champ de recherche */
                .input-group .input-group-text {
                    border-color: #d1d3e2;
                }
                .input-group .form-control {
                    border-color: #d1d3e2;
                }
                .input-group .form-control:focus {
                    border-color: #bac8f3;
                    box-shadow: 0 0 0 0.25rem rgba(78, 115, 223, 0.25);
                }
                
                /* Styles du modal */
                .modal-content {
                    border-radius: 0.5rem;
                    border: none;
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                }
                .modal-header .btn-close:focus {
                    box-shadow: none;
                }
                
                /* Styles des badges */
                .badge.bg-primary {
                    background-color: #4e73df !important;
                    padding: 0.5em 0.75em;
                }
                
                /* Styles d'espacement */
                .permissions-container {
                    padding: 1rem 0;
                }
            `}</style>
        </Template>
    );
}

export default PermissionsManagement; 