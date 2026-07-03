// src/components/RetourButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function CancelButton({ to }) {
    const navigate = useNavigate();

    const handleRetour = () => {
        navigate(`/softGcc/${to}`);
    };

    return (
        <button onClick={handleRetour} className="btn-outline-dark btn-fw" style={{ float: 'right' }}>
            <i className="mdi mdi-arrow-left-circle icon-cancel"></i>
            Retour
        </button>
    );
}

export default CancelButton;
