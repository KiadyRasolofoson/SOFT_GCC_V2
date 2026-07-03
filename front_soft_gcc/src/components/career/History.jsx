import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap'; // Utilisation d'Alert de React-Bootstrap
import LoaderComponent from '../../helpers/LoaderComponent';
import './tooltip.css';
import AttestationHistory from '../../pages/certificateManagement/AttestationHistory';

function History({ registrationNumber }) {
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null); 
    const [successMessage, setSuccessMessage] = useState(null); // État pour le message de succès

    // Réinitialise les messages après un certain temps
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000); // Cache le message après 5 secondes

            return () => clearTimeout(timer); // Nettoyage
        }
    }, [successMessage, error]);

    if (isLoading) {
        return <LoaderComponent />;
    }

    return (
        <div className="row">
            <div className="col-lg-12 grid-margin">
                {successMessage && (
                    <Alert variant="success" className="mb-4">
                        {successMessage}
                    </Alert>
                )}
                {error && (
                    <Alert variant="danger" className="mb-4">
                        {error}
                    </Alert>
                )}
                <AttestationHistory  registrationNumber={registrationNumber} />
            </div>
        </div>
    );
}

export default History;
