import React, { useState }  from 'react';
import useSWR from 'swr';
import Fetcher from '../Fetcher';

// Formulaire de saisie de type nomination
function AppointmentForm({ formData, setFormData }) {
  // Réuperation des données depuis l'api
  const { data: dataEstablishment } = useSWR('/Establishment', Fetcher);
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);
  const { data: dataEmployeeType } = useSWR('/EmployeeType', Fetcher);
  const { data: dataSocioCategoryProfessional } = useSWR('/SocioCategoryProfessional', Fetcher);
  const { data: dataIndication } = useSWR('/Indication', Fetcher);
  const { data: dataProfessionalCategory } = useSWR('/ProfessionalCategory', Fetcher);
  const { data: dataLegalClass } = useSWR('/LegalClass', Fetcher);
  const { data: dataNewsLetterTemplate } = useSWR('/NewsLetterTemplate', Fetcher);
  const { data: dataPaymentMethod } = useSWR('/PaymentMethod', Fetcher);
  const [formDateEndContract, setFormDateEndContract] = useState(false); 

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
        ...prevData,
        [name]: value,
    }));
  };

  // Gestion des changements sur la selection du champ type de contrat
  const handleChangeContractType = (e) => {
    if(e.target.value === '1') setFormDateEndContract(true);
    else setFormDateEndContract(false);

    const { name, value } = e.target;
    setFormData((prevData) => ({
        ...prevData,
        [name]: value,
    }));
  };

  return (
          <div className="row">            
            <div className="col-md-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title" 
                    style={{
                      color: '#B8860B',  
                      borderBottom: '2px solid #B8860B', 
                      paddingBottom: '5px'
                    }}
                  >Nomination</h4>
                                
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Etablissement</label>
                    <select name="establishmentId" value={formData.establishmentId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une etablissement</option>
                      {dataEstablishment && dataEstablishment.map((item, id) => (
                        <option key={item.establishmentId} value={item.establishmentId}>
                          {item.establishmentName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Departement</label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner un departement</option>
                      {dataDepartment && dataDepartment.map((item, id) => (
                        <option key={item.departmentId} value={item.departmentId}>
                          {item.name}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Poste</label>
                    <select name="positionId" value={formData.positionId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une poste</option>
                      {dataPosition && dataPosition.map((item, id) => (
                        <option key={item.positionId} value={item.positionId}>
                          {item.positionName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Type de contrat</label>
                    <select name="employeeTypeId" value={formData.employeeTypeId} onChange={handleChangeContractType} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner un type de contrat</option>
                      {dataEmployeeType && dataEmployeeType.map((item, id) => (
                        <option key={item.employeeTypeId} value={item.employeeTypeId}>
                          {item.employeeTypeName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Indice</label>
                    <select name="indicationId" value={formData.indicationId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une indice</option>
                      {dataIndication && dataIndication.map((item, id) => (
                        <option key={item.indicationId} value={item.indicationId}>
                          {item.indicationName}
                        </option>
                      ))}
                    </select>    
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title" 
                    style={{
                      color: '#B8860B',  
                      borderBottom: '2px solid #B8860B', 
                      paddingBottom: '5px'
                    }}
                  >Nomination</h4>

                  <div className="form-group">
                    <label htmlFor="exampleInputEmail1">Salaire de base</label>
                    <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="form-control" id="decimalInput" step="0.01" min="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputEmail1">Salaire net</label>
                    <input type="number" name="netSalary" value={formData.netSalary} onChange={handleChange} className="form-control" id="decimalInput" step="0.01" min="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Catégorie professionnelle</label>
                    <select name="professionalCategoryId" value={formData.professionalCategoryId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une categorie professionnelle</option>
                      {dataProfessionalCategory && dataProfessionalCategory.map((item, id) => (
                        <option key={item.professionalCategoryId} value={item.professionalCategoryId}>
                          {item.professionalCategoryName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Classe légale</label>
                    <select name="legalClassId" value={formData.legalClassId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une classe legale</option>
                      {dataLegalClass && dataLegalClass.map((item, id) => (
                        <option key={item.legalClassId} value={item.legalClassId}>
                          {item.legalClassName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Modèle de bulletin</label>
                    <select name="newsletterTemplateId" value={formData.newsletterTemplateId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner une modele de bulletin</option>
                      {dataNewsLetterTemplate && dataNewsLetterTemplate.map((item, id) => (
                        <option key={item.newsletterTemplateId} value={item.newsletterTemplateId}>
                          {item.newsletterTemplateName}
                        </option>
                      ))}
                    </select>    
                  </div>
                  <div className="form-group">
                    <label htmlFor="exampleInputUsername1">Modes de paiement</label>
                    <select name="paymentMethodId" value={formData.paymentMethodId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                      <option value="">Sélectionner un mode de paiement</option>
                      {dataPaymentMethod && dataPaymentMethod.map((item, id) => (
                        <option key={item.paymentMethodId} value={item.paymentMethodId}>
                          {item.paymentMethodName}
                        </option>
                      ))}
                    </select>    
                  </div>

                  {formDateEndContract ? (
                    <div className="form-group">
                      <label htmlFor="exampleInputEmail1">Fin contrat</label>
                      <input type="date" name="endingContract" value={formData.endingContract} onChange={handleChange} className="form-control" id="decimalInput" />
                    </div>
                  ) : (
                    <div className="form-group"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
  );
}

export default AppointmentForm;
