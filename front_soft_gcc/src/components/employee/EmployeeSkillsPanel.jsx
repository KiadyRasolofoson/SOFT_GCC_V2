import React from 'react';
import CardSkills from '../salarySkills/CardSkills';
import SkillSalaryChart from '../salarySkills/SkillSalaryChart';

function EmployeeSkillsPanel({ employeeId, skillsDescription }) {
  if (!employeeId) {
    return (
      <div className="fiche-empty-state">
        Impossible de charger l&apos;espace compétences : identifiant employé introuvable.
      </div>
    );
  }

  if (!skillsDescription) {
    return (
      <div className="fiche-empty-state">
        Aucune donnée de compétences disponible pour cet employé.
      </div>
    );
  }

  return (
    <div className="row fiche-main-row skills-profile">
      <div className="col-lg-8">
        <CardSkills dataEmployeeDescription={skillsDescription} idEmployee={employeeId} />
      </div>
      <div className="col-lg-4">
        <SkillSalaryChart employeeId={employeeId} />
      </div>
    </div>
  );
}

export default EmployeeSkillsPanel;
