import { useState, useEffect, useRef } from 'react';
import Template from '../../Template';
import axios from 'axios';

function UsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        roleId: '',
        password: '',
        departmentId: '',
        positionId: ''
    });
    const [roles, setRoles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [error, setError] = useState(null);
    
    // Référence pour le timer de debounce
    const searchTimerRef = useRef(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [currentPage, pageSize]);
    
    // Effet séparé pour la recherche avec délai (debounce)
    useEffect(() => {
        // Annuler le timer précédent s'il existe
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        
        // Ne déclencher la recherche que si le champ n'est pas vide ou a été vidé
        // (éviter les recherches inutiles au chargement initial)
        if (searchQuery !== undefined) {
            // Définir un nouveau timer (500ms de délai)
            searchTimerRef.current = setTimeout(() => {
                fetchUsers();
            }, 500);
        }
        
        // Nettoyer le timer lors du démontage du composant
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [searchQuery]);

    // Effet pour remettre la page à 1 lorsque la recherche change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Afficher les paramètres envoyés à l'API pour le débogage
            console.log("Paramètres de la requête:", {
                pageNumber: currentPage,
                pageSize: pageSize,
                search: searchQuery
            });
            
            // Inclure tous les paramètres dans la requête API
            const response = await axios.get('https://localhost:7082/api/User/paginated', {
                params: {
                    pageNumber: currentPage,
                    pageSize: pageSize,
                    search: searchQuery
                }
            });
            console.log("Réponse de l'API:", response.data);
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            setError("Erreur lors du chargement des utilisateurs: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('https://localhost:7082/api/User/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des rôles:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentUser) {
                const userId = currentUser.userId || currentUser.id;
                console.log("ID utilisateur pour mise à jour:", userId);
                console.log("Données envoyées pour mise à jour:", formData);
                
                await axios.post(`https://localhost:7082/api/Authentification/update`, {
                    userId: userId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    email: formData.email,
                    roleId: parseInt(formData.roleId)
                });
            } else {
                await axios.post('https://localhost:7082/api/Authentification/register', {
                    lastName: formData.lastName,
                    firstName: formData.firstName,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    roleId: parseInt(formData.roleId)
                });
            }
            setShowModal(false);
            fetchUsers();
            resetForm();
            alert(currentUser ? 'Utilisateur modifié avec succès' : 'Utilisateur ajouté avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            if (error.response) {
                console.error('Détails de l\'erreur:', error.response.data);
                alert(`Erreur: ${error.response.data.message || 'Une erreur est survenue'}`);
            } else {
                alert('Erreur de connexion au serveur');
            }
        }
    };

    const handleEdit = (user) => {
        console.log("Données utilisateur pour édition:", user);
        setCurrentUser(user);
        
        // Convertir explicitement le roleId en chaîne pour le select
        const roleIdString = user.roleId ? user.roleId.toString() : "";
        
        setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            username: user.username || "",
            email: user.email || "",
            roleId: roleIdString,
            password: '' // Le mot de passe n'est pas rempli pour l'édition
        });
        
        console.log("FormData initalisée pour l'édition:", {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            username: user.username || "",
            email: user.email || "",
            roleId: roleIdString
        });
        
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await axios.delete(`https://localhost:7082/api/User/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue lors de la suppression'}`);
            }
        }
    };

    const resetForm = () => {
        setCurrentUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            roleId: '',
            password: ''
        });
    };

    // Fonction pour gérer la recherche avec un délai
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        // Ne pas changer currentPage ici, c'est géré par l'effet useEffect
    };

    // Fonction pour réinitialiser les filtres tout en préservant la position de défilement
    const resetFilters = () => {
        if (searchQuery !== '') {
            // Sauvegarder la position de défilement actuelle
            const scrollPosition = window.scrollY;
            
            setSearchQuery('');
            
            // Restaurer la position de défilement après la mise à jour du DOM
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'auto'
                });
            }, 100);
        }
    };
    
    // Fonction pour gérer le changement du nombre d'éléments par page
    const handlePageSizeChange = (e) => {
        // Sauvegarder la position de défilement actuelle
        const scrollPosition = window.scrollY;
        
        const newSize = parseInt(e.target.value);
        // Calculer le premier élément visible dans la vue actuelle
        const currentTopItem = (currentPage - 1) * pageSize + 1;
        // Calculer la nouvelle page qui contiendra cet élément
        const newPage = Math.max(1, Math.ceil(currentTopItem / newSize));
        
        setPageSize(newSize);
        setCurrentPage(newPage);
        
        // Restaurer la position de défilement après le rendu
        setTimeout(() => {
            window.scrollTo({
                top: scrollPosition,
                behavior: 'auto'
            });
        }, 100);
    };

    // Fonction pour changer de page
    const changePage = (newPage) => {
        // Enregistrer la position actuelle dans la page
        const cardTop = document.querySelector('.card').getBoundingClientRect().top + window.scrollY;
        
        setCurrentPage(newPage);
        
        // Revenir au début de la liste après le changement de page
        setTimeout(() => {
            window.scrollTo({
                top: cardTop,
                behavior: 'smooth'
            });
        }, 100);
    };

    return (
        <Template>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-md-12 grid-margin">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="font-weight-bold mb-0">
                                <i className="mdi mdi-account-multiple menu-icon"></i> Gestion des Utilisateurs
                            </h4>
                        </div>

                        {error && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Chargement...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="row">
                            <div className="col-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-header title-container d-flex justify-content-between align-items-center">
                                        <h5 className="title mb-0">
                                            <i className="mdi mdi-account-search"></i> Recherche d&apos;utilisateurs
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group mb-0">
                                                    <label htmlFor="searchQuery" className="form-label">Rechercher par nom, prénom ou nom d&apos;utilisateur</label>
                                                    <input
                                                        type="text"
                                                        id="searchQuery"
                                                        className="form-control"
                                                        placeholder="Rechercher un utilisateur..."
                                                        value={searchQuery}
                                                        onChange={handleSearchChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-2 d-flex align-items-end">
                                                <button
                                                    className="btn btn-outline-secondary w-100"
                                                    style={{ height: '38px' }}
                                                    onClick={resetFilters}
                                                >
                                                    <i className="mdi mdi-refresh"></i> Réinitialiser
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12 grid-margin">
                                <div className="card">
                                    <div className="card-header title-container d-flex justify-content-between align-items-center">
                                        <h5 className="title mb-0">
                                            <i className="mdi mdi-format-list-bulleted"></i> Liste des Utilisateurs ({users.length})
                                        </h5>
                                        <button
                                            className="btn btn-primary btn-sm d-flex align-items-center"
                                            onClick={() => {
                                                resetForm();
                                                setShowModal(true);
                                            }}
                                            title="Ajouter un nouvel utilisateur"
                                            style={{ gap: '5px' }}
                                        >
                                            <i className="mdi mdi-account-plus"></i> Nouvel utilisateur
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        {users.length === 0 ? (
                                            <div className="alert alert-info">
                                                Aucun utilisateur trouvé.
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover table-striped">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th scope="col" style={{ width: '50px' }}>#</th>
                                                            <th scope="col">Nom</th>
                                                            <th scope="col">Prénom</th>
                                                            <th scope="col">Nom d&apos;utilisateur</th>
                                                            <th scope="col">Rôle</th>
                                                            <th scope="col" className="text-center" style={{ width: '100px' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.map((user, index) => (
                                                            <tr key={user.userId}>
                                                                <td>{index + 1 + (currentPage - 1) * pageSize}</td>
                                                                <td>{user.lastName}</td>
                                                                <td>{user.firstName}</td>
                                                                <td>{user.username || "Pas de pseudo"}</td>
                                                                <td>{roles.find(role => role.roleId === user.roleId)?.name}</td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-outline-success btn-sm me-1"
                                                                        onClick={() => handleEdit(user)}
                                                                        title="Modifier"
                                                                    >
                                                                        <i className="mdi mdi-pencil"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={() => handleDelete(user.userId)}
                                                                        title="Supprimer"
                                                                    >
                                                                        <i className="mdi mdi-delete"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-center align-items-center mt-4">
                                            <div className="pagination-controls d-flex align-items-center">
                                                <button
                                                    onClick={() => changePage(Math.max(currentPage - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="btn btn-sm me-2"
                                                    style={{ 
                                                        minWidth: '100px', 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    <i className="mdi mdi-chevron-left"></i> Précédent
                                                </button>
                                                <span className="mx-3">
                                                    Page {currentPage} sur {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="btn btn-sm me-3"
                                                    style={{ 
                                                        minWidth: '100px', 
                                                        border: '1px solid #ced4da',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                >
                                                    Suivant <i className="mdi mdi-chevron-right"></i>
                                                </button>
                                                <select
                                                    value={pageSize}
                                                    onChange={handlePageSizeChange}
                                                    className="form-select form-select-sm" 
                                                    style={{ width: '120px' }}
                                                >
                                                    <option value={5}>5 par page</option>
                                                    <option value={10}>10 par page</option>
                                                    <option value={20}>20 par page</option>
                                                    <option value={50}>50 par page</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal pour ajouter/modifier un utilisateur */}
                        {showModal && (
                            <div className="modal fade show"
                                style={{
                                    display: 'block',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    paddingRight: '17px',
                                    overflow: 'scroll'
                                }}
                                tabIndex="-1"
                                onClick={(e) => {
                                    // Fermer le modal si on clique en dehors du contenu
                                    if (e.target.className.includes('modal fade show')) {
                                        setShowModal(false);
                                    }
                                }}
                            >
                                <div className="modal-dialog modal-lg modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">
                                                <i className={`mdi ${currentUser ? 'mdi-account-edit' : 'mdi-account-plus'}`}></i> {currentUser ? 'Modifier' : 'Ajouter'} un utilisateur
                                            </h5>
                                            <button type="button" className="close text-dark" onClick={() => setShowModal(false)}>
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={handleSubmit}>
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label className="form-label">
                                                                <i className="mdi mdi-account"></i> Nom
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={formData.lastName}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, lastName: e.target.value })
                                                                }
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label className="form-label">
                                                                <i className="mdi mdi-account-outline"></i> Prénom
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={formData.firstName}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, firstName: e.target.value })
                                                                }
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label className="form-label">
                                                                <i className="mdi mdi-account-card-details"></i> Nom d&apos;utilisateur
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={formData.username}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, username: e.target.value })
                                                                }
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label className="form-label">
                                                                <i className="mdi mdi-email"></i> Email
                                                            </label>
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                value={formData.email}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, email: e.target.value })
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label className="form-label">
                                                                <i className="mdi mdi-clipboard-account"></i> Rôle
                                                            </label>
                                                            <select
                                                                className="form-control form-select"
                                                                value={formData.roleId}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, roleId: e.target.value })
                                                                }
                                                                required
                                                            >
                                                                <option value="">Sélectionner un rôle</option>
                                                                {roles.map((role) => (
                                                                    <option key={role.roleId} value={role.roleId}>
                                                                        {role.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {!currentUser && (
                                                        <div className="col-md-6">
                                                            <div className="form-group">
                                                                <label className="form-label">
                                                                    <i className="mdi mdi-key"></i> Mot de passe
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={formData.password}
                                                                    onChange={(e) =>
                                                                        setFormData({ ...formData, password: e.target.value })
                                                                    }
                                                                    required={!currentUser}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </form>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-light btn-fw" onClick={() => setShowModal(false)}>
                                                <i className="mdi mdi-close-circle"></i> Annuler
                                            </button>
                                            <button type="button" className="btn btn-success btn-fw" onClick={handleSubmit}>
                                                <i className="mdi mdi-content-save"></i> {currentUser ? 'Mettre à jour' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Template>
    );
}

export default UsersList;