import React, { useState, useEffect } from 'react';
import Template from '../../Template';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useUser } from '../../Authentification/UserContext';

function RolesManagement() {
    const { hasPermission } = useUser();
    const [roles, setRoles] = useState([]);
    const [setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://localhost:7082/api/Role');
            setRoles(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des rôles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await axios.get('https://localhost:7082/api/Permission');
            // Filtrer les permissions pour ne montrer que celles que la RH peut gérer
            const filteredPermissions = response.data.filter(permission => 
                !permission.name.includes('MANAGE_SYSTEM')
            );
            setPermissions(filteredPermissions);
        } catch (error) {
            console.error('Erreur lors de la récupération des permissions:', error);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    // Vérification des permissions après les useEffect
    if (!hasPermission('MANAGE_ROLES')) {
        return (
            <Template>
                <div className="container mt-4">
                    <div className="alert alert-danger">
                        <h4>Accès non autorisé</h4>
                        <p>Cette section est réservée aux administrateurs RH uniquement.</p>
                        <p>Si vous pensez que c&apos;est une erreur, veuillez contacter votre administrateur système.</p>
                    </div>
                </div>
            </Template>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentRole) {
                await axios.put(`https://localhost:7082/api/Role/${currentRole.id}`, formData);
            } else {
                await axios.post('https://localhost:7082/api/Role', formData);
            }
            fetchRoles();
            setShowModal(false);
            setFormData({ name: '', description: '' });
            setCurrentRole(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du rôle:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
            try {
                await axios.delete(`https://localhost:7082/api/Role/${id}`);
                fetchRoles();
            } catch (error) {
                console.error('Erreur lors de la suppression du rôle:', error);
            }
        }
    };

    const handleEdit = (role) => {
        setCurrentRole(role);
        setFormData({
            name: role.title,
            description: role.state
        });
        setShowModal(true);
    };

    const filteredRoles = roles.filter(role =>
        role && role.title && role.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Template>
            <div className="container mt-4">
                <h2>Gestion des Rôles</h2>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher un rôle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className="btn btn-primary mb-3"
                    onClick={() => {
                        setCurrentRole(null);
                        setFormData({ name: '', description: '' });
                        setShowModal(true);
                    }}
                >
                    <FaPlus /> Nouveau Rôle
                </button>

                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>État</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="text-center">Chargement...</td>
                                </tr>
                            ) : filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center">Aucun rôle trouvé</td>
                                </tr>
                            ) : (
                                filteredRoles.map(role => (
                                    <tr key={role.role_id}>
                                        <td>{role.title}</td>
                                        <td>{role.state}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-warning me-2"
                                                onClick={() => handleEdit(role)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(role.role_id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {currentRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Titre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">État</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary">
                                            {currentRole ? 'Modifier' : 'Créer'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Template>
    );
}

export default RolesManagement; 