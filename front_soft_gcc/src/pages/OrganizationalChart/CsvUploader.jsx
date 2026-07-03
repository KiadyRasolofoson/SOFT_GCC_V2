import React, { useState } from "react";
import Papa from "papaparse";
import { urlApi } from "../../helpers/utils";

const CsvUploader = () => {
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
            console.log("Formatted Data:", formattedData);

            const response = await fetch(urlApi('/Org/employee/import'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formattedData),
            });

            console.log(csvData);
            if (!response.ok) {
                throw new Error("Erreur lors de l'envoi des données au serveur.");
            }

            alert("Données importées avec succès !");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h2>Importer un fichier CSV</h2>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            <button onClick={handleSubmit} disabled={uploading || csvData.length === 0}>
                {uploading ? "En cours d'importation..." : "Importer"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default CsvUploader;