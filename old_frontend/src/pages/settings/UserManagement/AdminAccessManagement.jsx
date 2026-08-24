import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Template from '../../Template';
import PageHeader from '../../../components/PageHeader';
import { useUser } from '../../Authentification/UserContext';
import { toast } from 'react-toastify';
import {
    getAllModules, getModulesWithPermissions, createModule, updateModule, deleteModule, reorderModules,
    getRoleModules, updateRoleModules,
    getAllPermissions, getRolePermissions, updateRolePermissions,
    getAllRoles, createRole, updateRole as updateRoleApi, deleteRole as deleteRoleApi
} from '../../../services/ModuleService';
import {
    FaUserShield, FaCubes, FaLock, FaPlus, FaSave, FaTimes, FaEdit, FaTrash,
    FaChevronDown, FaChevronRight, FaSearch, FaUserCheck, FaCheckCircle,
    FaFolderOpen, FaExclamationTriangle, FaShieldAlt,
    FaGripVertical, FaExpandAlt, FaCompressAlt
} from 'react-icons/fa';
import axios from 'axios';
import { urlApi } from '../../../helpers/utils';
import MdiIconPicker from './MdiIconPicker';
import './AdminAccessManagement.css';

// Helper d'en-tête d'authentification pour les appels API directs
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Composant Helper pour l'affichage fiable des icônes de module
function ModuleIcon({ icon, className = '', style = {} }) {
    if (icon && typeof icon === 'string' && icon.trim() !== '') {
        return <i className={`${icon} ${className}`} style={{ fontSize: '1.1rem', verticalAlign: 'middle', ...style }} />;
    }
    return <FaCubes className={className} style={{ fontSize: '0.95rem', ...style }} />;
}

/** Réordonne un tableau (sans lib externe) */
function arrayMove(list, fromIndex, toIndex) {
    const next = [...list];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
}

function toModuleId(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Aplatit l'arbre modules → liste { ...mod, depth } */
function flattenModuleTree(modules, depth = 0) {
    const result = [];
    (modules || []).forEach(m => {
        result.push({ ...m, moduleId: toModuleId(m.moduleId), depth });
        if (m.childModules?.length) {
            result.push(...flattenModuleTree(m.childModules, depth + 1));
        }
    });
    return result;
}

/** Tous les IDs (parents + enfants) d'un arbre de modules */
function collectAllModuleIds(modules) {
    return flattenModuleTree(modules).map(m => toModuleId(m.moduleId)).filter(id => id != null);
}

function collectDescendantIds(mod) {
    const ids = [];
    (mod?.childModules || []).forEach(c => {
        const id = toModuleId(c.moduleId);
        if (id != null) ids.push(id);
        ids.push(...collectDescendantIds(c));
    });
    return ids;
}

function findModuleInTree(modules, id) {
    const target = toModuleId(id);
    if (target == null) return null;
    for (const m of modules || []) {
        if (toModuleId(m.moduleId) === target) return m;
        const found = findModuleInTree(m.childModules, target);
        if (found) return found;
    }
    return null;
}

const RECONNECT_HINT = 'Les utilisateurs concernés doivent se reconnecter pour voir le nouveau menu et les nouvelles permissions.';

/**
 * Groupe les permissions par module racine (Compétences, Carrières…).
 * Affiche TOUS les modules racines même s'ils n'ont encore aucune permission liée.
 */
function buildPermissionGroups(modulesTree, permissions) {
    const perms = Array.isArray(permissions) ? permissions : [];
    const roots = (Array.isArray(modulesTree) ? modulesTree : []).filter(m => !m.parentModuleId);
    const used = new Set();
    const groups = [];

    const rootBranchIds = (root) => {
        const ids = new Set([Number(root.moduleId)]);
        (root.childModules || []).forEach(c => ids.add(Number(c.moduleId)));
        return ids;
    };

    roots.forEach(root => {
        const ids = rootBranchIds(root);
        const nameKey = (root.name || '').toLowerCase();
        const matched = perms.filter(p => {
            const mid = Number(p.moduleId);
            if (Number.isFinite(mid) && ids.has(mid)) return true;
            const mn = (p.moduleName || '').toLowerCase();
            return mn === nameKey || mn.startsWith(`${nameKey}_`) || mn.startsWith(`param_${nameKey}`);
        });
        matched.forEach(p => used.add(Number(p.permissionId)));
        groups.push({
            key: `mod-${root.moduleId}`,
            label: root.displayName || root.name || `Module #${root.moduleId}`,
            permissions: matched,
        });
    });

    const orphans = perms.filter(p => !used.has(Number(p.permissionId)));
    if (orphans.length > 0) {
        // Sous-groupes par moduleDisplayName / fallback
        const byLabel = {};
        orphans.forEach(p => {
            const label = p.moduleDisplayName || p.moduleName || 'Autres permissions';
            if (!byLabel[label]) byLabel[label] = [];
            byLabel[label].push(p);
        });
        Object.entries(byLabel).forEach(([label, list]) => {
            groups.push({ key: `orphan-${label}`, label, permissions: list });
        });
    }

    return groups;
}

// =============================================================================
// AdminAccessManagement — Interface d'administration unifiée
// =============================================================================
function AdminAccessManagement() {
    const { hasPermission } = useUser();
    const [activeTab, setActiveTab] = useState('roles');

    if (!hasPermission('MANAGE_PERMISSIONS')) {
        return (
            <Template>
                <div className="container-fluid px-3 py-4">
                    <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-3 p-4 rounded-3">
                        <FaExclamationTriangle size={36} className="text-danger flex-shrink-0" />
                        <div>
                            <h5 className="alert-heading fw-bold mb-1">Accès non autorisé</h5>
                            <p className="mb-0 text-secondary">
                                Cette section est strictement réservée aux administrateurs système du projet.
                            </p>
                        </div>
                    </div>
                </div>
            </Template>
        );
    }

    const tabs = [
        { id: 'roles', icon: <FaUserShield size={14} />, label: 'Rôles & Profils' },
        { id: 'modules', icon: <FaCubes size={14} />, label: 'Modules & Pages' },
        { id: 'permissions', icon: <FaLock size={14} />, label: 'Permissions' },
    ];

    return (
        <Template>
            <div className="admin-management-container px-2 py-3 px-md-4">
                {/* En-tête de page standard du projet */}
                <PageHeader 
                    module="Utilisateurs" 
                    action="Administration des Accès" 
                    url="/soft-gcc/parametres/utilisateurs" 
                />

                {/* Bandeau supérieur avec sélecteur d'onglets */}
                <div className="admin-page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="admin-header-icon">
                            <FaShieldAlt />
                        </div>
                        <div>
                            <h4 className="admin-header-title">Gestion des Accès &amp; Permissions</h4>
                            <p className="text-muted small mb-0">
                                Configuration des rôles utilisateurs, de la visibilité des modules et des droits d'accès.
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <ul className="nav admin-custom-tabs">
                            {tabs.map(tab => (
                                <li key={tab.id} className="nav-item">
                                    <button 
                                        type="button"
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

    useEffect(() => {
        (async () => {
            try {
                setLoadingRoles(true);
                const [r, m, p] = await Promise.all([getAllRoles(), getAllModules(), getAllPermissions()]);
                setRoles(Array.isArray(r) ? r : []);
                setAllModules(Array.isArray(m) ? m : []);
                const perms = Array.isArray(p) ? p : [];
                setAllPermissions(perms);
                
                // Déplier tous les groupes de permissions par défaut (modules racines + orphelins)
                const initialExpanded = {};
                buildPermissionGroups(m || [], perms).forEach(g => {
                    initialExpanded[g.label] = true;
                });
                setExpandedGroups(initialExpanded);
            } catch { 
                toast.error('Erreur lors du chargement des données système'); 
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
            setSelectedModuleIds(Array.isArray(mods) ? mods.map(m => Number(m.moduleId)).filter(Number.isFinite) : []);
            setSelectedPermissionIds(Array.isArray(perms) ? perms.map(p => Number(p.permissionId)).filter(Number.isFinite) : []);
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
            toast.success(`${selectedModuleIds.length} module(s) associés au rôle "${selectedRole.title}"`);
            toast.info(RECONNECT_HINT, { autoClose: 8000 });
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde des modules');
        } finally { 
            setSavingModules(false); 
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        setSavingPerms(true);
        try {
            await updateRolePermissions(selectedRole.roleId, [...selectedPermissionIds]);
            toast.success(`${selectedPermissionIds.length} permission(s) assignée(s) au rôle "${selectedRole.title}"`);
            toast.info(RECONNECT_HINT, { autoClose: 8000 });
            if (selectedModuleIds.length === 0) {
                toast.warning(
                    'Aucune page visible pour ce rôle. Cochez aussi « Modules & Pages Visibles » puis Enregistrer — sinon le menu restera vide.',
                    { autoClose: 10000 }
                );
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde des permissions');
        } finally { 
            setSavingPerms(false); 
        }
    };

    const toggleModule = (id) => {
        const mid = toModuleId(id);
        if (mid == null) return;
        const mod = findModuleInTree(allModules, mid);
        const descendantIds = mod ? collectDescendantIds(mod) : [];
        const parentId = toModuleId(mod?.parentModuleId);

        setSelectedModuleIds(prev => {
            const selected = new Set((prev || []).map(toModuleId).filter(x => x != null));
            const turningOff = selected.has(mid);

            if (turningOff) {
                selected.delete(mid);
                descendantIds.forEach(did => selected.delete(did));
                if (parentId != null) selected.delete(parentId);
            } else {
                selected.add(mid);
                descendantIds.forEach(did => selected.add(did));
                if (parentId != null) {
                    const parent = findModuleInTree(allModules, parentId);
                    const siblingIds = (parent?.childModules || [])
                        .map(c => toModuleId(c.moduleId))
                        .filter(x => x != null);
                    if (siblingIds.length > 0 && siblingIds.every(sid => selected.has(sid))) {
                        selected.add(parentId);
                    }
                }
            }
            return [...selected];
        });
    };
    const togglePermission = (id) => {
        const pid = toModuleId(id);
        if (pid == null) return;
        setSelectedPermissionIds(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]);
    };

    const allModuleIds = useMemo(() => collectAllModuleIds(allModules), [allModules]);
    const flatModules = useMemo(() => flattenModuleTree(allModules), [allModules]);

    const toggleAllModules = () => {
        const ids = allModuleIds.map(toModuleId).filter(x => x != null);
        const allSel = ids.length > 0 && ids.every(id => selectedModuleIds.includes(id));
        setSelectedModuleIds(allSel ? [] : [...ids]);
    };

    const modulesAllSelected = allModuleIds.length > 0 && allModuleIds.every(id => selectedModuleIds.includes(Number(id)));

    const getChildSelectionState = (mod) => {
        const childIds = (mod.childModules || []).map(c => toModuleId(c.moduleId)).filter(x => x != null);
        if (childIds.length === 0) return { some: false, all: false };
        const selectedCount = childIds.filter(id => selectedModuleIds.includes(id)).length;
        return {
            some: selectedCount > 0 && selectedCount < childIds.length,
            all: selectedCount === childIds.length,
        };
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRoleApi(editingRole.roleId, { title: roleForm.title, state: roleForm.state });
                toast.success(`Le rôle "${roleForm.title}" a été mis à jour`);
            } else {
                await createRole({ title: roleForm.title, state: 1 });
                toast.success(`Le rôle "${roleForm.title}" a été créé`);
            }
            setShowRoleModal(false);
            setEditingRole(null);
            setRoleForm({ title: '', state: 1 });
            setRoles(await getAllRoles());
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde du rôle'); 
        }
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer le rôle "${role.title}" ? Cette action est irréversible.`)) return;
        try {
            await deleteRoleApi(role.roleId);
            toast.success(`Le rôle "${role.title}" a été supprimé`);
            if (selectedRole?.roleId === role.roleId) setSelectedRole(null);
            setRoles(await getAllRoles());
        } catch (err) { 
            toast.error(err.response?.data?.message || 'Erreur de suppression du rôle'); 
        }
    };

    const toggleGroupExpand = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const filteredRoles = roles.filter(r => (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

    // Hooks AVANT tout early return (Rules of Hooks)
    const permissionGroupList = useMemo(
        () => buildPermissionGroups(allModules, allPermissions),
        [allModules, allPermissions]
    );

    const allPermissionIds = useMemo(
        () => (Array.isArray(allPermissions) ? allPermissions : [])
            .map(p => Number(p.permissionId))
            .filter(Number.isFinite),
        [allPermissions]
    );

    const permissionsAllSelected = allPermissionIds.length > 0
        && allPermissionIds.every(id => selectedPermissionIds.includes(id));

    const toggleAllPermissions = () => {
        setSelectedPermissionIds(permissionsAllSelected ? [] : [...allPermissionIds]);
    };

    if (loadingRoles) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-3 small">Chargement des rôles système...</p>
            </div>
        );
    }

    return (
        <div className="row g-4">
            {/* Colonne gauche : Liste des Rôles */}
            <div className="col-lg-4">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <strong><FaUserShield className="text-primary" /> Rôles Système</strong>
                        <button 
                            type="button"
                            className="admin-btn admin-btn-primary admin-btn-sm" 
                            onClick={() => { setEditingRole(null); setRoleForm({ title: '', state: 1 }); setShowRoleModal(true); }}
                        >
                            <FaPlus /> Nouveau Rôle
                        </button>
                    </div>
                    
                    <div className="admin-card-body d-flex flex-column" style={{ minHeight: 0 }}>
                        <div className="admin-search-wrapper">
                            <input 
                                type="text"
                                className="admin-search-input" 
                                placeholder="Rechercher un rôle..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                            <FaSearch className="admin-search-icon" />
                        </div>
                        
                        <div className="admin-scrollable-container flex-grow-1" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                            {filteredRoles.map(role => {
                                const isActive = selectedRole?.roleId === role.roleId;
                                return (
                                    <div 
                                        key={role.roleId}
                                        className={`admin-item-row ${isActive ? 'active' : ''}`}
                                        onClick={() => handleSelectRole(role)}
                                    >
                                        <div>
                                            <div className="fw-bold mb-1 role-title" style={{ fontSize: '0.9rem' }}>{role.title}</div>
                                            <span className={`admin-badge role-badge ${isActive ? '' : (role.state === 1 ? 'admin-badge-success' : 'admin-badge-secondary')}`}>
                                                {role.state === 1 ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        <div className="actions-group" onClick={e => e.stopPropagation()}>
                                            <button 
                                                type="button"
                                                className="btn btn-sm action-btn p-1"
                                                onClick={() => { setEditingRole(role); setRoleForm({ title: role.title, state: role.state ?? 1 }); setShowRoleModal(true); }}
                                                title="Modifier"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button 
                                                type="button"
                                                className="btn btn-sm action-btn p-1 text-danger"
                                                onClick={() => handleDeleteRole(role)}
                                                title="Supprimer"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredRoles.length === 0 && (
                                <div className="admin-empty-state">
                                    <FaUserShield className="admin-empty-icon" />
                                    <div className="admin-empty-title">Aucun rôle trouvé</div>
                                    <div className="admin-empty-desc">Essayez d'ajuster votre recherche ou créez un rôle.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne droite : Configuration du rôle sélectionné */}
            <div className="col-lg-8">
                {!selectedRole ? (
                    <div className="admin-card">
                        <div className="admin-card-body d-flex flex-column align-items-center justify-content-center py-5 text-center">
                            <div className="p-3 bg-light rounded-circle mb-3">
                                <FaUserShield size={48} className="text-muted opacity-50" />
                            </div>
                            <h5 className="fw-bold mb-1">Sélectionnez un rôle</h5>
                            <p className="text-muted small max-w-320 mb-0">
                                Cliquez sur un rôle dans la liste de gauche pour configurer ses accès aux modules et ses permissions.
                            </p>
                        </div>
                    </div>
                ) : loadingAccess ? (
                    <div className="admin-card">
                        <div className="admin-card-body d-flex flex-column align-items-center justify-content-center py-5">
                            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2rem', height: '2rem' }} />
                            <p className="text-muted small mb-0">Chargement des accréditations de <strong>{selectedRole.title}</strong>...</p>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {/* Section 1 : Modules Visibles */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <strong><FaCubes className="text-primary" /> Modules &amp; Pages Visibles ({selectedModuleIds.length})</strong>
                                <div className="d-flex gap-2">
                                    <button 
                                        type="button"
                                        className="admin-btn admin-btn-outline admin-btn-sm" 
                                        onClick={toggleAllModules}
                                    >
                                        {modulesAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                    <button 
                                        type="button"
                                        className="admin-btn admin-btn-success admin-btn-sm" 
                                        onClick={handleSaveModules} 
                                        disabled={savingModules}
                                    >
                                        <FaSave /> {savingModules ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                            <div className="admin-card-body">
                                <p className="text-muted small mb-3">
                                    Cochez chaque page à afficher dans le menu. Cocher un module parent sélectionne toutes ses pages ;
                                    décocher une page enfant décoche le parent. Un parent non coché apparaît quand même comme groupe
                                    si au moins un enfant est visible.
                                </p>
                                <div className="admin-module-tree">
                                    {flatModules.map(mod => {
                                        const checked = selectedModuleIds.includes(Number(mod.moduleId));
                                        const isRoot = !mod.parentModuleId;
                                        const childState = isRoot ? getChildSelectionState(mod) : { some: false, all: false };
                                        const indeterminate = isRoot && !checked && childState.some;
                                        return (
                                            <div
                                                key={mod.moduleId}
                                                className={`admin-module-tree-row ${checked ? 'checked' : ''} ${indeterminate ? 'indeterminate' : ''}`}
                                                style={{ paddingLeft: (mod.depth * 20 + 12) + 'px' }}
                                                onClick={() => toggleModule(mod.moduleId)}
                                            >
                                                <div className={`custom-checkbox ${indeterminate ? 'is-indeterminate' : ''}`}>
                                                    {checked && <FaUserCheck size={11} />}
                                                    {indeterminate && !checked && <span className="indeterminate-dash" />}
                                                </div>
                                                <div className="module-icon-wrapper">
                                                    <ModuleIcon icon={mod.icon} />
                                                </div>
                                                <div className="text-truncate flex-grow-1">
                                                    <div className="small fw-bold text-truncate mb-0">
                                                        {mod.displayName || mod.name}
                                                        {isRoot && mod.childModules?.length > 0 && (
                                                            <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.7rem' }}>
                                                                ({mod.childModules.length} page{mod.childModules.length > 1 ? 's' : ''})
                                                            </span>
                                                        )}
                                                    </div>
                                                    {mod.route ? (
                                                        <span className="admin-route-badge" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                                            {mod.route}
                                                        </span>
                                                    ) : (
                                                        <span className="admin-route-badge-muted" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                                            {isRoot ? 'Module racine' : 'Sans route'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {flatModules.length === 0 && (
                                        <div className="text-muted small p-3 text-center w-100">Aucun module disponible.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2 : Permissions fines du système */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <strong><FaLock className="text-primary" /> Permissions attribuées ({selectedPermissionIds.length}/{allPermissionIds.length})</strong>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-outline admin-btn-sm"
                                        onClick={toggleAllPermissions}
                                        disabled={allPermissionIds.length === 0}
                                    >
                                        {permissionsAllSelected ? 'Tout décocher' : 'Tout cocher'}
                                    </button>
                                    <button 
                                        type="button"
                                        className="admin-btn admin-btn-success admin-btn-sm" 
                                        onClick={handleSavePermissions} 
                                        disabled={savingPerms}
                                    >
                                        <FaSave /> {savingPerms ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                            <div className="admin-card-body admin-scrollable-container" style={{ maxHeight: '480px' }}>
                                {allPermissionIds.length === 0 && (
                                    <div className="text-muted small p-3 text-center">
                                        Aucune permission chargée. Exécutez le script SQL
                                        <code className="mx-1">09_SYNC_PERMISSIONS_MODULES.sql</code>
                                        puis rechargez cette page.
                                    </div>
                                )}
                                {permissionGroupList.map(group => {
                                    const perms = group.permissions;
                                    const permIds = perms.map(p => Number(p.permissionId)).filter(Number.isFinite);
                                    const allSel = permIds.length > 0 && permIds.every(id => selectedPermissionIds.includes(id));
                                    const isOpen = expandedGroups[group.label] !== false;

                                    return (
                                        <div key={group.key} className="admin-accordion-group">
                                            <div className="admin-accordion-header" onClick={() => toggleGroupExpand(group.label)}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="text-muted">
                                                        {isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                                                    </span>
                                                    <span className="small text-uppercase fw-bold text-primary">{group.label}</span>
                                                    <span className="admin-badge admin-badge-secondary">{perms.length}</span>
                                                </div>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        type="button"
                                                        className={`admin-btn admin-btn-xs ${allSel ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                                        disabled={permIds.length === 0}
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
                                                    {perms.length === 0 ? (
                                                        <div className="text-muted small px-2 py-2">
                                                            Aucune permission liée à ce module. Lancez
                                                            <code className="mx-1">09_SYNC_PERMISSIONS_MODULES.sql</code>
                                                            pour rattacher le catalogue.
                                                        </div>
                                                    ) : (
                                                    <div className="row g-2">
                                                        {perms.map(perm => {
                                                            const pid = Number(perm.permissionId);
                                                            const checked = selectedPermissionIds.includes(pid);
                                                            return (
                                                                <div key={pid} className="col-md-6 col-lg-12 col-xl-6">
                                                                    <div 
                                                                        className={`admin-permission-item ${checked ? 'checked' : ''}`}
                                                                        onClick={() => togglePermission(pid)}
                                                                    >
                                                                        <div className="perm-checkbox">
                                                                            {checked && <FaCheckCircle size={10} />}
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <span className="admin-permission-label">{formatPermName(perm.name)}</span>
                                                                            <code className="d-block text-muted" style={{ fontSize: '0.68rem' }}>{perm.name}</code>
                                                                            {perm.description && (
                                                                                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                                                    {perm.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    )}
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

            {/* Modal Création / Édition de Rôle */}
            {showRoleModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowRoleModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSaveRole}>
                            <div className="admin-modal-header">
                                <h6 className="admin-modal-title">{editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}</h6>
                                <button type="button" className="admin-modal-close" onClick={() => setShowRoleModal(false)}>
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Nom du rôle *</label>
                                    <input 
                                        type="text" 
                                        className="admin-form-control" 
                                        required 
                                        placeholder="ex: MANAGER_RH, SUPERVISEUR..."
                                        value={roleForm.title}
                                        onChange={e => setRoleForm({ ...roleForm, title: e.target.value })} 
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Statut du rôle</label>
                                    <select 
                                        className="admin-form-control"
                                        value={roleForm.state}
                                        onChange={e => setRoleForm({ ...roleForm, state: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Actif (Autorise les affectations)</option>
                                        <option value={0}>Inactif (Bloque les affectations)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowRoleModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                                    <FaSave /> {editingRole ? 'Enregistrer' : 'Créer le rôle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Onglet 2 : Modules & Pages
// =============================================================================

function ModuleRow({
    mod, depth, expandedModules, toggleExpand, onEdit, onAddChild, onDelete,
    dragGroup, isDragging, isDragOver, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd
}) {
    return (
        <tr
            className={`${isDragging ? 'module-row-dragging' : ''} ${isDragOver ? 'module-row-drag-over' : ''}`}
            onDragOver={(e) => onDragOver(e, mod, dragGroup)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, mod, dragGroup)}
        >
            <td style={{ paddingLeft: (depth * 24 + 12) + 'px', position: 'relative' }}>
                {depth > 0 && (
                    <div
                        className="tree-indent-guide"
                        style={{ left: ((depth - 1) * 24 + 20) + 'px', height: '100%' }}
                    />
                )}
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn p-0 border-0 module-drag-handle"
                        title="Glisser pour réordonner"
                        draggable
                        onDragStart={(e) => onDragStart(e, mod, dragGroup)}
                        onDragEnd={onDragEnd}
                    >
                        <FaGripVertical size={13} />
                    </button>
                    {mod.childModules?.length > 0 ? (
                        <button
                            type="button"
                            className="btn p-0 border-0 tree-chevron-btn"
                            onClick={() => toggleExpand(mod.moduleId)}
                        >
                            {expandedModules[mod.moduleId] ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                        </button>
                    ) : (
                        <span style={{ width: 22 }}></span>
                    )}
                    <span className="p-1 rounded bg-light text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                        <ModuleIcon icon={mod.icon} />
                    </span>
                    <div>
                        <div className="fw-bold">{mod.displayName}</div>
                        <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>{mod.name}</small>
                    </div>
                </div>
            </td>
            <td>
                {mod.route ? (
                    <span className="admin-route-badge">{mod.route}</span>
                ) : (
                    <span className="admin-route-badge-muted">Non routé (Racine)</span>
                )}
            </td>
            <td>
                <div className="d-flex gap-1 flex-wrap">
                    <span className="admin-badge admin-badge-info">{mod.permissions?.length || 0} perm(s)</span>
                    {mod.childModules?.length > 0 && (
                        <span className="admin-badge admin-badge-secondary">{mod.childModules.length} enfant(s)</span>
                    )}
                    <span className="admin-badge admin-badge-secondary">#{mod.sortOrder ?? 0}</span>
                </div>
            </td>
            <td>
                <div className="d-flex gap-1">
                    <button type="button" className="admin-btn admin-btn-outline admin-btn-xs" onClick={() => onEdit(mod)} title="Modifier">
                        <FaEdit />
                    </button>
                    <button type="button" className="admin-btn admin-btn-outline admin-btn-xs text-primary" onClick={() => onAddChild(mod)} title="Ajouter un sous-module">
                        <FaPlus />
                    </button>
                    <button type="button" className="admin-btn admin-btn-danger-outline admin-btn-xs" onClick={() => onDelete(mod)} title="Supprimer">
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ModulesTab() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [formData, setFormData] = useState({ name: '', displayName: '', icon: '', route: '', parentModuleId: null, sortOrder: 0, description: '' });
    const [expandedModules, setExpandedModules] = useState({});
    const [reordering, setReordering] = useState(false);
    const [dragState, setDragState] = useState(null); // { id, group }
    const [dragOverId, setDragOverId] = useState(null);

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getModulesWithPermissions();
            // Sécurité : racines uniquement (évite duplication si API renvoie encore enfants à plat)
            const roots = (data || []).filter(m => !m.parentModuleId);
            setModules(roots);
            const exp = {};
            roots.forEach(m => { exp[m.moduleId] = true; });
            setExpandedModules(exp);
        } catch {
            toast.error('Erreur lors du chargement des modules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchModules(); }, [fetchModules]);

    const parentOptions = useMemo(() => {
        const opts = [];
        modules.forEach(m => {
            opts.push(m);
            (m.childModules || []).forEach(c => opts.push(c));
        });
        return opts;
    }, [modules]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await updateModule(editingModule.moduleId, { ...formData, moduleId: editingModule.moduleId, state: 1 });
                toast.success(`Le module "${formData.displayName}" a été mis à jour`);
            } else {
                await createModule({ ...formData, state: 1 });
                toast.success(`Le module "${formData.displayName}" a été créé`);
            }
            setShowModal(false);
            setEditingModule(null);
            fetchModules();
        } catch {
            toast.error('Erreur de sauvegarde du module');
        }
    };

    const handleDelete = async (mod) => {
        if (!window.confirm(`Voulez-vous supprimer "${mod.displayName}" ? Les sous-modules associés seront également supprimés.`)) return;
        try {
            await deleteModule(mod.moduleId);
            toast.success(`Le module "${mod.displayName}" a été supprimé`);
            fetchModules();
        } catch {
            toast.error('Impossible de supprimer ce module.');
        }
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

    const openAddChild = (mod) => {
        setEditingModule(null);
        setFormData({
            name: '', displayName: '', icon: '', route: '',
            parentModuleId: mod.moduleId, sortOrder: 0, description: ''
        });
        setShowModal(true);
    };

    const toggleExpand = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

    const expandAll = () => {
        const exp = {};
        modules.forEach(m => { exp[m.moduleId] = true; });
        setExpandedModules(exp);
    };

    const collapseAll = () => {
        setExpandedModules({});
    };

    const persistSiblingOrder = async (siblings, parentModuleId) => {
        const items = siblings.map((m, index) => ({
            moduleId: m.moduleId,
            sortOrder: index + 1,
            parentModuleId: parentModuleId ?? null
        }));
        setReordering(true);
        try {
            await reorderModules(items);
        } catch {
            toast.error('Erreur lors du réordonnancement');
            await fetchModules();
        } finally {
            setReordering(false);
        }
    };

    const handleDragStart = (e, mod, group) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(mod.moduleId));
        setDragState({ id: mod.moduleId, group });
    };

    const handleDragOver = (e, mod, group) => {
        if (!dragState || dragState.group !== group || dragState.id === mod.moduleId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(mod.moduleId);
    };

    const handleDragLeave = () => setDragOverId(null);

    const handleDrop = async (e, targetMod, group) => {
        e.preventDefault();
        setDragOverId(null);
        if (!dragState || dragState.group !== group || dragState.id === targetMod.moduleId) {
            setDragState(null);
            return;
        }

        const activeId = dragState.id;
        setDragState(null);

        if (group === 'root') {
            const rootIds = modules.map(m => m.moduleId);
            const oldIndex = rootIds.indexOf(activeId);
            const newIndex = rootIds.indexOf(targetMod.moduleId);
            if (oldIndex < 0 || newIndex < 0) return;
            const reordered = arrayMove(modules, oldIndex, newIndex).map((m, i) => ({ ...m, sortOrder: i + 1 }));
            setModules(reordered);
            await persistSiblingOrder(reordered, null);
            return;
        }

        // group = `child-${parentId}`
        const parentId = Number(group.replace('child-', ''));
        const parentIndex = modules.findIndex(m => m.moduleId === parentId);
        if (parentIndex < 0) return;
        const parent = modules[parentIndex];
        const children = parent.childModules || [];
        const childIds = children.map(c => c.moduleId);
        const oldIndex = childIds.indexOf(activeId);
        const newIndex = childIds.indexOf(targetMod.moduleId);
        if (oldIndex < 0 || newIndex < 0) return;
        const reorderedChildren = arrayMove(children, oldIndex, newIndex).map((c, i) => ({ ...c, sortOrder: i + 1 }));
        const next = modules.map((m, idx) =>
            idx === parentIndex ? { ...m, childModules: reorderedChildren } : m
        );
        setModules(next);
        await persistSiblingOrder(reorderedChildren, parent.moduleId);
    };

    const handleDragEnd = () => {
        setDragState(null);
        setDragOverId(null);
    };

    const rowProps = {
        expandedModules,
        toggleExpand,
        onEdit: openEdit,
        onAddChild: openAddChild,
        onDelete: handleDelete,
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onDragEnd: handleDragEnd,
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
                <p className="text-muted mt-3 small">Chargement des modules...</p>
            </div>
        );
    }

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <strong><FaCubes className="text-primary" /> Arborescence des modules {reordering && <span className="text-muted fw-normal small ms-2">Enregistrement de l&apos;ordre...</span>}</strong>
                <div className="d-flex gap-2 flex-wrap">
                    <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={expandAll} title="Tout déplier">
                        <FaExpandAlt /> Déplier
                    </button>
                    <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={collapseAll} title="Tout replier">
                        <FaCompressAlt /> Replier
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => {
                            setEditingModule(null);
                            setFormData({ name: '', displayName: '', icon: '', route: '', parentModuleId: null, sortOrder: 0, description: '' });
                            setShowModal(true);
                        }}
                    >
                        <FaPlus /> Nouveau Module Racine
                    </button>
                </div>
            </div>

            <div className="admin-card-body p-0">
                <p className="text-muted small px-3 pt-3 mb-2">
                    Glissez les lignes (poignée) pour changer l&apos;ordre d&apos;affichage (entre modules frères uniquement).
                </p>
                <div className="table-responsive">
                    <table className="admin-table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 280 }}>Module / Page</th>
                                <th style={{ minWidth: 220 }}>Route Relative</th>
                                <th style={{ minWidth: 160 }}>Éléments</th>
                                <th style={{ minWidth: 140 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(m => (
                                <React.Fragment key={m.moduleId}>
                                    <ModuleRow
                                        mod={m}
                                        depth={0}
                                        dragGroup="root"
                                        isDragging={dragState?.id === m.moduleId}
                                        isDragOver={dragOverId === m.moduleId && dragState?.group === 'root'}
                                        {...rowProps}
                                    />
                                    {m.childModules && expandedModules[m.moduleId] && m.childModules.map(c => (
                                        <ModuleRow
                                            key={c.moduleId}
                                            mod={c}
                                            depth={1}
                                            dragGroup={`child-${m.moduleId}`}
                                            isDragging={dragState?.id === c.moduleId}
                                            isDragOver={dragOverId === c.moduleId && dragState?.group === `child-${m.moduleId}`}
                                            {...rowProps}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                            {modules.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">
                                        <FaFolderOpen size={40} className="d-block mx-auto mb-2 opacity-25" />
                                        Aucun module configuré. Cliquez sur &quot;Nouveau Module Racine&quot; ci-dessus.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSave}>
                            <div className="admin-modal-header">
                                <h6 className="admin-modal-title">{editingModule ? 'Modifier' : 'Ajouter'} un module</h6>
                                <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Clé d&apos;identification *</label>
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
                                    <div className="col-12">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Icône</label>
                                            <MdiIconPicker
                                                value={formData.icon}
                                                onChange={icon => setFormData({ ...formData, icon })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Route d&apos;accès URL</label>
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
                                            <label className="admin-form-label">Module parent</label>
                                            <select
                                                className="admin-form-control"
                                                value={formData.parentModuleId || ''}
                                                onChange={e => setFormData({ ...formData, parentModuleId: e.target.value ? parseInt(e.target.value) : null })}
                                            >
                                                <option value="">Aucun parent (Module principal)</option>
                                                {parentOptions
                                                    .filter(m => !editingModule || m.moduleId !== editingModule.moduleId)
                                                    .map(m => (
                                                        <option key={m.moduleId} value={m.moduleId}>
                                                            {m.parentModuleId ? `↳ ${m.displayName}` : m.displayName}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Ordre d&apos;affichage</label>
                                            <input
                                                type="number"
                                                className="admin-form-control"
                                                value={formData.sortOrder}
                                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                            />
                                            <small className="text-muted">Ou glissez les lignes dans la liste.</small>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="admin-form-group mb-0">
                                            <label className="admin-form-label">Description</label>
                                            <textarea
                                                className="admin-form-control"
                                                rows={2}
                                                placeholder="Bref résumé de l'usage du module..."
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm"><FaSave /> Enregistrer</button>
                            </div>
                        </form>
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
            const [perms, mods] = await Promise.all([getAllPermissions(), getAllModules()]);
            const permList = Array.isArray(perms) ? perms : [];
            const modList = Array.isArray(mods) ? mods : [];
            setPermissions(permList);
            setModules(modList);
            const exp = {};
            buildPermissionGroups(modList, permList).forEach(g => { exp[g.label] = true; });
            setExpandedModules(exp);
        } catch { 
            toast.error('Erreur lors du chargement des permissions'); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const headers = getAuthHeaders();
            if (editingPerm) {
                await axios.put(urlApi(`/Permission/${editingPerm.permissionId}`), { 
                    permissionId: editingPerm.permissionId, 
                    name: formData.name, 
                    description: formData.description, 
                    moduleId: formData.moduleId 
                }, { headers });
                toast.success(`La permission "${formData.name}" a été mise à jour`);
            } else {
                await axios.post(urlApi('/Permission'), { 
                    name: formData.name, 
                    description: formData.description, 
                    moduleId: formData.moduleId 
                }, { headers });
                toast.success(`La permission "${formData.name}" a été créée`);
            }
            setShowModal(false);
            setEditingPerm(null);
            fetchData();
        } catch { 
            toast.error('Erreur lors de l\'enregistrement de la permission'); 
        }
    };

    const toggleExpand = (mod) => setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));

    const permissionGroupList = useMemo(
        () => buildPermissionGroups(modules, permissions),
        [modules, permissions]
    );

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
                <p className="text-muted mt-3 small">Chargement des permissions...</p>
            </div>
        );
    }

    return (
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
                
                <div className="d-flex align-items-center gap-2">
                    <span className="admin-badge admin-badge-primary">
                        {(Array.isArray(permissions) ? permissions : []).length} permission(s)
                    </span>
                    <button 
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm" 
                        onClick={() => { setEditingPerm(null); setFormData({ name: '', description: '', moduleId: null }); setShowModal(true); }}
                    >
                        <FaPlus /> Nouvelle Permission
                    </button>
                </div>
            </div>

            <div className="row g-3">
                {permissionGroupList.map(group => {
                    const perms = group.permissions.filter(p =>
                        !searchQuery
                        || (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                        || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (searchQuery && perms.length === 0) return null;
                    return (
                    <div key={group.key} className="col-xl-6">
                        <div className="admin-card">
                            <div 
                                className="admin-card-header"
                                style={{ cursor: 'pointer' }} 
                                onClick={() => toggleExpand(group.label)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {expandedModules[group.label] ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                                    </span>
                                    <strong className="small text-primary text-uppercase">{group.label}</strong>
                                </div>
                                <span className="admin-badge admin-badge-primary">{perms.length}</span>
                            </div>
                            
                            {expandedModules[group.label] && (
                                <div className="admin-card-body p-2">
                                    {perms.length === 0 ? (
                                        <div className="text-muted small p-2">
                                            Aucune permission liée. Exécutez <code>09_SYNC_PERMISSIONS_MODULES.sql</code>.
                                        </div>
                                    ) : (
                                    <div className="d-flex flex-column gap-1">
                                        {perms.map(perm => (
                                            <div 
                                                key={perm.permissionId} 
                                                className="p-2 border-bottom d-flex justify-content-between align-items-center rounded-2 bg-white"
                                            >
                                                <div>
                                                    <div className="small fw-bold text-dark">{formatPermName(perm.name)}</div>
                                                    <code className="text-muted" style={{ fontSize: '0.7rem' }}>{perm.name}</code>
                                                    {perm.description && (
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{perm.description}</div>
                                                    )}
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="admin-btn admin-btn-outline admin-btn-xs"
                                                    onClick={() => {
                                                        setEditingPerm(perm);
                                                        setFormData({ name: perm.name, description: perm.description || '', moduleId: perm.moduleId });
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })}
                {permissionGroupList.length === 0 && (
                    <div className="col-12 py-5 text-center text-muted">
                        <FaLock size={40} className="d-block mx-auto mb-2 opacity-25" />
                        Aucun module trouvé. Lancez d&apos;abord <code>04_SEED_MODULES.sql</code>.
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
                                <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>
                                    <FaTimes />
                                </button>
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
                                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.725rem' }}>
                                        Format unique en majuscules (convention SNAKE_CASE).
                                    </small>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Description</label>
                                    <textarea 
                                        className="admin-form-control" 
                                        rows={2} 
                                        placeholder="ex: Autorise la création de rapports PDF d'entretiens..."
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
                                        {flattenModuleTree(modules).map(m => (
                                            <option key={m.moduleId} value={m.moduleId}>
                                                {m.depth > 0 ? `${'— '.repeat(m.depth)}` : ''}{m.displayName} ({m.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm"><FaSave /> Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper pour formatage du nom de la permission
function formatPermName(name) {
    if (!name) return '';
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default AdminAccessManagement;
