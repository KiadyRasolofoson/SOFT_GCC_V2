import React from 'react';

// Formulaire de saisie pour mise en disponibilité
function LayOffForm({ handleChange, formData }) {
    
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
                        >Mise en disponibilité</h4>

                        <div className="form-group">
                            <label htmlFor="exampleInputEmail1">Motif</label>
                            <input type="text" name="reason" value={formData.reason} onChange={handleChange} className="form-control" id="decimalInput" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="exampleInputEmail1">Institution d'affectation</label>
                            <input type="text" name="assigningInstitution" value={formData.assigningInstitution} onChange={handleChange} className="form-control" id="decimalInput" />
                        </div>                                
                        <div className="form-group">
                            <label htmlFor="exampleInputEmail1">Date début</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="form-control" id="decimalInput" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="exampleInputEmail1">Date fin</label>
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-control" id="decimalInput" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
  );
}

export default LayOffForm;
