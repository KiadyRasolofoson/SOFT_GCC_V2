import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import LoaderComponent from '../../helpers/LoaderComponent';
import AttestationHistory from '../../pages/certificateManagement/AttestationHistory';

function History({ registrationNumber }) {
  const [isLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (isLoading) {
    return <LoaderComponent />;
  }

  return (
    <div className="fiche-card fiche-career-card">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-history" />
          Historiques d&apos;attestation
        </h5>
      </div>
      <div className="fiche-card-body">
        {successMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        <AttestationHistory registrationNumber={registrationNumber} embedded />
      </div>
    </div>
  );
}

export default History;
