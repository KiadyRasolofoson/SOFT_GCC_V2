import React, { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-hot-toast';
import {
    getAllModules, getModulesWithPermissions, createModule, updateModule, deleteModule,
    getRoleModules, updateRoleModules,
    getAllPermissions, getRolePermissions, updateRolePermissions,
    getAllRoles, createRole, updateRole as updateRoleApi, deleteRole as deleteRoleApi
} from '../../../services/ModuleService';
import {
    FaUserShield, FaCubes, FaLock, FaPlus, FaSave, FaTimes, FaEdit, FaTrash,
    FaChevronDown, FaChevronRight, FaSearch, FaCheckSquare, FaSquare
} from 'react-icons/fa';

// =============================================================================
// AdminAccessManagement — Interface d'administration unifiée
// =============================================================================
function AdminAccessManagement() {
    const { hasPermission } = useUser();
    const [activeTab, setActiveTab] = useState('roles');

    if (!hasPermission('MANAGE_PERMISSIONS')) {
        return (
            <Template>
                <div className="container mt-4">
                    <div className="alert alert-danger">
                        <h4><FaUserShield className="me-2" />Accès non autorisé</h4>
                        <p>Cette section est réservée aux administrateurs système uniquement.</p>
                    </div>
                </div>
            </Template>
        );
    }

    return (
        <Template>
            <div className="container-fluid mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="mb-0">
                        <FaUserShield className="me-2 text-primary" />
                        Gestion des Accès & Permissions
                    </h3>
                </div>

                {/* Onglets */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`}
                            onClick={() => setActiveTab('roles')}
                        >
                            <FaUserShield className="me-1" /> Rôles & Profils
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'modules' ? 'active' : ''}`}
                            onClick={() => setActiveTab('modules')}
                        >
                            <FaCubes className="me-1" /> Modules & Pages
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'permissions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('permissions')}
                        >
                            <FaLock className="me-1" /> Permissions
                        </button>
                    </li>
                </ul>

                {/* Contenu des onglets */}
                {activeTab === 'roles' && <RolesTab />}
                {activeTab === 'modules' && <ModulesTab />}
                {activeTab === 'permissions' && <PermissionsTab />}
            </div>
        </Template>
    );
}

// =============================================================================
// Onglet 1 : Rôles & Profils
// =============================================================================
function RolesTab() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ title: '', state: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleModules, setRoleModules] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [allModules, setAllModules] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [showAccessPanel, setShowAccessPanel] = useState(false);
    const [selectedModuleIds, setSelectedModuleIds] = useState([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [rolesData, modulesData, permissionsData] = await Promise.all([
                getAllRoles(),
                getAllModules(),
                getAllPermissions()
            ]);
            setRoles(rolesData);
            setAllModules(modulesData);
            setAllPermissions(permissionsData);
        } catch (err) {
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setShowAccessPanel(true);
        try {
            const [modules, permissions] = await Promise.all([
                getRoleModules(role.roleId),
                getRolePermissions(role.roleId)
            ]);
            setRoleModules(modules);
            setRolePermissions(permissions);
            setSelectedModuleIds(modules.map(m => m.moduleId));
            setSelectedPermissionIds(permissions.map(p => p.permissionId));
        } catch {
            setRoleModules([]);
            setRolePermissions([]);
            setSelectedModuleIds([]);
            setSelectedPermissionIds([]);
        }
    };

    const handleSaveAccess = async () => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            await Promise.all([
                updateRoleModules(selectedRole.roleId, selectedModuleIds),
                updateRolePermissions(selectedRole.roleId, selectedPermissionIds)
            ]);
            toast.success('Accès mis à jour avec succès !');
            setShowAccessPanel(false);
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const toggleModuleId = (id) => {
        setSelectedModuleIds(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const togglePermissionId = (id) => {
        setSelectedPermissionIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRoleApi(editingRole.roleId, { title: formData.title, state: formData.state });
                toast.success('Rôle mis à jour');
            } else {
                await createRole({ title: formData.title, state: 1 });
                toast.success('Rôle créé');
            }
            setShowModal(false);
            setEditingRole(null);
            setFormData({ title: '', state: 1 });
            fetchData();
        } catch {
            toast.error('Erreur lors de l\'enregistrement du rôle');
        }
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm(`Supprimer le rôle "${role.title}" ?`)) return;
        try {
            await deleteRoleApi(role.roleId);
            toast.success('Rôle supprimé');
            fetchData();
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const openEditModal = (role) => {
        setEditingRole(role);
        setFormData({ title: role.title, state: role.state });
        setShowModal(true);
    };

    const groupedPermissions = () => {
        const groups = {};
        allPermissions.forEach(p => {
            const mod = p.moduleName || 'Autre';
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(p);
        });
        return groups;
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

    return (
        <div className="row">
            {/* Liste des rôles */}
            <div className="col-md-5">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Rôles</h5>
                        <button className="btn btn-primary btn-sm" onClick={() => { setEditingRole(null); setFormData({ title: '', state: 1 }); setShowModal(true); }}>
                            <FaPlus className="me-1" /> Nouveau
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="input-group mb-3">
                            <span className="input-group-text"><FaSearch /></span>
                            <input type="text" className="form-control" placeholder="Rechercher un rôle..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="list-group">
                            {roles.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(role => (
                                <div key={role.roleId}
                                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedRole?.roleId === role.roleId ? 'active' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div onClick={() => handleSelectRole(role)} className="flex-grow-1">
                                        <strong>{role.title}</strong>
                                        <span className={`badge ms-2 ${role.state === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                            {role.state === 1 ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div>
                                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); openEditModal(role); }}>
                                            <FaEdit />
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Panneau d'accès (modules + permissions) */}
            <div className="col-md-7">
                {showAccessPanel && selectedRole ? (
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                            <h5 className="mb-0">
                                <FaUserShield className="me-2" />
                                Configurer l'accès : <strong>{selectedRole.title}</strong>
                            </h5>
                            <div>
                                <button className="btn btn-light btn-sm me-2" onClick={handleSaveAccess} disabled={saving}>
                                    <FaSave className="me-1" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                                </button>
                                <button className="btn btn-outline-light btn-sm" onClick={() => setShowAccessPanel(false)}>
                                    <FaTimes className="me-1" /> Fermer
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <h6><FaCubes className="me-1" /> Modules visibles dans le menu</h6>
                            <div className="row mb-4">
                                {allModules.filter(m => !m.parentModuleId).map(mod => (
                                    <div key={mod.moduleId} className="col-md-6 mb-2">
                                        <label className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" className="form-check-input me-2"
                                                checked={selectedModuleIds.includes(mod.moduleId)}
                                                onChange={() => toggleModuleId(mod.moduleId)} />
                                            <span>{mod.displayName}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <hr />
                            <h6><FaLock className="me-1" /> Permissions détaillées</h6>
                            {Object.entries(groupedPermissions()).map(([module, perms]) => (
                                <div key={module} className="mb-3">
                                    <strong className="text-muted small text-uppercase">{module}</strong>
                                    <div className="row mt-1">
                                        {perms.map(perm => (
                                            <div key={perm.permissionId} className="col-md-6 mb-1">
                                                <label className="d-flex align-items-center small" style={{ cursor: 'pointer' }}>
                                                    <input type="checkbox" className="form-check-input me-2"
                                                        checked={selectedPermissionIds.includes(perm.permissionId)}
                                                        onChange={() => togglePermissionId(perm.permissionId)} />
                                                    <span>{formatPermName(perm.name)}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body text-center text-muted py-5">
                            <FaUserShield size={48} className="mb-3" />
                            <h5>Sélectionnez un rôle à gauche</h5>
                            <p>Pour configurer les modules et permissions accessibles à ce profil.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal CRUD Rôle */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleSaveRole}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Nom du rôle</label>
                                        <input type="text" className="form-control" required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">État</label>
                                        <select className="form-select" value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: parseInt(e.target.value) })}>
                                            <option value={1}>Actif</option>
                                            <option value={0}>Inactif</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">
                                        <FaSave className="me-1" /> {editingRole ? 'Mettre à jour' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Onglet 2 : Modules & Pages
// =============================================================================
function ModulesTab() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [formData, setFormData] = useState({ name: '', displayName: '', icon: '', route: '', parentModuleId: null, sortOrder: 0, description: '' });
    const [expandedModules, setExpandedModules] = useState({});

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getModulesWithPermissions();
            setModules(data);
            const expanded = {};
            data.forEach(m => { expanded[m.moduleId] = true; });
            setExpandedModules(expanded);
        } catch {
            toast.error('Erreur lors du chargement des modules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchModules(); }, [fetchModules]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await updateModule(editingModule.moduleId, { ...formData, moduleId: editingModule.moduleId, state: 1 });
                toast.success('Module mis à jour');
            } else {
                await createModule({ ...formData, state: 1 });
                toast.success('Module créé');
            }
            setShowModal(false);
            setEditingModule(null);
            fetchModules();
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async (mod) => {
        if (!window.confirm(`Supprimer le module "${mod.displayName}" ?`)) return;
        try {
            await deleteModule(mod.moduleId);
            toast.success('Module supprimé');
            fetchModules();
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const openCreate = (parentId = null) => {
        setEditingModule(null);
        setFormData({ name: '', displayName: '', icon: '', route: '', parentModuleId: parentId, sortOrder: 0, description: '' });
        setShowModal(true);
    };

    const openEdit = (mod) => {
        setEditingModule(mod);
        setFormData({
            name: mod.name,
            displayName: mod.displayName,
            icon: mod.icon || '',
            route: mod.route || '',
            parentModuleId: mod.parentModuleId,
            sortOrder: mod.sortOrder,
            description: mod.description || ''
        });
        setShowModal(true);
    };

    const toggleExpand = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderModuleRow = (mod, depth = 0) => (
        <React.Fragment key={mod.moduleId}>
            <tr>
                <td style={{ paddingLeft: `${depth * 24 + 8}px` }}>
                    {mod.childModules && mod.childModules.length > 0 && (
                        <span className="me-2" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(mod.moduleId)}>
                            {expandedModules[mod.moduleId] ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                    )}
                    <i className={mod.icon || 'mdi mdi-circle'} />{' '}
                    <strong>{mod.displayName}</strong>
                    <br /><small className="text-muted">{mod.name}</small>
                </td>
                <td><code>{mod.route || '-'}</code></td>
                <td>
                    <span className="badge bg-info me-1">{mod.permissions?.length || 0} permissions</span>
                    {mod.childModules?.length > 0 && <span className="badge bg-secondary">{mod.childModules.length} enfants</span>}
                </td>
                <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(mod)}><FaEdit /></button>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openCreate(mod.moduleId)}><FaPlus /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(mod)}><FaTrash /></button>
                </td>
            </tr>
            {mod.childModules && expandedModules[mod.moduleId] &&
                mod.childModules.map(child => renderModuleRow(child, depth + 1))
            }
        </React.Fragment>
    );

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0"><FaCubes className="me-2" />Arborescence des modules</h5>
                <button className="btn btn-primary" onClick={() => openCreate(null)}>
                    <FaPlus className="me-1" /> Nouveau module racine
                </button>
            </div>
            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Module</th>
                                <th>Route</th>
                                <th>Stats</th>
                                <th style={{ width: 160 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(mod => renderModuleRow(mod))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CRUD Module */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingModule ? 'Modifier le module' : 'Nouveau module'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Clé interne (name) *</label>
                                            <input type="text" className="form-control" required
                                                value={formData.name} placeholder="ex: evaluations"
                                                onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Nom affiché (displayName) *</label>
                                            <input type="text" className="form-control" required
                                                value={formData.displayName} placeholder="ex: Évaluations"
                                                onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Icône (classe MDI)</label>
                                            <input type="text" className="form-control"
                                                value={formData.icon} placeholder="ex: mdi mdi-clipboard-check"
                                                onChange={e => setFormData({ ...formData, icon: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Route par défaut</label>
                                            <input type="text" className="form-control"
                                                value={formData.route} placeholder="ex: /soft-gcc/evaluations/liste"
                                                onChange={e => setFormData({ ...formData, route: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Module parent</label>
                                            <select className="form-select" value={formData.parentModuleId || ''}
                                                onChange={e => setFormData({ ...formData, parentModuleId: e.target.value ? parseInt(e.target.value) : null })}>
                                                <option value="">Aucun (racine)</option>
                                                {modules.map(m => (
                                                    <option key={m.moduleId} value={m.moduleId}>{m.displayName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Ordre d'affichage</label>
                                            <input type="number" className="form-control"
                                                value={formData.sortOrder}
                                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea className="form-control" rows={2}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">
                                        <FaSave className="me-1" /> {editingModule ? 'Mettre à jour' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Onglet 3 : Permissions
// =============================================================================
function PermissionsTab() {
    const [permissions, setPermissions] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPerm, setEditingPerm] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', moduleId: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedModules, setExpandedModules] = useState({});

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [perms, mods] = await Promise.all([
                getAllPermissions(),
                getAllModules()
            ]);
            setPermissions(perms);
            setModules(mods);
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Grouper par moduleName
    const grouped = () => {
        const groups = {};
        permissions
            .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach(p => {
                const mod = p.moduleName || 'Sans module';
                if (!groups[mod]) groups[mod] = [];
                groups[mod].push(p);
            });
        // Expand all
        if (Object.keys(expandedModules).length === 0) {
            const exp = {};
            Object.keys(groups).forEach(k => { exp[k] = true; });
            setExpandedModules(exp);
        }
        return groups;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const axios = (await import('axios')).default;
            const { urlApi } = await import('../../../helpers/utils');
            const headers = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
            if (editingPerm) {
                await axios.put(urlApi(`/Permission/${editingPerm.permissionId}`), {
                    permissionId: editingPerm.permissionId, name: formData.name,
                    description: formData.description, moduleId: formData.moduleId
                }, { headers });
                toast.success('Permission mise à jour');
            } else {
                await axios.post(urlApi('/Permission'), {
                    name: formData.name, description: formData.description, moduleId: formData.moduleId
                }, { headers });
                toast.success('Permission créée');
            }
            setShowModal(false);
            setEditingPerm(null);
            fetchData();
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const openEdit = (perm) => {
        setEditingPerm(perm);
        setFormData({ name: perm.name, description: perm.description, moduleId: perm.moduleId });
        setShowModal(true);
    };

    const toggleExpand = (mod) => {
        setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
    const permGroups = grouped();

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0"><FaLock className="me-2" />Permissions (groupées par module)</h5>
                <button className="btn btn-primary" onClick={() => { setEditingPerm(null); setFormData({ name: '', description: '', moduleId: null }); setShowModal(true); }}>
                    <FaPlus className="me-1" /> Nouvelle permission
                </button>
            </div>

            <div className="input-group mb-3">
                <span className="input-group-text"><FaSearch /></span>
                <input type="text" className="form-control" placeholder="Rechercher une permission..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {Object.entries(permGroups).map(([module, perms]) => (
                <div key={module} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center" style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        onClick={() => toggleExpand(module)}>
                        <strong>
                            {expandedModules[module] ? <FaChevronDown className="me-2" /> : <FaChevronRight className="me-2" />}
                            <FaCubes className="me-2 text-primary" />{module}
                            <span className="badge bg-secondary ms-2">{perms.length}</span>
                        </strong>
                    </div>
                    {expandedModules[module] && (
                        <div className="card-body">
                            <div className="row">
                                {perms.map(perm => (
                                    <div key={perm.permissionId} className="col-md-6 mb-2">
                                        <div className="d-flex justify-content-between align-items-center border rounded p-2">
                                            <div>
                                                <strong className="small">{formatPermName(perm.name)}</strong>
                                                <br /><small className="text-muted">{perm.description || 'Aucune description'}</small>
                                            </div>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(perm)}>
                                                <FaEdit />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Modal CRUD Permission */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingPerm ? 'Modifier la permission' : 'Nouvelle permission'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Nom *</label>
                                        <input type="text" className="form-control" required
                                            value={formData.name} placeholder="ex: MANAGE_USERS"
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-control" rows={2}
                                            value={formData.description} placeholder="Description de la permission..."
                                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Module associé</label>
                                        <select className="form-select" value={formData.moduleId || ''}
                                            onChange={e => setFormData({ ...formData, moduleId: e.target.value ? parseInt(e.target.value) : null })}>
                                            <option value="">Sans module</option>
                                            {modules.map(m => (
                                                <option key={m.moduleId} value={m.moduleId}>{m.displayName} ({m.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">
                                        <FaSave className="me-1" /> {editingPerm ? 'Mettre à jour' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Helpers
// =============================================================================
function formatPermName(name) {
    if (!name) return '';
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

export default AdminAccessManagement;
