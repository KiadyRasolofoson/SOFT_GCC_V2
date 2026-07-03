import { useNavigate } from "react-router-dom";
import Template from "../../Template";

function UserManagement() {
    const navigate = useNavigate();

    const handleUsersClick = () => {
        navigate("/users-list");
    };

    const handleRolesClick = () => {
        navigate("/roles-management");
    };

    const handlePermissionsClick = () => {
        navigate("/permissions-management");
    };

    return (
        <Template>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-md-12 grid-margin">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="font-weight-bold mb-0">
                                <i className="mdi mdi-account-key menu-icon"></i> Gestion des Utilisateurs
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Carte Gestion des Utilisateurs */}
                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handleUsersClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-account-multiple settings-icon"></i>
                                    <span className='settings-title'>Gestion des Utilisateurs</span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    {/* Carte Gestion des Rôles */}
                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handleRolesClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-account-settings settings-icon"></i>
                                    <span className='settings-title'>Gestion des Rôles</span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    {/* Carte Gestion des Permissions */}
                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handlePermissionsClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-shield-account settings-icon"></i>
                                    <span className='settings-title'>Gestion des Permissions</span>
                                </h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Template>
    );
}

export default UserManagement;