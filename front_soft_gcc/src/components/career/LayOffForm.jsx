// Formulaire de saisie pour mise en disponibilité
function LayOffForm({ handleChange, formData }) {
  return (
    <div className="career-section">
      <div className="row g-3">
        <div className="col-md-6">
          <div className="career-card">
            <div className="career-card-header">
              <h5>
                <i className="mdi mdi-calendar-remove" />
                Mise en disponibilité
              </h5>
            </div>
            <div className="career-card-body">
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="reason">
                  Motif
                </label>
                <input
                  type="text"
                  name="reason"
                  id="reason"
                  value={formData.reason || ''}
                  onChange={handleChange}
                  className="career-form-control"
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="assigningInstitution">
                  Institution d&apos;affectation
                </label>
                <input
                  type="text"
                  name="assigningInstitution"
                  id="assigningInstitution"
                  value={formData.assigningInstitution || ''}
                  onChange={handleChange}
                  className="career-form-control"
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="startDate">
                  Date début
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate || ''}
                  onChange={handleChange}
                  className="career-form-control"
                />
              </div>
              <div className="career-form-group">
                <label className="career-form-label" htmlFor="endDate">
                  Date fin
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="career-form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LayOffForm;
