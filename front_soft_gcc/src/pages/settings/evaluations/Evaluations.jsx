import { useNavigate } from "react-router-dom";
import Template from "../../Template";
import { useUser } from "../../Authentification/UserContext";
import PermissionService from "../../../services/PermissionService";

function Evaluations() {
    const navigate = useNavigate();
    const { hasPermission } = useUser();

    const handleQuestionsClick = () => {
        navigate("/EvaluationQuestionSettings");
    };

    const handleFormationClick = () => {
        navigate("/EvaluationFormationSettings");
    };

    const handleAdminClick = () => {
        navigate("/EvaluationAdminSettings");
    };

    const handleEvaluationTypesClick = () => {
        navigate("/EvaluationTypesSettings");
    };

    // Vérifier si l'utilisateur a les permissions pour accéder à l'interface d'administration
    const canAccessAdmin = PermissionService.hasFunctionalPermission(hasPermission, 'EVAL_SETTINGS');

    return (
        <Template>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-md-12 grid-margin">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="font-weight-bold mb-0">
                                <i className="mdi mdi-cog-outline menu-icon"></i> Paramètres d&apos;Évaluation
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handleQuestionsClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-clipboard-text-outline settings-icon"></i>
                                    <span className='settings-title'>Questionnaires d&apos;évaluation</span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handleFormationClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-school-outline settings-icon"></i>
                                    <span className='settings-title'>Suggestions de Formations</span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 grid-margin stretch-card">
                        <div className="card settings-card" onClick={handleEvaluationTypesClick}>
                            <div className="card-body">
                                <h5 className="card-text">
                                    <i className="mdi mdi-format-list-bulleted-type settings-icon"></i>
                                    <span className='settings-title'>Types d&apos;Évaluation</span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    {canAccessAdmin && (
                        <div className="col-md-4 grid-margin stretch-card">
                            <div className="card settings-card" onClick={handleAdminClick}>
                                <div className="card-body">
                                    <h5 className="card-text">
                                        <i className="mdi mdi-tune settings-icon"></i>
                                        <span className='settings-title'>Administration</span>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Template>
    );
}

export default Evaluations;