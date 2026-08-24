import React from 'react';
import ModelEdit from '../../pages/certificateManagement/ModelEdit';

function Certificate({ dataEmployee }) {
  return (
    <div className="fiche-card fiche-career-card">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-file-document-edit" />
          Génération d&apos;attestation
        </h5>
      </div>
      <div className="fiche-card-body fiche-attestation-body pt-3">
        <ModelEdit dataEmployee={dataEmployee} compact />
      </div>
    </div>
  );
}

export default Certificate;
