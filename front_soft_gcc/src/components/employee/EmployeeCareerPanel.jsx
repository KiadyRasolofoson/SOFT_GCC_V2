import React, { useState } from 'react';
import AffectationList from '../career/AffectationList';
import Certificate from '../career/Certificate';
import History from '../career/History';

function EmployeeCareerPanel({
  registrationNumber,
  careerEmployee,
  dataAssignmentAppointment,
  dataAssignmentAdvancement,
  dataAssignmentAvailability,
  fetchCareerData,
}) {
  const [subTab, setSubTab] = useState('suivi');

  if (!registrationNumber) {
    return (
      <div className="fiche-empty-state">
        Impossible de charger l&apos;espace carrières : matricule introuvable.
      </div>
    );
  }

  const subTabs = [
    { id: 'suivi', label: 'Suivi carrière', icon: 'mdi-timeline-text' },
    { id: 'attestation', label: "Génération d'attestation", icon: 'mdi-file-document-edit' },
    { id: 'historique', label: "Historiques d'attestation", icon: 'mdi-history' },
  ];

  return (
    <div className="fiche-career-panel">
      <div className="fiche-subtabs" role="tablist" aria-label="Sections carrières">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={subTab === tab.id}
            className={`fiche-subtab${subTab === tab.id ? ' active' : ''}`}
            onClick={() => setSubTab(tab.id)}
          >
            <i className={`mdi ${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="fiche-career-content">
        {subTab === 'attestation' && <Certificate dataEmployee={careerEmployee || {}} />}
        {subTab === 'historique' && <History registrationNumber={registrationNumber} />}
        {subTab === 'suivi' && (
          <AffectationList
            dataAssignmentAppointment={dataAssignmentAppointment}
            dataAssignmentAdvancement={dataAssignmentAdvancement}
            dataAssignmentAvailability={dataAssignmentAvailability}
            fetchData={fetchCareerData}
          />
        )}
      </div>
    </div>
  );
}

export default EmployeeCareerPanel;
