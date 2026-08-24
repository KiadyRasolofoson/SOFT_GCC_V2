import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Fetcher from '../Fetcher';
import SearchableSelect from '../common/SearchableSelect';

// Formulaire de saisie de type nomination
function AppointmentForm({ formData, setFormData }) {
  // Réuperation des données depuis l'api
  const { data: dataEstablishment } = useSWR('/Establishment', Fetcher);
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataPosition } = useSWR('/Position', Fetcher);
  const { data: dataEmployeeType } = useSWR('/EmployeeType', Fetcher);
  const { data: dataIndication } = useSWR('/Indication', Fetcher);
  const { data: dataProfessionalCategory } = useSWR('/ProfessionalCategory', Fetcher);
  const { data: dataLegalClass } = useSWR('/LegalClass', Fetcher);
  const { data: dataNewsLetterTemplate } = useSWR('/NewsLetterTemplate', Fetcher);
  const { data: dataPaymentMethod } = useSWR('/PaymentMethod', Fetcher);
  const [formDateEndContract, setFormDateEndContract] = useState(
    String(formData.employeeTypeId) === '1'
  );

  useEffect(() => {
    setFormDateEndContract(String(formData.employeeTypeId) === '1');
  }, [formData.employeeTypeId]);

  const positionOptions = useMemo(
    () =>
      (dataPosition || []).map((item) => ({
        value: item.positionId,
        label: item.positionName,
      })),
    [dataPosition]
  );

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePositionChange = (option) => {
    setFormData((prevData) => ({
      ...prevData,
      positionId: option ? option.value : undefined,
    }));
  };

  // Gestion des changements sur la selection du champ type de contrat
  const handleChangeContractType = (e) => {
    if (e.target.value === '1') setFormDateEndContract(true);
    else setFormDateEndContract(false);

    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="career-section">
      <div className="row g-3">
        <div className="col-md-6">
          <div className="career-card">
            <div className="career-card-header">
              <h5>
                <i className="mdi mdi-briefcase-check" />
                Nomination — Organisation
              </h5>
            </div>
            <div className="career-card-body">
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="establishmentId">
                  Établissement
                </label>
                <select
                  name="establishmentId"
                  id="establishmentId"
                  value={formData.establishmentId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un établissement</option>
                  {dataEstablishment &&
                    dataEstablishment.map((item) => (
                      <option key={item.establishmentId} value={item.establishmentId}>
                        {item.establishmentName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="departmentId">
                  Département
                </label>
                <select
                  name="departmentId"
                  id="departmentId"
                  value={formData.departmentId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un département</option>
                  {dataDepartment &&
                    dataDepartment.map((item) => (
                      <option key={item.departmentId} value={item.departmentId}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="positionId">
                  Poste
                </label>
                <SearchableSelect
                  name="positionId"
                  inputId="positionId"
                  options={positionOptions}
                  value={formData.positionId}
                  onChange={handlePositionChange}
                  placeholder="Rechercher un poste…"
                  noOptionsMessage={() => 'Aucun poste trouvé'}
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="employeeTypeId">
                  Type de contrat
                </label>
                <select
                  name="employeeTypeId"
                  id="employeeTypeId"
                  value={formData.employeeTypeId || ''}
                  onChange={handleChangeContractType}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un type de contrat</option>
                  {dataEmployeeType &&
                    dataEmployeeType.map((item) => (
                      <option key={item.employeeTypeId} value={item.employeeTypeId}>
                        {item.employeeTypeName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="indicationId">
                  Indice
                </label>
                <select
                  name="indicationId"
                  id="indicationId"
                  value={formData.indicationId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un indice</option>
                  {dataIndication &&
                    dataIndication.map((item) => (
                      <option key={item.indicationId} value={item.indicationId}>
                        {item.indicationName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="career-card">
            <div className="career-card-header">
              <h5>
                <i className="mdi mdi-currency-usd" />
                Nomination — Rémunération & classification
              </h5>
            </div>
            <div className="career-card-body">
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="baseSalary">
                  Salaire de base
                </label>
                <input
                  type="number"
                  name="baseSalary"
                  id="baseSalary"
                  value={formData.baseSalary ?? ''}
                  onChange={handleChange}
                  className="career-form-control"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="netSalary">
                  Salaire net
                </label>
                <input
                  type="number"
                  name="netSalary"
                  id="netSalary"
                  value={formData.netSalary ?? ''}
                  onChange={handleChange}
                  className="career-form-control"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="professionalCategoryId">
                  Catégorie professionnelle
                </label>
                <select
                  name="professionalCategoryId"
                  id="professionalCategoryId"
                  value={formData.professionalCategoryId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner une catégorie professionnelle</option>
                  {dataProfessionalCategory &&
                    dataProfessionalCategory.map((item) => (
                      <option
                        key={item.professionalCategoryId}
                        value={item.professionalCategoryId}
                      >
                        {item.professionalCategoryName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="legalClassId">
                  Classe légale
                </label>
                <select
                  name="legalClassId"
                  id="legalClassId"
                  value={formData.legalClassId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner une classe légale</option>
                  {dataLegalClass &&
                    dataLegalClass.map((item) => (
                      <option key={item.legalClassId} value={item.legalClassId}>
                        {item.legalClassName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="newsletterTemplateId">
                  Modèle de bulletin
                </label>
                <select
                  name="newsletterTemplateId"
                  id="newsletterTemplateId"
                  value={formData.newsletterTemplateId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un modèle de bulletin</option>
                  {dataNewsLetterTemplate &&
                    dataNewsLetterTemplate.map((item) => (
                      <option
                        key={item.newsletterTemplateId}
                        value={item.newsletterTemplateId}
                      >
                        {item.newsletterTemplateName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="paymentMethodId">
                  Mode de paiement
                </label>
                <select
                  name="paymentMethodId"
                  id="paymentMethodId"
                  value={formData.paymentMethodId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un mode de paiement</option>
                  {dataPaymentMethod &&
                    dataPaymentMethod.map((item) => (
                      <option key={item.paymentMethodId} value={item.paymentMethodId}>
                        {item.paymentMethodName}
                      </option>
                    ))}
                </select>
              </div>

              {formDateEndContract && (
                <div className="career-form-group">
                  <label className="career-form-label" htmlFor="endingContract">
                    Fin de contrat
                  </label>
                  <input
                    type="date"
                    name="endingContract"
                    id="endingContract"
                    value={formData.endingContract || ''}
                    onChange={handleChange}
                    className="career-form-control"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentForm;
