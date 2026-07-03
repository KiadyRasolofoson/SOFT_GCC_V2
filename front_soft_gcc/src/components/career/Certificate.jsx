import React from 'react';
import ModelEdit from '../../pages/certificateManagement/ModelEdit';
import AttestationHistory from '../../pages/certificateManagement/AttestationHistory';

function Certificate({dataEmployee}) {

  return (
    <div>
      <ModelEdit dataEmployee={dataEmployee} />
    </div>
  );
}

export default Certificate;
