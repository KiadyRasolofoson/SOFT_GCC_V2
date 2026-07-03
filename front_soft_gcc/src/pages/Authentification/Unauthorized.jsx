import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Template from '../Template';

function Unauthorized() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Template>
            <div className="container-fluid">
                <div className="row justify-content-center">
                    <div className="col-md-6 text-center">
                        <h1 className="display-1 text-danger">403</h1>
                        <h2 className="mb-4">Accès Non Autorisé</h2>
                        <p className="lead mb-4">
                            Désolé, vous n'avez pas les permissions nécessaires pour accéder à cette page.
                        </p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate(-1)}
                        >
                            Retour à la page précédente
                        </button>
                    </div>
                </div>
            </div>
        </Template>
    );
}

export default Unauthorized; 