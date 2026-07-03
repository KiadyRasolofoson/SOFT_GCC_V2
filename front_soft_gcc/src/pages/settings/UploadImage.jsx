import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { urlApi } from '../../helpers/utils';

const MAX_SIZE_MB = 10; // Taille max 10Mo

const UploadImage = () => {
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState("");

    const onDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            setError("Type de fichier non autorisé. Seuls PNG et JPEG sont acceptés.");
            return;
        }

        const file = acceptedFiles[0];

        // Vérifier la taille du fichier
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError("Le fichier dépasse la limite de 10 Mo.");
            return;
        }

        // Options de compression
        const options = {
            maxSizeMB: 1, // Taille max après compression (ajustable)
            maxWidthOrHeight: 1024, // Redimensionner si nécessaire
            useWebWorker: true
        };

        try {
            const compressedFile = await imageCompression(file, options);

            // Lire l'image en base64 pour l'aperçu
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(compressedFile);

            // Convertir l'image en Blob pour l'API
            const formData = new FormData();
            formData.append("file", compressedFile);

            // Envoi vers l'API .NET Core
            await axios.post(urlApi("/Employee/Upload"), formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setError("");
        } catch (err) {
            setError("Erreur lors du traitement de l'image.");
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: "image/jpeg, image/png", // ✅ Correction des types MIME
        maxSize: MAX_SIZE_MB * 1024 * 1024
    });

    return (
        <div>
            <div {...getRootProps()} style={{ border: "2px dashed #ddd", padding: "20px", cursor: "pointer" }}>
                <input {...getInputProps()} />
                <p>Glissez-déposez une image ici, ou cliquez pour sélectionner un fichier (PNG/JPEG)</p>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: "200px", marginTop: "10px" }} />}
        </div>
    );
};

export default UploadImage;
