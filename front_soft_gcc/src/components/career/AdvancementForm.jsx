import useSWR from 'swr';
import Fetcher from '../Fetcher';

// Formulaire de saisie pour le type avancement
function AdvancementForm({ handleChange, formData }) {
  const { data: dataDepartment } = useSWR('/Department', Fetcher);
  const { data: dataIndication } = useSWR('/Indication', Fetcher);
  const { data: dataEchelon } = useSWR('/Echelon', Fetcher);
  const { data: dataProfessionalCategory } = useSWR('/ProfessionalCategory', Fetcher);
  const { data: dataLegalClass } = useSWR('/LegalClass', Fetcher);

  return (
    <div className="career-section">
      <div className="row g-3">
        <div className="col-md-6">
          <div className="career-card">
            <div className="career-card-header">
              <h5>
                <i className="mdi mdi-trending-up" />
                Avancement — Organisation
              </h5>
            </div>
            <div className="career-card-body">
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="advancement-departmentId">
                  Département
                </label>
                <select
                  name="departmentId"
                  id="advancement-departmentId"
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
                <label className="career-form-label" htmlFor="advancement-indicationId">
                  Indice
                </label>
                <select
                  name="indicationId"
                  id="advancement-indicationId"
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
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="echelonId">
                  Échelon
                </label>
                <select
                  name="echelonId"
                  id="echelonId"
                  value={formData.echelonId || ''}
                  onChange={handleChange}
                  className="career-form-control"
                >
                  <option value="">Sélectionner un échelon</option>
                  {dataEchelon &&
                    dataEchelon.map((item) => (
                      <option key={item.echelonId} value={item.echelonId}>
                        {item.echelonName}
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
                <i className="mdi mdi-certificate" />
                Avancement — Classification
              </h5>
            </div>
            <div className="career-card-body">
              <div className="career-form-group">
                <label
                  className="career-form-label"
                  htmlFor="advancement-professionalCategoryId"
                >
                  Catégorie professionnelle
                </label>
                <select
                  name="professionalCategoryId"
                  id="advancement-professionalCategoryId"
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
                <label className="career-form-label" htmlFor="advancement-legalClassId">
                  Classe légale
                </label>
                <select
                  name="legalClassId"
                  id="advancement-legalClassId"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancementForm;
