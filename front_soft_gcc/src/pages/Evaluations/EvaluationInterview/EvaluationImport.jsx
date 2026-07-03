import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const EvaluationImport = ({ onExtract }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // Effet pour nettoyer les URLs lors du démontage du composant
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);
    
    // Gestion du changement de fichier
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                
                // Créer une URL pour la prévisualisation
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                const newUrl = URL.createObjectURL(selectedFile);
                setPreviewUrl(newUrl);
                
                // Informer le composant parent qu'un fichier a été importé
                // Pour la démo, on passe simplement l'URL au lieu des données extraites
                onExtract({ source: 'import', url: newUrl });
                
                toast.success("Fiche d'évaluation importée avec succès");
            } else {
                toast.error("Veuillez sélectionner un fichier PDF valide");
            }
        }
    };
    
    return (
        <div className="evaluation-import-container">
            <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center bg-light">
                    <h5 className="mb-0 d-flex align-items-center">
                        <i className="mdi mdi-file-pdf-outline text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                        Import de la fiche d&apos;évaluation
                    </h5>
                </div>
                
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="mb-3">
                                <label htmlFor="pdfFileInput" className="form-label d-flex align-items-center">
                                    <i className="mdi mdi-upload me-2 text-primary"></i>
                                    Importer une fiche d&apos;évaluation (PDF)
                                </label>
                                <div className="custom-file-input">
                                    <input 
                                        type="file" 
                                        id="pdfFileInput"
                                        className="form-control" 
                                        accept="application/pdf" 
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            
                            {file && (
                                <div className="alert alert-success">
                                    <i className="mdi mdi-check-circle me-2"></i>
                                    Fichier importé : {file.name}
                                </div>
                            )}
                            
                            <div className="mt-4">
                                <div className="card bg-light">
                                    <div className="card-body">
                                        <h6 className="card-title">
                                            <i className="mdi mdi-information-outline me-2"></i>
                                            Information
                                        </h6>
                                        <p className="card-text text-muted small">
                                            Importez la fiche d&apos;évaluation pour la visualiser pendant l&apos;entretien. 
                                            Cela vous permettra de consulter facilement l&apos;historique d&apos;évaluation de l&apos;employé.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-8">
                            {previewUrl ? (
                                <div className="pdf-preview">
                                    <h6 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                                        <i className="mdi mdi-eye-outline text-primary me-2"></i>
                                        Aperçu du document
                                    </h6>
                                    <div className="pdf-container" style={{ height: '650px', overflow: 'hidden', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                        <iframe 
                                            src={previewUrl} 
                                            width="100%" 
                                            height="100%"
                                            title="Aperçu PDF"
                                            style={{ border: 'none' }}
                                        ></iframe>
                                    </div>
                                    <div className="text-center mt-3">
                                        <a 
                                            href={previewUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="mdi mdi-open-in-new me-2"></i>
                                            Ouvrir en plein écran
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-5 h-100 d-flex flex-column justify-content-center align-items-center border rounded" style={{ backgroundColor: '#f8f9fa', minHeight: '500px' }}>
                                    <i className="mdi mdi-file-document-outline text-muted" style={{ fontSize: '5rem' }}></i>
                                    <p className="mt-3 mb-0 text-muted">Importez un document PDF pour le visualiser ici</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

EvaluationImport.propTypes = {
    onExtract: PropTypes.func.isRequired
};

export default EvaluationImport;
