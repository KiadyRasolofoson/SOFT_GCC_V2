import React from 'react';
import FormattedDate from '../../helpers/FormattedDate';
import pic1 from '/src/assets/images/male-default.webp';
import { urlApi } from '../../helpers/utils';

function SalaryDescription({ dataEmployeeDescription }) {
  const fullName = `${dataEmployeeDescription.name || ''} ${dataEmployeeDescription.firstName || ''}`.trim();
  const photoSrc = dataEmployeeDescription.photo
    ? urlApi(`/Employee/photo/${dataEmployeeDescription.employeeId}`)
    : pic1;

  const chips = [
    { label: 'Compétences', value: dataEmployeeDescription.skillNumber ?? 0, icon: 'mdi-briefcase-check' },
    { label: 'Diplômes', value: dataEmployeeDescription.educationNumber ?? 0, icon: 'mdi-school' },
    { label: 'Langues', value: dataEmployeeDescription.languageNumber ?? 0, icon: 'mdi-translate' },
    { label: 'Autres', value: dataEmployeeDescription.otherFormationNumber ?? 0, icon: 'mdi-certificate' },
  ];

  return (
    <div className="skills-card">
      <div className="skills-card-header">
        <h5>
          <i className="mdi mdi-account-card-details" />
          Informations salarié
        </h5>
      </div>
      <div className="skills-card-body">
        <div className="skills-identity">
          <img
            className="skills-identity-photo"
            src={photoSrc}
            alt={fullName || dataEmployeeDescription.registrationNumber || 'Employé'}
          />

          <div className="skills-identity-main">
            <h2 className="skills-identity-name">{fullName || '—'}</h2>
            <p className="skills-identity-matricule">
              Matricule : {dataEmployeeDescription.registrationNumber || '—'}
            </p>

            <div className="skills-identity-grid">
              <div className="skills-identity-field">
                <span className="skills-identity-label">Date de naissance</span>
                <span className="skills-identity-value">
                  <FormattedDate date={dataEmployeeDescription.birthday} />
                </span>
              </div>
              <div className="skills-identity-field">
                <span className="skills-identity-label">Date d&apos;embauche</span>
                <span className="skills-identity-value">
                  <FormattedDate date={dataEmployeeDescription.hiringDate} />
                </span>
              </div>
              <div className="skills-identity-field">
                <span className="skills-identity-label">Département</span>
                <span className="skills-identity-value">
                  {dataEmployeeDescription.departmentName || '—'}
                </span>
              </div>
              <div className="skills-identity-field">
                <span className="skills-identity-label">Dernière mise à jour</span>
                <span className="skills-identity-value">
                  <FormattedDate date={dataEmployeeDescription.updatedDate} />
                </span>
              </div>
            </div>

            <div className="skills-chips">
              {chips.map((chip) => (
                <span key={chip.label} className="skills-chip">
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

export default SalaryDescription;
