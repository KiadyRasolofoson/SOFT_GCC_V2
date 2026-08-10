import React from 'react';
import FormattedDate from '../../helpers/FormattedDate';
import pic1 from '/src/assets/images/male-default.webp';
import { urlApi } from '../../helpers/utils';

function EmployeeIdentityCard({ profile, compact = false }) {
  if (!profile) return null;

  const fullName = `${profile.name || ''} ${profile.firstName || ''}`.trim();
  const photoSrc =
    profile.photo && profile.employeeId
      ? urlApi(`/Employee/photo/${profile.employeeId}`)
      : pic1;

  const hiringDate = profile.hiringDate || profile.assignmentDate || profile.hiring_date;
  const chips = [
    { label: 'Compétences', value: profile.skillNumber ?? 0, icon: 'mdi-briefcase-check' },
    { label: 'Diplômes', value: profile.educationNumber ?? 0, icon: 'mdi-school' },
    { label: 'Langues', value: profile.languageNumber ?? 0, icon: 'mdi-translate' },
    { label: 'Autres', value: profile.otherFormationNumber ?? 0, icon: 'mdi-certificate' },
  ];

  return (
    <div className="fiche-card">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-account-card-details" />
          Informations salarié
        </h5>
      </div>
      <div className="fiche-card-body">
        <div className="fiche-identity">
          <img
            className="fiche-identity-photo"
            src={photoSrc}
            alt={fullName || profile.registrationNumber || 'Employé'}
          />

          <div className="fiche-identity-main">
            <h2 className="fiche-identity-name">{fullName || '—'}</h2>
            <p className="fiche-identity-matricule">
              Matricule : {profile.registrationNumber || '—'}
            </p>

            <div className="fiche-identity-grid">
              <div className="fiche-identity-field">
                <span className="fiche-identity-label">Date de naissance</span>
                <span className="fiche-identity-value">
                  <FormattedDate date={profile.birthday} />
                </span>
              </div>
              <div className="fiche-identity-field">
                <span className="fiche-identity-label">Date d&apos;embauche</span>
                <span className="fiche-identity-value">
                  <FormattedDate date={hiringDate} />
                </span>
              </div>
              <div className="fiche-identity-field">
                <span className="fiche-identity-label">Département</span>
                <span className="fiche-identity-value">{profile.departmentName || '—'}</span>
              </div>
              <div className="fiche-identity-field">
                <span className="fiche-identity-label">Poste actuel</span>
                <span className="fiche-identity-value">{profile.positionName || '—'}</span>
              </div>
              {!compact && (
                <>
                  <div className="fiche-identity-field">
                    <span className="fiche-identity-label">Salaire de base</span>
                    <span className="fiche-identity-value">
                      {profile.baseSalary != null ? `${profile.baseSalary} Ar` : '—'}
                    </span>
                  </div>
                  <div className="fiche-identity-field">
                    <span className="fiche-identity-label">Email</span>
                    <span className="fiche-identity-value">{profile.email || '—'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="fiche-chips">
              {chips.map((chip) => (
                <span key={chip.label} className="fiche-chip">
                  <i className={`mdi ${chip.icon}`} />
                  <strong>{chip.value}</strong> {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeIdentityCard;
