import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../../styles/modal.css';
import { urlApi } from '../../helpers/utils';
import Papa from "papaparse";
    
// Gerer l'insertion d'autres formations
function ModalImportEmployee ({showModalImport, handleCloseModalImport}) {
    const [csvData, setCsvData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
    
        if (!file) return;
    
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvData(results.data);
                console.log("Parsed CSV Data:", results.data);
            },
            error: (err) => {
                console.error("Error parsing CSV:", err);
                setError("Erreur lors de la lecture du fichier CSV.");
            },
        });
    };
    
    const transformData = (data) => {
        return data.map((item) => ({
            employeeId: 0, // Valeur par défaut
            registrationNumber: item.registrationNumber || "",
            name: item.name || "",
            firstName: item.firstName || "",
            birthday: item.birthday
                ? new Date(item.birthday.split("/").reverse().join("-")).toISOString().split("T")[0]
                : null, // Conversion de la date au format ISO
            department_id: parseInt(item.department_id, 10) || 0,
            hiring_date: item.hiring_date
                ? new Date(item.hiring_date.split("/").reverse().join("-")).toISOString().split("T")[0]
                : null, // Conversion de la date au format ISO
            civiliteId: parseInt(item.civiliteId, 10) || 0, // Valeur par défaut
            managerId: parseInt(item.managerId, 10) || 0, // Valeur par défaut
        }));
    };
    
    const handleSubmit = async () => {
        setUploading(true);
        setError(null);
    
        try {
            const formattedData = transformData(csvData);
    
            const response = await fetch(urlApi('/Org/employee/import'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formattedData),
            });
    
            const result = await response.json();
    
            if (!response.ok || !result.success) {
                const errorMessage = result.errors?.length
                    ? result.errors.join("\n")
                    : "Erreur lors de l'importation des données.";
                throw new Error(errorMessage);
            }
    
            alert(result.message || "Données importées avec succès !");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };
    
    console.log(showModalImport);
    return (
        <Modal
          isOpen={showModalImport}
          onRequestClose={handleCloseModalImport}
          contentLabel="Importer employe"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
                <i className="mdi mdi-file-delimited me-2 fs-4" style={{fontSize: '30px', marginRight: '5px'}}></i>
                <h3 className="mb-0" style={{color: '#B8860B'}}>IMPORT CSV DES EMPLOYÉS</h3>
                <button onClick={handleCloseModalImport} className="close-button">&times;</button>
            </div>
           
            <div className="modal-body">
                <div>
                    <div className="form-group">
                        <label>Fichier csv </label>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="form-control" />
                    </div>
                    {error && (
                        <div className="error-report">
                            <p style={{ color: "red" }}>
                                {error.split("\n").map((line, index) => (
                                    <span key={index}>{line}<br /></span>
                                ))}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-footer">
                <button onClick={handleCloseModalImport} className="btn btn-danger">
                    <i className="mdi mdi-close-circle-outline me-1" style={{ marginRight: '5px'}}></i>
                    Fermer
                </button>
                <button onClick={handleSubmit} className="button button-primary" disabled={uploading || csvData.length === 0}>
                    <i className="mdi mdi-file-import me-1" style={{ marginRight: '5px'}}></i>
                    {uploading ? "En cours d'importation..." : "Importer"}
                </button>
            </div>

        </Modal>
      );
    }
    
    export default ModalImportEmployee;
    