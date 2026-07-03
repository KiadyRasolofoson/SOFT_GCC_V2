import React from 'react';

import useSWR from 'swr';
import Fetcher from '../Fetcher';

// Formulaire de saisie pour le type avancement
function AdvancementForm({ handleChange, formData }) {
    // Chargement des données depuis l'api
    const { data: dataDepartment } = useSWR('/Department', Fetcher);
    const { data: dataSocioCategoryProfessional } = useSWR('/SocioCategoryProfessional', Fetcher);
    const { data: dataIndication } = useSWR('/Indication', Fetcher);
    const { data: dataEchelon } = useSWR('/Echelon', Fetcher);
    const { data: dataProfessionalCategory } = useSWR('/ProfessionalCategory', Fetcher);
    const { data: dataLegalClass } = useSWR('/LegalClass', Fetcher);

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
                        >Avancement</h4>

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
                        <div className="form-group">
                            <label htmlFor="exampleInputUsername1">Echelon</label>
                            <select name="echelonId" value={formData.echelonId} onChange={handleChange} className="form-control" id="exampleSelectGender">
                                <option value="">Sélectionner une echelon</option>
                                {dataEchelon && dataEchelon.map((item, id) => (
                                    <option key={item.echelonId} value={item.echelonId}>
                                    {item.echelonName}
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
                        >Avancement</h4>

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
                    </div>
                </div>
            </div>
        </div>
  );
}

export default AdvancementForm;
