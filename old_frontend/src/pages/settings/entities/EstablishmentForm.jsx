import React from 'react';

function EstablishmentForm({ formData, handleChange, handleFileChange, handleSubmit, handleSubmitModified, handleCancel, isEditing, isLoading }) {
  return (
    <div className="card">
      <form className="forms-sample" onSubmit={isEditing ? handleSubmitModified : handleSubmit}>
        <div className="card-header d-flex align-items-center" style={{ color: '#B8860B' }}>
          <i className="mdi mdi-file-document-edit me-2 fs-4" style={{ fontSize: '30px', marginRight: '10px' }}></i>
          <h3 className="mb-0" style={{ color: '#B8860B' }}>{isEditing ? 'Formulaire de modification' : "Formulaire d'ajout"}</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="establishmentName">Désignation</label>
            <input type="text" name="establishmentName" value={formData.establishmentName || ''} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group">
            <label htmlFor="adress">Adresse</label>
            <input type="text" name="adress" value={formData.adress || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Téléphone</label>
            <input type="text" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="text" name="email" value={formData.email || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="website">Site web</label>
            <input type="text" name="website" value={formData.website || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="socialMedia">Réseaux sociaux</label>
            <input type="text" name="socialMedia" value={formData.socialMedia || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="nif">NIF</label>
            <input type="text" name="nif" value={formData.nif || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label htmlFor="stat">STAT</label>
            <input type="text" name="stat" value={formData.stat || ''} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label>Logo</label>
            {formData.logo && typeof formData.logo === 'string' && (
              <div>
                <img src={formData.logo} alt="Logo" style={{ width: '100px', height: '100px', borderRadius: '5px', marginBottom: '10px', objectFit: 'cover' }} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange('logo')} className="form-control" />
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

export default EstablishmentForm;
