import React from 'react';
import FormattedDate from '../../helpers/FormattedDate';

function EmployeeInfosPanel({ profile }) {
  if (!profile) {
    return <div className="fiche-empty-state">Aucune information disponible.</div>;
  }

  const fullName = `${profile.name || ''} ${profile.firstName || ''}`.trim();
  const hiringDate = profile.hiringDate || profile.assignmentDate || profile.hiring_date;

  const fields = [
    { label: 'Employé', value: fullName || '—' },
    { label: 'Matricule', value: profile.registrationNumber || '—' },
    { label: 'Date de naissance', value: <FormattedDate date={profile.birthday} /> },
    { label: "Date d'embauche", value: <FormattedDate date={hiringDate} /> },
    { label: 'Département', value: profile.departmentName || '—' },
    { label: 'Poste actuel', value: profile.positionName || '—' },
    {
      label: 'Salaire de base',
      value: profile.baseSalary != null ? `${profile.baseSalary} Ar` : '—',
    },
    {
      label: 'Salaire net',
      value: profile.netSalary != null ? `${profile.netSalary} Ar` : '—',
    },
    { label: 'Email', value: profile.email || '—' },
    {
      label: 'Dernière mise à jour compétences',
      value: <FormattedDate date={profile.updatedDate} />,
    },
    {
      label: 'Compétences',
      value: profile.skillNumber ?? 0,
    },
    {
      label: 'Diplômes & formations',
      value: profile.educationNumber ?? 0,
    },
    {
      label: 'Langues',
      value: profile.languageNumber ?? 0,
    },
    {
      label: 'Autres formations',
      value: profile.otherFormationNumber ?? 0,
    },
  ];

  return (
    <div className="fiche-card">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-information-outline" />
          Détails de l&apos;employé
        </h5>
      </div>
      <div className="fiche-card-body">
        <div className="fiche-info-grid">
          {fields.map((field) => (
            <div key={field.label} className="fiche-info-item">
              <span className="fiche-identity-label">{field.label}</span>
              <span className="fiche-identity-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmployeeInfosPanel;
