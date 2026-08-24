import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Template from '../Template';
import { FaShieldAlt, FaArrowLeft, FaHome } from 'react-icons/fa';

const DEFAULT_TITLE = 'Permission refusée';
const DEFAULT_MESSAGE =
    "Vous n'avez pas les droits nécessaires pour accéder à cette page ou effectuer cette action.";
const DEFAULT_HINT =
    "Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur pour vérifier les permissions de votre profil.";

function Unauthorized() {
    const location = useLocation();
    const navigate = useNavigate();

    const title = location.state?.title || DEFAULT_TITLE;
    const message = location.state?.message || DEFAULT_MESSAGE;
    const fromPath = location.state?.from?.pathname;

    return (
        <Template>
            <div className="container-fluid px-3 py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-4 p-md-5">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                    style={{
                                        width: 72,
                                        height: 72,
                                        background: 'rgba(220, 53, 69, 0.1)',
                                        color: '#dc3545'
                                    }}
                                >
                                    <FaShieldAlt size={32} />
                                </div>

                                <p className="text-muted text-uppercase small fw-semibold mb-2 letter-spacing">
                                    Erreur 403
                                </p>
                                <h2 className="fw-bold mb-3">{title}</h2>
                                <p className="lead text-secondary mb-2">{message}</p>
                                <p className="text-muted small mb-4">{DEFAULT_HINT}</p>

                                {fromPath && (
                                    <p className="small text-muted mb-4">
                                        Page demandée : <code>{fromPath}</code>
                                    </p>
                                )}

                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        <FaArrowLeft className="me-2" />
                                        Page précédente
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => navigate('/soft-gcc/tableau-de-bord')}
                                    >
                                        <FaHome className="me-2" />
                                        Accueil
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Template>
    );
}

export default Unauthorized;
