import React from 'react';

import FormattedDate from '../../helpers/FormattedDate';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import pic1 from '/src/assets/images/male-default.webp';
import { urlApi } from '../../helpers/utils';

// Gerer le contenu de la description d'un salarie
function SalaryDescription({ dataEmployeeDescription }) {
  return (
    <div className="row">
        <div className="col-lg-7 grid-margin stretch-card">
          <div className="card">
            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
              <i className="mdi mdi-note-text me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
              <h3 className="mb-0" style={{color: '#B8860B'}}> Description </h3>
            </div>
            <div className="card-body">
              <div className='col-md-3 image-profil'>
                {dataEmployeeDescription.photo ? (
                  <img src={urlApi(`/Employee/photo/${dataEmployeeDescription.employeeId}`)} 
                  alt={'Employe '+dataEmployeeDescription.registrationNumber} width={180} 
                  style={{ borderRadius: '10px'}} />
                ) : (
                  <img
                    src={pic1}
                    alt={dataEmployeeDescription.registrationNumber}
                    width={180}
                  />
                )}
              </div>
              <div className="col-md-9">
                <p><strong className="label-title-salary">Employé :</strong><span className="value-profil">{dataEmployeeDescription.name+" "+dataEmployeeDescription.firstName}</span></p>
                <p><strong className="label-title-salary">Matricule :</strong><span className="value-profil">{dataEmployeeDescription.registrationNumber}</span></p>
                <p><strong className="label-title-salary">Date naissance :</strong><span className="value-profil"><FormattedDate date={dataEmployeeDescription.birthday} /></span></p>
                <p><strong className="label-title-salary">Date d'embauche :</strong><span className="value-profil"><FormattedDate date={dataEmployeeDescription.hiringDate} /></span></p>
                <p><strong className="label-title-salary">Derniere mise a jour :</strong><span className="value-profil"><FormattedDate date={dataEmployeeDescription.updatedDate} /></span></p>
                <p><strong className="label-title-salary">Departement :</strong><span className="value-profil">{dataEmployeeDescription.departmentName}</span></p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default SalaryDescription;
