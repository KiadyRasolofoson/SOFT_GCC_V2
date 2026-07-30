import React from 'react';

function DepartmentForm({ formData, handleChange, handleFileChange, handleSubmit, handleSubmitModified, handleCancel, isEditing, isLoading }) {
  return (
    <div className="card">
      <form className="forms-sample" onSubmit={isEditing ? handleSubmitModified : handleSubmit}>
        <div className="card-header d-flex align-items-center" style={{ color: '#B8860B' }}>
          <i className="mdi mdi-file-document-edit me-2 fs-4" style={{ fontSize: '30px', marginRight: '10px' }}></i>
          <h3 className="mb-0" style={{ color: '#B8860B' }}>{isEditing ? 'Formulaire de modification' : "Formulaire d'ajout"}</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="name">Nom du département</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group">
            <label>Photo du département</label>
            {formData.photo && typeof formData.photo === 'string' && (
              <div>
                <img src={formData.photo} alt="Photo" style={{ width: '100px', height: '100px', borderRadius: '5px', marginBottom: '10px', objectFit: 'cover' }} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange('photo')} className="form-control" />
          </div>
          <div className="button-save-profil">
            <button type="submit" className="btn btn-success btn-fw" disabled={isLoading}>{isEditing ? 'Modifier' : 'Créer'}</button>
            {isEditing && <button type="reset" className="btn btn-light btn-fw" onClick={handleCancel}>Annuler</button>}
          </div>
        </div>
      </form>
    </div>
  );
}

export default DepartmentForm;
