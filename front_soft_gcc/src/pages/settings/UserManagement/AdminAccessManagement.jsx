import React, { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import {
    getAllModules, getModulesWithPermissions, createModule, updateModule, deleteModule,
    getRoleModules, updateRoleModules,
    getAllPermissions, getRolePermissions, updateRolePermissions,
    getAllRoles, createRole, updateRole as updateRoleApi, deleteRole as deleteRoleApi
} from '../../../services/ModuleService';
import {
    FaUserShield, FaCubes, FaLock, FaPlus, FaSave, FaTimes, FaEdit, FaTrash,
    FaChevronDown, FaChevronRight, FaSearch, FaCheckSquare, FaSquare,
    FaFolderOpen, FaUserCheck, FaCheckCircle
} from 'react-icons/fa';
import './AdminAccessManagement.css';

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
                    <div className="alert alert-danger shadow-sm border-0 d-flex align-items-center gap-3 p-4 rounded-3">
                        <FaUserShield size={40} className="text-danger flex-shrink-0" />
                        <div>
                            <h4 className="alert-heading fw-bold mb-1">Accès non autorisé</h4>
                            <p className="mb-0 text-muted">Cette section est réservée aux administrateurs système uniquement.</p>
                        </div>
                    </div>
                </div>
            </Template>
        );
    }

    const tabs = [
        { id: 'roles', icon: <FaUserShield />, label: 'Rôles & Profils' },
        { id: 'modules', icon: <FaCubes />, label: 'Modules & Pages' },
        { id: 'permissions', icon: <FaLock />, label: 'Permissions' },
    ];

    return (
        <Template>
            <div className="admin-management-container px-2 py-3 px-md-4">
                {/* En-tête de page moderne */}
                <div className="admin-page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                            <i className="mdi mdi-shield-lock" style={{ fontSize: '24px' }} />
                        </div>
                        <div>
                            <h4 className="admin-header-title mb-1">Gestion des Accès &amp; Permissions</h4>
                            <p className="text-muted small mb-0">Administration globale des rôles, visibilités des modules et règles de permissions.</p>
                        </div>
                    </div>
                    
                    {/* Sélecteur d'onglets premium */}
                    <div>
                        <ul className="nav admin-custom-tabs">
                            {tabs.map(tab => (
                                <li key={tab.id} className="nav-item">
                                    <button 
                                        className={`nav-link admin-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contenu de l'onglet actif */}
                <div className="tab-content-wrapper">
                    {activeTab === 'roles' && <RolesTab />}
                    {activeTab === 'modules' && <ModulesTab />}
                    {activeTab === 'permissions' && <PermissionsTab />}
                </div>
            </div>
        </Template>
    );
}

// =============================================================================
// Onglet 1 : Rôles & Profils
// =============================================================================
function RolesTab() {
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ title: '', state: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [loadingAccess, setLoadingAccess] = useState(false);
    const [savingModules, setSavingModules] = useState(false);
    const [savingPerms, setSavingPerms] = useState(false);
    const [allModules, setAllModules] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedModuleIds, setSelectedModuleIds] = useState([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [popup, setPopup] = useState(null);

    const triggerPopup = (title, message) => {
        setPopup({ title, message, key: Date.now() });
        setTimeout(() => setPopup(null), 2500);
    };

    useEffect(() => {
        (async () => {
            try {
                setLoadingRoles(true);
                const [r, m, p] = await Promise.all([getAllRoles(), getAllModules(), getAllPermissions()]);
                setRoles(r);
                setAllModules(m || []);
                setAllPermissions(p || []);
                
                // Par défaut, ouvrir tous les modules de permissions
                const initialExpanded = {};
                if (p) {
                    p.forEach(perm => {
                        const mName = perm.moduleName || 'Autre';
                        initialExpanded[mName] = true;
                    });
                }
                setExpandedGroups(initialExpanded);
            } catch { 
                toast.error('Erreur lors du chargement des données'); 
            } finally { 
                setLoadingRoles(false); 
            }
        })();
    }, []);

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setLoadingAccess(true);
        setSelectedModuleIds([]);
        setSelectedPermissionIds([]);
        try {
            const [mods, perms] = await Promise.all([getRoleModules(role.roleId), getRolePermissions(role.roleId)]);
            setSelectedModuleIds(Array.isArray(mods) ? mods.map(m => m.moduleId) : []);
            setSelectedPermissionIds(Array.isArray(perms) ? perms.map(p => p.permissionId) : []);
        } catch { 
            setSelectedModuleIds([]); 
            setSelectedPermissionIds([]); 
        } finally { 
            setLoadingAccess(false); 
        }
    };

    const handleSaveModules = async () => {
        if (!selectedRole) return;
        setSavingModules(true);
        try {
            await updateRoleModules(selectedRole.roleId, [...selectedModuleIds]);
            triggerPopup('Modules enregistrés', selectedModuleIds.length + ' module(s) configuré(s) pour le rôle « ' + selectedRole.title + ' »');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde');
        } finally { 
            setSavingModules(false); 
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        setSavingPerms(true);
        try {
            await updateRolePermissions(selectedRole.roleId, [...selectedPermissionIds]);
            triggerPopup('Permissions enregistrées', selectedPermissionIds.length + ' permission(s) assignée(s) au rôle « ' + selectedRole.title + ' »');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde');
        } finally { 
            setSavingPerms(false); 
        }
    };

    const toggleModule = (id) => setSelectedModuleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const togglePermission = (id) => setSelectedPermissionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAllModules = () => {
        const rootIds = allModules.filter(m => !m.parentModuleId).map(m => m.moduleId);
        const allSel = rootIds.every(id => selectedModuleIds.includes(id));
        setSelectedModuleIds(prev => allSel ? prev.filter(id => !rootIds.includes(id)) : [...new Set([...prev, ...rootIds])]);
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRoleApi(editingRole.roleId, { title: roleForm.title, state: roleForm.state });
                triggerPopup('Rôle mis à jour', 'Les informations du rôle « ' + roleForm.title + ' » ont été modifiées.');
            } else {
                await createRole({ title: roleForm.title, state: 1 });
                triggerPopup('Rôle créé', 'Le nouveau rôle « ' + roleForm.title + ' » est maintenant actif.');
            }
            setShowRoleModal(false);
            setEditingRole(null);
            setRoleForm({ title: '', state: 1 });
            setRoles(await getAllRoles());
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Erreur lors de la configuration du rôle'); 
        }
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm('Voulez-vous vraiment supprimer le rôle "' + role.title + '" ? Cette action est irréversible.')) return;
        try {
            await deleteRoleApi(role.roleId);
            triggerPopup('Rôle supprimé', 'Le rôle « ' + role.title + ' » a été définitivement supprimé.');
            if (selectedRole?.roleId === role.roleId) setSelectedRole(null);
            setRoles(await getAllRoles());
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Erreur de suppression'); 
        }
    };

    const toggleGroupExpand = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const filteredRoles = roles.filter(r => (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const rootModules = allModules.filter(m => !m.parentModuleId);
    const rootIds = rootModules.map(m => m.moduleId);
    const modulesAllSelected = rootIds.length > 0 && rootIds.every(id => selectedModuleIds.includes(id));

    if (loadingRoles) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-3">Chargement des profils d'accès...</p>
            </div>
        );
    }

    // Grouper les permissions par module
    const permGroups = {};
    allPermissions.forEach(p => {
        const mod = p.moduleName || 'Autre';
        if (!permGroups[mod]) permGroups[mod] = [];
        permGroups[mod].push(p);
    });

    return (
        <>
        <div className="row g-4">
            {/* Colonne gauche : Rôles */}
            <div className="col-lg-4">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <strong><FaUserShield className="text-primary" />Rôles Système</strong>
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setEditingRole(null); setRoleForm({ title: '', state: 1 }); setShowRoleModal(true); }}>
                            <FaPlus /> Nouveau Rôle
                        </button>
                    </div>
                    
                    <div className="admin-card-body d-flex flex-column" style={{ minHeight: 0 }}>
                        <div className="admin-search-wrapper">
                            <input 
                                className="admin-search-input" 
                                placeholder="Rechercher un rôle..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                            <FaSearch className="admin-search-icon" />
                        </div>
                        
                        <div className="admin-scrollable-container flex-grow-1" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                            {filteredRoles.map(role => (
                                <div key={role.roleId}
                                    className={`admin-item-row ${selectedRole?.roleId === role.roleId ? 'active' : ''}`}
                                    onClick={() => handleSelectRole(role)}>
                                    <div>
                                        <div className="fw-bold mb-1">{role.title}</div>
                                        <span className={`admin-badge ${role.state === 1 ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                                            {role.state === 1 ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div className="actions-group d-flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button 
                                            className="btn btn-link p-1 text-decoration-none text-muted-hover"
                                            style={{ color: selectedRole?.roleId === role.roleId ? '#fff' : 'inherit' }}
                                            onClick={() => { setEditingRole(role); setRoleForm({ title: role.title, state: role.state ?? 1 }); setShowRoleModal(true); }}
                                            title="Modifier"
                                        >
                                            <FaEdit size={14} />
                                        </button>
                                        <button 
                                            className="btn btn-link p-1 text-decoration-none text-danger-hover"
                                            style={{ color: selectedRole?.roleId === role.roleId ? '#ffc9c9' : 'var(--admin-danger)' }}
                                            onClick={() => handleDeleteRole(role)}
                                            title="Supprimer"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredRoles.length === 0 && (
                                <div className="admin-empty-state">
                                    <FaUserShield className="admin-empty-icon" />
                                    <div className="admin-empty-title">Aucun rôle trouvé</div>
                                    <div className="admin-empty-desc small">Essayez d'ajuster vos filtres ou créez un nouveau rôle.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne droite : Accès & Modules */}
            <div className="col-lg-8">
                {!selectedRole ? (
                    <div className="admin-card">
                        <div className="admin-card-body d-flex flex-column align-items-center justify-content-center py-5">
                            <div className="p-4 bg-light rounded-circle mb-3">
                                <FaShieldAlt size={56} className="text-muted opacity-50" />
                            </div>
                            <h5 className="fw-bold text-center mb-1">Sélectionnez un rôle</h5>
                            <p className="text-muted small text-center max-w-320">
                                Cliquez sur l'un des rôles de l'arborescence de gauche pour configurer ses visibilités de modules et permissions associées.
                            </p>
                        </div>
                    </div>
                ) : loadingAccess ? (
                    <div className="admin-card">
                        <div className="admin-card-body d-flex flex-column align-items-center justify-content-center py-5">
                            <div className="spinner-border text-primary mb-3" role="status" />
                            <p className="text-muted small">Chargement des accréditations de <strong>{selectedRole.title}</strong>...</p>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {/* Modules de visibilité */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <strong><FaCubes className="text-primary" />Modules Visibles</strong>
                                <div className="d-flex gap-2">
                                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={toggleAllModules}>
                                        {modulesAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                    <button className="admin-btn admin-btn-success admin-btn-sm" onClick={handleSaveModules} disabled={savingModules}>
                                        <FaSave /> {savingModules ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                            <div className="admin-card-body">
                                <div className="row g-2">
                                    {rootModules.map(mod => {
                                        const checked = selectedModuleIds.includes(mod.moduleId);
                                        return (
                                            <div key={mod.moduleId} className="col-md-6 col-xl-4">
                                                <div 
                                                    className={`admin-check-card ${checked ? 'checked' : ''}`}
                                                    onClick={() => toggleModule(mod.moduleId)}
                                                >
                                                    <div className="custom-checkbox">
                                                        {checked && <FaUserCheck size={11} />}
                                                    </div>
                                                    <div className="module-icon-wrapper">
                                                        <i className={mod.icon || 'mdi mdi-cube-outline'} />
                                                    </div>
                                                    <div className="text-truncate">
                                                        <div className="small fw-bold text-truncate">{mod.displayName || mod.name}</div>
                                                        <code className="text-muted" style={{ fontSize: '0.7rem' }}>{mod.route || 'Racine'}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {rootModules.length === 0 && (
                                        <div className="text-muted small p-3 text-center w-100">Aucun module racine disponible.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rôles et Permissions détaillées */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <strong><FaLock className="text-primary" />Permissions fines du système</strong>
                                <button className="admin-btn admin-btn-success admin-btn-sm" onClick={handleSavePermissions} disabled={savingPerms}>
                                    <FaSave /> {savingPerms ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                            <div className="admin-card-body admin-scrollable-container" style={{ maxHeight: '500px' }}>
                                {Object.entries(permGroups).map(([modName, perms]) => {
                                    const permIds = perms.map(p => p.permissionId);
                                    const allSel = permIds.every(id => selectedPermissionIds.includes(id));
                                    const someSel = permIds.some(id => selectedPermissionIds.includes(id));
                                    const isOpen = expandedGroups[modName] !== false;

                                    return (
                                        <div key={modName} className="admin-accordion-group">
                                            <div className="admin-accordion-header" onClick={() => toggleGroupExpand(modName)}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="text-muted">
                                                        {isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                                                    </span>
                                                    <span className="small text-uppercase fw-bold text-primary">{modName}</span>
                                                    <span className="admin-badge admin-badge-secondary">{perms.length}</span>
                                                </div>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        className={`admin-btn admin-btn-xs ${allSel ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                                        style={{ padding: '2px 8px' }}
                                                        onClick={() => allSel
                                                            ? setSelectedPermissionIds(prev => prev.filter(id => !permIds.includes(id)))
                                                            : setSelectedPermissionIds(prev => [...new Set([...prev, ...permIds])])}
                                                    >
                                                        {allSel ? 'Tout décocher' : 'Tout cocher'}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {isOpen && (
                                                <div className="admin-accordion-body">
                                                    <div className="row g-2">
                                                        {perms.map(perm => {
                                                            const checked = selectedPermissionIds.includes(perm.permissionId);
                                                            return (
                                                                <div key={perm.permissionId} className="col-md-6 col-lg-12 col-xl-6">
                                                                    <div 
                                                                        className={`admin-permission-item ${checked ? 'checked' : ''}`}
                                                                        onClick={() => togglePermission(perm.permissionId)}
                                                                    >
                                                                        <div className="perm-checkbox">
                                                                            {checked && <FaCheckCircle size={10} />}
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <span className="admin-permission-label">{formatPermName(perm.name)}</span>
                                                                            {perm.description && (
                                                                                <div className="text-muted small" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                                                    {perm.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Role Création / Edition (Custom styled modal overlay) */}
            {showRoleModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowRoleModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSaveRole}>
                            <div className="admin-modal-header">
                                <h6 className="admin-modal-title">{editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}</h6>
                                <button type="button" className="admin-modal-close" onClick={() => setShowRoleModal(false)}><FaTimes /></button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Nom du rôle *</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-control" 
                                        required 
                                        placeholder="EX: MANAGER_RH, SUPERVISEUR..."
                                        value={roleForm.title}
                                        onChange={e => setRoleForm({ ...roleForm, title: e.target.value })} 
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">État du compte rôle</label>
                                    <select 
                                        className="admin-form-control"
                                        value={roleForm.state}
                                        onChange={e => setRoleForm({ ...roleForm, state: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Actif (Autorise les affectations)</option>
                                        <option value={0}>Inactif (Bloque les nouvelles affectations)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowRoleModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm"><FaSave />{editingRole ? 'Enregistrer les modifications' : 'Créer le rôle'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

        {popup && <SuccessPopup key={popup.key} title={popup.title} message={popup.message} />}
        </>
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
    const [popup, setPopup] = useState(null);

    const triggerPopup = (title, message) => {
        setPopup({ title, message, key: Date.now() });
        setTimeout(() => setPopup(null), 2500);
    };

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getModulesWithPermissions();
            setModules(data || []);
            const exp = {};
            (data || []).forEach(m => { exp[m.moduleId] = true; });
            setExpandedModules(exp);
        } catch { 
            toast.error('Erreur lors du chargement de la liste des modules'); 
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
                triggerPopup('Module mis à jour', 'Le module « ' + formData.displayName + ' » a été modifié avec succès.');
            } else {
                await createModule({ ...formData, state: 1 });
                triggerPopup('Module créé', 'Le module « ' + formData.displayName + ' » est maintenant disponible.');
            }
            setShowModal(false);
            setEditingModule(null);
            fetchModules();
        } catch { 
            toast.error('Erreur de sauvegarde du module'); 
        }
    };

    const handleDelete = async (mod) => {
        if (!window.confirm('Voulez-vous supprimer "' + mod.displayName + '" ? Attention, la suppression des modules parents supprimera également tous les modules enfants.')) return;
        try { 
            await deleteModule(mod.moduleId);
            triggerPopup('Module supprimé', 'Le module « ' + mod.displayName + ' » a été retiré de l\'arborescence.');
            fetchModules(); 
        } catch { 
            toast.error('Impossible de supprimer ce module.'); 
        }
    };

    const toggleExpand = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

    const renderRow = (mod, depth = 0) => (
        <React.Fragment key={mod.moduleId}>
            <tr>
                <td style={{ paddingLeft: (depth * 24 + 20) + 'px', position: 'relative' }}>
                    {depth > 0 && (
                        <div 
                            className="tree-indent-guide" 
                            style={{ left: ((depth - 1) * 24 + 28) + 'px', height: '100%' }}
                        />
                    )}
                    <div className="d-flex align-items-center gap-2">
                        {mod.childModules?.length > 0 ? (
                            <button 
                                className="btn p-0 border-0 tree-chevron-btn" 
                                onClick={() => toggleExpand(mod.moduleId)}
                            >
                                {expandedModules[mod.moduleId] ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                            </button>
                        ) : (
                            <span style={{ width: 20 }}></span>
                        )}
                        <span className="text-primary bg-light p-2 rounded-circle d-inline-flex">
                            <i className={mod.icon || 'mdi mdi-folder-outline'} style={{ fontSize: '14px' }} />
                        </span>
                        <div>
                            <div className="fw-bold">{mod.displayName}</div>
                            <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.3px' }}>{mod.name}</small>
                        </div>
                    </div>
                </td>
                <td className="bg-white-cell">
                    {mod.route ? (
                        <code className="bg-white px-2 py-1 rounded small border border-light text-secondary">{mod.route}</code>
                    ) : (
                        <span className="text-muted italic small">Non routé (Racine)</span>
                    )}
                </td>
                <td>
                    <div className="d-flex gap-1">
                        <span className="admin-badge admin-badge-info">{mod.permissions?.length || 0} perm(s)</span>
                        {mod.childModules?.length > 0 && (
                            <span className="admin-badge admin-badge-secondary">{mod.childModules.length} enfant(s)</span>
                        )}
                    </div>
                </td>
                <td>
                    <div className="d-flex gap-2">
                        <button 
                            className="admin-btn admin-btn-outline admin-btn-xs"
                            onClick={() => {
                                setEditingModule(mod);
                                setFormData({ name: mod.name, displayName: mod.displayName, icon: mod.icon || '', route: mod.route || '',
                                    parentModuleId: mod.parentModuleId, sortOrder: mod.sortOrder, description: mod.description || '' });
                                setShowModal(true);
                            }}
                            title="Modifier"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            className="admin-btn admin-btn-outline admin-btn-xs text-primary"
                            onClick={() => {
                                setEditingModule(null);
                                setFormData({ name: '', displayName: '', icon: '', route: '', parentModuleId: mod.moduleId, sortOrder: 0, description: '' });
                                setShowModal(true);
                            }}
                            title="Ajouter un sous-module"
                        >
                            <FaPlus />
                        </button>
                        <button 
                            className="admin-btn admin-btn-danger-outline admin-btn-xs"
                            onClick={() => handleDelete(mod)}
                            title="Supprimer"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </td>
            </tr>
            {mod.childModules && expandedModules[mod.moduleId] && mod.childModules.map(c => renderRow(c, depth + 1))}
        </React.Fragment>
    );

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
                <p className="text-muted mt-3">Chargement des modules...</p>
            </div>
        );
    }

    return (
        <>
        <div className="admin-card">
            <div className="admin-card-header">
                <strong><FaCubes className="text-primary" />Arborescence des modules</strong>
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => {
                    setEditingModule(null);
                    setFormData({ name: '', displayName: '', icon: '', route: '', parentModuleId: null, sortOrder: 0, description: '' });
                    setShowModal(true);
                }}>
                    <FaPlus /> Nouveau Module Racine
                </button>
            </div>
            
            <div className="admin-card-body p-0">
                <div className="table-responsive">
                    <table className="admin-table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 260 }}>Module / Page</th>
                                <th className="bg-white-cell" style={{ minWidth: 220 }}>Route Relative</th>
                                <th style={{ minWidth: 150 }}>Statistiques</th>
                                <th style={{ minWidth: 160 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(m => renderRow(m))}
                            {modules.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">
                                        <FaFolderOpen size={48} className="d-block mx-auto mb-3 opacity-25" />
                                        Aucun module créé. Utilisez le bouton "Nouveau Module Racine" ci-dessus.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de CRUD de Module */}
            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSave}>
                            <div className="admin-modal-header">
                                <h6 className="admin-modal-title">{editingModule ? 'Modifier' : 'Ajouter'} un module</h6>
                                <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Clé d'identification *</label>
                                            <input 
                                                type="text" 
                                                className="admin-form-control" 
                                                required 
                                                placeholder="ex: module_evaluations"
                                                value={formData.name} 
                                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Nom à afficher *</label>
                                            <input 
                                                type="text" 
                                                className="admin-form-control" 
                                                required 
                                                placeholder="ex: Évaluations Professionnelles"
                                                value={formData.displayName} 
                                                onChange={e => setFormData({ ...formData, displayName: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Classe d'icône MDI</label>
                                            <input 
                                                type="text" 
                                                className="admin-form-control" 
                                                placeholder="ex: mdi mdi-clipboard-check-outline"
                                                value={formData.icon} 
                                                onChange={e => setFormData({ ...formData, icon: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Route d'accès URL</label>
                                            <input 
                                                type="text" 
                                                className="admin-form-control" 
                                                placeholder="ex: /soft-gcc/evaluations/accueil"
                                                value={formData.route} 
                                                onChange={e => setFormData({ ...formData, route: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Module parent (Niveau hiérarchique)</label>
                                            <select 
                                                className="admin-form-control" 
                                                value={formData.parentModuleId || ''} 
                                                onChange={e => setFormData({ ...formData, parentModuleId: e.target.value ? parseInt(e.target.value) : null })}
                                            >
                                                <option value="">Aucun parent (Module principal)</option>
                                                {modules.map(m => (
                                                    <option key={m.moduleId} value={m.moduleId}>{m.displayName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Index d'affichage</label>
                                            <input 
                                                type="number" 
                                                className="admin-form-control" 
                                                value={formData.sortOrder} 
                                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Statut</label>
                                            <select className="admin-form-control" disabled value={1}>
                                                <option value={1}>Actif</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="admin-form-group mb-0">
                                            <label className="admin-form-label">Description ou Rôle du module</label>
                                            <textarea 
                                                className="admin-form-control" 
                                                rows={2} 
                                                placeholder="Saisissez un bref résumé des pages d'évaluations et de notation..."
                                                value={formData.description} 
                                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm"><FaSave />Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        {popup && <SuccessPopup key={popup.key} title={popup.title} message={popup.message} />}
        </div>
        </>
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
    const [popup, setPopup] = useState(null);

    const triggerPopup = (title, message) => {
        setPopup({ title, message, key: Date.now() });
        setTimeout(() => setPopup(null), 2500);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [perms, mods] = await Promise.all([getAllPermissions(), getAllModules()]);
            setPermissions(perms || []);
            setModules(mods || []);
            const exp = {};
            const groups = {};
            (perms || []).forEach(p => { 
                const m = p.moduleName || 'Sans module'; 
                if (!groups[m]) groups[m] = []; 
                groups[m].push(p); 
            });
            Object.keys(groups).forEach(k => { exp[k] = true; });
            setExpandedModules(exp);
        } catch { 
            toast.error('Erreur lors du chargement des droits d\'accès'); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const axios = (await import('axios')).default;
            const { urlApi } = await import('../../../helpers/utils');
            const headers = { Authorization: 'Bearer ' + (localStorage.getItem('token') || ''), 'Content-Type': 'application/json' };
            if (editingPerm) {
                await axios.put(urlApi('/Permission/' + editingPerm.permissionId), { permissionId: editingPerm.permissionId, name: formData.name, description: formData.description, moduleId: formData.moduleId }, { headers });
                triggerPopup('Permission mise à jour', 'La règle « ' + formData.name + ' » a été modifiée avec succès.');
            } else {
                await axios.post(urlApi('/Permission'), { name: formData.name, description: formData.description, moduleId: formData.moduleId }, { headers });
                triggerPopup('Permission créée', 'La nouvelle règle « ' + formData.name + ' » est maintenant active.');
            }
            setShowModal(false);
            setEditingPerm(null);
            fetchData();
        } catch { 
            toast.error('Une erreur s\'est produite lors de l\'enregistrement'); 
        }
    };

    const toggleExpand = (mod) => setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
                <p className="text-muted mt-3">Chargement du dictionnaire des permissions...</p>
            </div>
        );
    }

    const groups = {};
    permissions
        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .forEach(p => { 
            const m = p.moduleName || 'Sans module'; 
            if (!groups[m]) groups[m] = []; 
            groups[m].push(p); 
        });

    return (
        <>
        <div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div className="admin-search-wrapper mb-0" style={{ minWidth: '320px' }}>
                    <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="Rechercher une permission..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                    <FaSearch className="admin-search-icon" />
                </div>
                
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setEditingPerm(null); setFormData({ name: '', description: '', moduleId: null }); setShowModal(true); }}>
                    <FaPlus /> Nouvelle Permission
                </button>
            </div>

            <div className="row g-3">
                {Object.entries(groups).map(([modName, perms]) => (
                    <div key={modName} className="col-xl-6">
                        <div className="admin-card">
                            <div 
                                className="admin-card-header bg-light"
                                style={{ cursor: 'pointer' }} 
                                onClick={() => toggleExpand(modName)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {expandedModules[modName] ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                                    </span>
                                    <strong className="small text-primary text-uppercase">{modName}</strong>
                                </div>
                                <span className="admin-badge admin-badge-primary">{perms.length}</span>
                            </div>
                            
                            {expandedModules[modName] && (
                                <div className="admin-card-body p-2">
                                    <div className="d-flex flex-column gap-1">
                                        {perms.map(perm => (
                                            <div key={perm.permissionId} className="p-2 border-bottom border-light d-flex justify-content-between align-items-center bg-white rounded hover-bg-light">
                                                <div>
                                                    <div className="small fw-bold text-dark">{formatPermName(perm.name)}</div>
                                                    {perm.description ? (
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{perm.description}</div>
                                                    ) : (
                                                        <div className="text-muted italic" style={{ fontSize: '0.75rem' }}>Aucune description définie.</div>
                                                    )}
                                                </div>
                                                <button 
                                                    className="admin-btn admin-btn-outline admin-btn-xs"
                                                    onClick={() => {
                                                        setEditingPerm(perm);
                                                        setFormData({ name: perm.name, description: perm.description, moduleId: perm.moduleId });
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <FaEdit size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {Object.keys(groups).length === 0 && (
                    <div className="col-12 py-5 text-center text-muted">
                        <FaLock size={48} className="d-block mx-auto mb-3 opacity-25" />
                        Aucune règle de permission ne correspond à votre recherche.
                    </div>
                )}
            </div>

            {/* Modal CRUD de Permission */}
            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSave}>
                            <div className="admin-modal-header">
                                <h6 className="admin-modal-title">{editingPerm ? 'Modifier' : 'Ajouter'} une permission</h6>
                                <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Nom Système de la permission *</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-control" 
                                        required 
                                        placeholder="ex: CAN_GENERATE_REPORT"
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    />
                                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>Le nom doit être unique et en majuscules (convention SNAKE_CASE).</small>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Description ou rôle exact</label>
                                    <textarea 
                                        className="admin-form-control" 
                                        rows={2} 
                                        placeholder="ex: Autorise la création de rapports PDF d'entretiens annuels..."
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                    />
                                </div>
                                <div className="admin-form-group mb-0">
                                    <label className="admin-form-label">Module parent associé</label>
                                    <select 
                                        className="admin-form-control" 
                                        value={formData.moduleId || ''} 
                                        onChange={e => setFormData({ ...formData, moduleId: e.target.value ? parseInt(e.target.value) : null })}
                                    >
                                        <option value="">Aucun module (Permission globale)</option>
                                        {modules.map(m => (
                                            <option key={m.moduleId} value={m.moduleId}>{m.displayName} ({m.name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm"><FaSave />Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

        {popup && <SuccessPopup key={popup.key} title={popup.title} message={popup.message} />}
        </>
    );
}

// =============================================================================
// SuccessPopup — Confirmation visuelle animée
// =============================================================================
function SuccessPopup({ title, message }) {
    return (
        <div className="success-popup-overlay">
            <div className="success-popup-box">
                <div className="success-popup-icon-ring">
                    <FaCheckCircle size={32} color="#ffffff" />
                </div>
                <div className="success-popup-title">{title}</div>
                <div className="success-popup-message">{message}</div>
                <div className="success-popup-bar" />
            </div>
        </div>
    );
}

// =============================================================================
// Helpers
// =============================================================================
function formatPermName(name) {
    if (!name) return '';
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default AdminAccessManagement;
