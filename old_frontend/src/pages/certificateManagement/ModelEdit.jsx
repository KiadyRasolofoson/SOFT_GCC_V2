import axios from 'axios';
import React, { useState, useRef, useEffect } from "react";
import Icon from "@mdi/react";
import {
  mdiPlus,
  mdiDelete,
  mdiEye,
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiOfficeBuilding,
  mdiFileDocumentEdit,
  mdiEmailFastOutline,
  mdiFileExportOutline,
  mdiCancel,
  mdiCheckCircle,
  mdiAlertCircle,
} from "@mdi/js";
import {
  Form,
  Button,
  Row,
  Col,
  Dropdown,
  Alert,
} from "react-bootstrap";
import html2pdf from "html2pdf.js";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { motion, AnimatePresence } from "framer-motion";
import DateDisplayNoTime from "../../helpers/DateDisplayNoTime";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { urlApi } from '../../helpers/utils';
import Loader from '../../helpers/Loader';
import { v4 as uuidv4 } from 'uuid';
import './ModelEdit.css';

// Generation d'un token
const generateToken = () => {
  return uuidv4().replace(/-/g, '');
};

// Formattage de date
const formatDateFr = (isoDate) => {
  if (!isoDate) return "";
  const parsed = new Date(isoDate);
  if (isNaN(parsed.getTime())) return "Date invalide";
  return format(parsed, "dd MMMM yyyy", { locale: fr });
};

const genererNouvelleReference = async (setIsLoading, setError) => {
  setIsLoading(true);
  try {
    const [allCertificatesResponse] = await Promise.all([
      axios.get(urlApi(`/CareerPlan/Certificate/GetAll`))
    ]);

    const attestations = allCertificatesResponse.data;
    //console.log(allCertificatesResponse.data);
    //console.log(attestations);

    const dateDuJour = new Date();
    const annee = dateDuJour.getFullYear();
    const mois = String(dateDuJour.getMonth() + 1).padStart(2, '0');
    const jour = String(dateDuJour.getDate()).padStart(2, '0');
    const heures = String(dateDuJour.getHours()).padStart(2, '0');
    const minutes = String(dateDuJour.getMinutes()).padStart(2, '0');
    const secondes = String(dateDuJour.getSeconds()).padStart(2, '0');
    const dateStr = `${annee}${mois}${jour}-${heures}${minutes}${secondes}`;
    let prochainCompteur = '';
    if (attestations.length == 0) {
      prochainCompteur = `0RF01`;

    } else {
      prochainCompteur = `0RF0${attestations[attestations.length - 1].id + 1}`;
    }

    return `ATT-${dateStr}-${prochainCompteur}`;
  } catch (error) {
    setError(`Erreur lors de la recuperation des donnees : ${error.message}`);
  } finally {
    setIsLoading(false);
  }
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Enlever "data:application/pdf;base64,"
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const sendAttestationEmail = async ({ recipientEmail, subject, body, file }) => {
  try {
    const base64Pdf = await fileToBase64(file);
    const payload = {
      recipientEmail,
      subject,
      body,
      fileName: file.name,
      base64Pdf,
    };

    const response = await axios.post(urlApi('/Email/send-pdf'), payload);
    console.log('Email envoyé :', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l’envoi :', error);
    throw error;
  }
};

const ModelEdit = ({ dataEmployee, compact = false }) => {
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorUpload, setErrorUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [info, setInfo] = useState(false);

  // Variables d'état pour l'envoi par email
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [token, setToken] = useState(generateToken);

  const [sections, setSections] = useState([
    {
      id: 1,
      title: "Introduction",
      content:
        "Nous, Société {{Société}}, attestons par la présente que {{Civilité}} {{Nom}} {{Prenom}} travaille avec un contrat à durée indéterminée, au sein de notre établissement en qualité de {{Poste}} dépuis le {{Date_embauche}} {{Civilité}} {{Nom}} {{Prenom}} n'est actuellement ni démissionnaire ni en procédure de licenciement. En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.",
    },
  ]);
  const [variables] = useState([
    "Nom",
    "Prenom",
    "Date_embauche",
    "Poste",
    "Société",
    "Ancienneté",
  ]);
  const [showPreview, setShowPreview] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
    site: "",
    reseaux: "",
  });

  const [aboutModel, setAboutModel] = useState({
    reference: "",
    place: "",
    signatoryPosition: "",
    reason: "",
    signatoryName: "",
    date: "",
    entreprise: 0,
    certificateType: 0,
    certificateTypeName: ""
  });

  const previewRef = useRef(); // Référence pour l'export PDF

  // Appel api pour les donnees du formulaire
  const [certificates, setCertificates] = useState([]);
  const [employeeEstablishment, setEmployeeEstablishment] = useState({});
  const [certificateTypes, setCertificateTypes] = useState([]);

  // Chargement des donnees depuis l'api 
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [employeeEstablishmentResponse, certificateTypesResponse] = await Promise.all([
        axios.get(urlApi(`/Establishment/${dataEmployee.establishmentId}`)),
        axios.get(urlApi(`/CertificateType`))
      ]);

      setEmployeeEstablishment(employeeEstablishmentResponse.data);
      setCertificateTypes(certificateTypesResponse.data);

      const nouvelleRef = await genererNouvelleReference(setIsLoading, setError);
      setAboutModel(prev => ({
        ...prev,
        reference: nouvelleRef
      }));
      setCompanyInfo({
        nom: employeeEstablishmentResponse.data.establishmentName || "",
        adresse: employeeEstablishmentResponse.data.address || "",
        telephone: employeeEstablishmentResponse.data.phoneNumber || "",
        email: employeeEstablishmentResponse.data.email || "",
        site: employeeEstablishmentResponse.data.website || "",
        reseaux: employeeEstablishmentResponse.data.socialMedia || ""
      });
      setError(false);
    } catch (error) {
      setError(`Erreur lors de la recuperation des donnees : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataEmployee]);

  const attestationId = "ATT-" + new Date().getTime(); // Simulé
  const qrValue = `${import.meta.env.VITE_API_URL || 'http://localhost:5189/api'}/verify/${token}`;

  const addSection = () => {
    setSections([...sections, { id: sections.length + 1, content: "" }]);
  };

  const removeSection = (id) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const updateSection = (id, key, value) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, [key]: value } : section
      )
    );
  };

  const insertVariable = (id, variable) => {
    setSections(
      sections.map((section) =>
        section.id === id
          ? { ...section, content: section.content + ` {{${variable}}}` }
          : section
      )
    );
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => setLogoPreview(null);

  const handleExportPDF = () => {
    if (previewRef.current) {
      setInfo(false);
      // Vérifications des données requises
      const { registrationNumber } = dataEmployee || {};
      const { certificateType, reference } = aboutModel;

      if (!registrationNumber || !certificateType || !reference) {
        setErrorUpload("Certains champs obligatoires sont manquants pour l’enregistrement.");
        return;
      }
      const opt = {
        margin: 0.5,
        filename: "attestation.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(previewRef.current)
        .outputPdf('blob')
        .then((blob) => {
          // Télécharger localement
          html2pdf().set(opt).from(previewRef.current).save();

          // Créer un fichier nommé
          const file = new File([blob], `Attestation_${aboutModel.reference}.pdf`, { type: "application/pdf" });

          // Uploader avec un nom correct
          handleUpload(file, 1);
        });
    } else {
      setInfo("Veuillez cliquer d'abord sur le bouton voir aperçu");
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setAboutModel((prevData) => ({
      ...prevData,
      [name]: value === "" ? null : value,
    }));
  };

  // Fonction qui gère le changement dans la liste déroulante
  const handleSelectChange = async (event) => {
    const selectedId = event.target.value;
    handleChange(event); // si vous avez d'autres effets à gérer

    if (selectedId) {
      setIsLoading(true);
      try {
        const response = await fetch(urlApi(`/certificateType/${selectedId}`));
        const data = await response.json();

        // Ici vous mettez à jour l’état avec les données du certificat sélectionné
        setAboutModel((prev) => ({
          ...prev,
          certificateType: selectedId,
          certificateTypeName: data.certificateTypeName || [],
        }));
      } catch (error) {
        setError(`Erreur lors du chargement du type d'attestation : ${error.message}`);
        console.error("Erreur lors du chargement du type d'attestation :", error);
      } finally {
        setIsLoading(false);
      }
    }
  };


  const replaceVariables = (text) => {
    if (!dataEmployee) return text;

    const mapping = {
      Nom: dataEmployee.name || "",
      Prenom: dataEmployee.firstName || "",
      Date_embauche: formatDateFr(dataEmployee.hiringDate),
      Poste: dataEmployee.positionName || "",
      Société: companyInfo.nom || "",
      Ancienneté: dataEmployee.anciennete || "",
      Civilité: dataEmployee.civiliteName || "",
    };

    return text.replace(/{{(.*?)}}/g, (_, key) => mapping[key.trim()] || "");
  };

  // Upload pdf de l'attestation de travail
  const handleUpload = async (file, state) => {
    if (!file) {
      setErrorUpload("Aucun fichier sélectionné.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('registrationNumber', dataEmployee.registrationNumber);
    formData.append('certificateTypeId', aboutModel.certificateType);
    formData.append('reference', aboutModel.reference);
    formData.append('state', state);
    formData.append('token', token);

    setUploading(true);
    setUploadSuccess(null);
    setErrorUpload(null);

    try {
      await axios.post(urlApi('/CareerPlan/Certificate/Save'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (state === 1) {
        setUploadSuccess('PDF exporté et enregistré avec succès.');

      } else {
        setUploadSuccess('PDF enregistré avec succès.');
      }

      await initializeForm();
      setErrorUpload(null);
      setSendError(null);
      setError(false);
    } catch (err) {
      setUploading(false); // Stop spinner même en cas d’erreur

      if (err.response?.status === 409) {
        setErrorUpload("Erreur : Référence déjà utilisée pour une autre attestation.");
      } else if (err.response?.status === 400) {
        setErrorUpload("Erreur : Fichier PDF invalide.");
      } else {
        setErrorUpload("Erreur inconnue lors de l'enregistrement. Veuillez réessayer.");
      }

      throw err; // Important : stopper la suite
    }

    setUploading(false);
  };



  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  useEffect(() => {
    if (sendSuccess) {
      const timer = setTimeout(() => {
        setSendSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sendSuccess]);

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      if (previewRef.current) {
        setInfo(false);

        // Vérifications des données requises
        const { registrationNumber } = dataEmployee || {};
        const { certificateType, reference } = aboutModel;

        if (!registrationNumber || !certificateType || !reference) {
          setErrorUpload("Certains champs obligatoires sont manquants pour l’enregistrement.");
          return;
        }
        const opt = {
          margin: 0.5,
          filename: "attestation.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };

        // Génération du fichier PDF
        const blob = await html2pdf()
          .set(opt)
          .from(previewRef.current)
          .outputPdf('blob');

        const generatedFile = new File([blob], `Attestation_${aboutModel.reference}.pdf`, {
          type: "application/pdf",
        });

        const recipient = dataEmployee.email || 'chalmaninssa1962002@gmail.com';

        // ✅ Attente de l'upload + arrêt si erreur levée
        await handleUpload(generatedFile, 2);

        await sendAttestationEmail({
          recipientEmail: recipient,
          subject: aboutModel.certificateTypeName,
          body: `<p>Bonjour ${dataEmployee.civiliteName} ${dataEmployee.firstName} ${dataEmployee.name},<br/>Veuillez trouver ci-joint votre attestation de travail.</p>`,
          file: generatedFile,
        });

        setSendSuccess(true);
        setSendError(null);
        setError(false);
      } else {
        setInfo("Veuillez cliquer d'abord sur le bouton voir aperçu");
      }
    } catch (err) {
      // Gérer les erreurs (upload ou email)
      console.error("Erreur lors de l'envoi :", err);
      setSendError("Une erreur s'est produite lors de l'envoi de l'attestation.");
    } finally {
      setSending(false);
    }
  };


  // Initialisation du formulaire de géneration du formulaire
  const initializeForm = async () => {
    setAboutModel((prevData) => ({
      ...prevData, // Conserve les autres champs inchangés
      reference: "",
      place: "",
      signatoryPosition: "",
      reason: "",
      signatoryName: "",
      date: "",
      entreprise: 0,
      certificateType: 0,
      certificateTypeName: "",
      state: 0
    }));
    setLogoPreview(null);
    console.log("Manda");
    const nouvelleRef = await genererNouvelleReference(setIsLoading, setError);
    setAboutModel(prev => ({
      ...prev,
      reference: nouvelleRef
    }));
  };

  return (
    <div className={`attestation-form${compact ? ' attestation-form-compact' : ''}`}>
      {!compact && (
        <div className="mb-3">
          <h2 className="mb-1 fw-bold" style={{ fontSize: '1.25rem' }}>
            Génération du document d&apos;attestation
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
            Renseignez les informations, rédigez le contenu puis génerez l&apos;aperçu.
          </p>
        </div>
      )}

      {isLoading && <Loader />}
      {error && <div className="alert alert-danger">{error}</div>}

      {(dataEmployee?.name || dataEmployee?.registrationNumber) && (
        <div className="att-employee-chip">
          <Icon path={mdiOfficeBuilding} size={0.7} />
          {[dataEmployee.civiliteName, dataEmployee.firstName, dataEmployee.name]
            .filter(Boolean)
            .join(' ')}
          {dataEmployee.registrationNumber ? ` · ${dataEmployee.registrationNumber}` : ''}
        </div>
      )}

      <Form onSubmit={(e) => e.preventDefault()}>
        <div className="att-layout">
          <div className="att-form-col">
            {/* 1. Identité du document */}
            <section className="att-section">
              <div className="att-section-header">
                <div className="att-section-icon">
                  <Icon path={mdiFileDocumentEdit} size={0.85} />
                </div>
                <div>
                  <h3 className="att-section-title">Identité du document</h3>
                  <p className="att-section-desc">Type d&apos;attestation et référence unique</p>
                </div>
              </div>
              <div className="att-section-body">
                <div className="att-grid-2">
                  <div className="att-field">
                    <label className="att-label" htmlFor="certificateType">
                      Type d&apos;attestation <span className="required">*</span>
                    </label>
                    <select
                      id="certificateType"
                      name="certificateType"
                      value={aboutModel.certificateType || ''}
                      onChange={handleSelectChange}
                      className="att-select"
                    >
                      <option value="">Sélectionner le type</option>
                      {certificateTypes &&
                        certificateTypes.map((item, id) => (
                          <option key={id} value={item.certificateTypeId}>
                            {item.certificateTypeName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="att-field">
                    <label className="att-label" htmlFor="reference">
                      Référence <span className="required">*</span>
                    </label>
                    <input
                      id="reference"
                      type="text"
                      name="reference"
                      className="att-input"
                      value={aboutModel.reference || ''}
                      onChange={handleChange}
                    />
                    <span className="att-help">Générée automatiquement, modifiable si besoin</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Émission */}
            <section className="att-section">
              <div className="att-section-header">
                <div className="att-section-icon">
                  <Icon path={mdiInformationOutline} size={0.85} />
                </div>
                <div>
                  <h3 className="att-section-title">Informations d&apos;émission</h3>
                  <p className="att-section-desc">Lieu, date et motif figurant sur le document</p>
                </div>
              </div>
              <div className="att-section-body">
                <div className="att-grid-3">
                  <div className="att-field">
                    <label className="att-label" htmlFor="place">
                      Fait à
                    </label>
                    <input
                      id="place"
                      type="text"
                      name="place"
                      className="att-input"
                      placeholder="Antananarivo"
                      value={aboutModel.place || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="att-field">
                    <label className="att-label" htmlFor="date">
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      name="date"
                      className="att-input"
                      value={aboutModel.date || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="att-field">
                    <label className="att-label" htmlFor="reason">
                      Motif
                    </label>
                    <input
                      id="reason"
                      type="text"
                      name="reason"
                      className="att-input"
                      placeholder="Administratif"
                      value={aboutModel.reason || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Signataire */}
            <section className="att-section">
              <div className="att-section-header">
                <div className="att-section-icon">
                  <Icon path={mdiOfficeBuilding} size={0.85} />
                </div>
                <div>
                  <h3 className="att-section-title">Signataire & logo</h3>
                  <p className="att-section-desc">Mention de signature et identité visuelle</p>
                </div>
              </div>
              <div className="att-section-body">
                <div className="att-grid-2">
                  <div className="att-field">
                    <label className="att-label" htmlFor="signatoryPosition">
                      Fonction du signataire
                    </label>
                    <input
                      id="signatoryPosition"
                      type="text"
                      name="signatoryPosition"
                      className="att-input"
                      placeholder="Le Directeur général"
                      value={aboutModel.signatoryPosition || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="att-field">
                    <label className="att-label" htmlFor="signatoryName">
                      Nom du signataire
                    </label>
                    <input
                      id="signatoryName"
                      type="text"
                      name="signatoryName"
                      className="att-input"
                      placeholder="Nom complet"
                      value={aboutModel.signatoryName || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="att-field span-2">
                    <label className="att-label" htmlFor="logo">
                      Logo de l&apos;entreprise
                    </label>
                    <div className="att-logo-box">
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <input id="logo" type="file" accept="image/*" className="att-input" onChange={handleLogoChange} />
                        <span className="att-help">Formats image recommandés (PNG, JPG)</span>
                      </div>
                      {logoPreview && (
                        <div>
                          <img src={logoPreview} alt="Logo" className="att-logo-preview" />
                          <div className="mt-2">
                            <button type="button" className="att-btn att-btn-danger-ghost att-btn-sm" onClick={removeLogo}>
                              <Icon path={mdiDelete} size={0.65} />
                              Retirer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Contenu */}
            <section className="att-section">
              <div className="att-section-header">
                <div className="att-section-icon">
                  <Icon path={mdiFormatListBulleted} size={0.85} />
                </div>
                <div>
                  <h3 className="att-section-title">Contenu du document</h3>
                  <p className="att-section-desc">
                    Rédigez le texte et insérez des champs dynamiques (Nom, Poste, etc.)
                  </p>
                </div>
              </div>
              <div className="att-section-body">
                {sections.map((section, index) => (
                  <div className="att-content-block" key={section.id}>
                    <div className="att-content-toolbar">
                      <p className="att-content-label">Paragraphe {index + 1}</p>
                      <div className="att-content-actions">
                        <Dropdown onSelect={(variable) => insertVariable(section.id, variable)}>
                          <Dropdown.Toggle
                            variant="outline-primary"
                            size="sm"
                            className="att-btn att-btn-ghost att-btn-sm border"
                          >
                            <Icon path={mdiFormatListBulleted} size={0.65} className="me-1" />
                            Insérer un champ
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {variables.map((v) => (
                              <Dropdown.Item key={v} eventKey={v}>
                                {v}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                        <button
                          type="button"
                          className="att-btn att-btn-danger-ghost att-btn-sm"
                          onClick={() => removeSection(section.id)}
                          title="Supprimer ce paragraphe"
                        >
                          <Icon path={mdiDelete} size={0.65} />
                        </button>
                      </div>
                    </div>
                    <div className="att-content-editor">
                      <ReactQuill
                        theme="snow"
                        value={section.content}
                        onChange={(value) => updateSection(section.id, 'content', value)}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, false] }],
                            ['bold', 'italic', 'underline'],
                            ['link'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['clean'],
                          ],
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button type="button" className="att-btn att-btn-secondary" onClick={addSection}>
                  <Icon path={mdiPlus} size={0.75} />
                  Ajouter un paragraphe
                </button>
              </div>
            </section>

            <div className="att-actions-bar">
              <button type="button" className="att-btn att-btn-primary" onClick={() => setShowPreview(true)}>
                <Icon path={mdiEye} size={0.8} />
                Voir l&apos;aperçu
              </button>
              <button type="button" className="att-btn att-btn-success" onClick={handleExportPDF} disabled={uploading}>
                <Icon path={mdiFileExportOutline} size={0.8} />
                {uploading ? 'Export en cours…' : 'Exporter PDF'}
              </button>
              <button type="button" className="att-btn att-btn-secondary" onClick={handleSend} disabled={sending}>
                <Icon path={mdiEmailFastOutline} size={0.8} />
                {sending ? 'Envoi…' : 'Envoyer par e-mail'}
              </button>
              <button type="button" className="att-btn att-btn-ghost" onClick={initializeForm}>
                <Icon path={mdiCancel} size={0.8} />
                Réinitialiser
              </button>
            </div>

            <div className="att-feedback">
              {errorUpload && (
                <Alert variant="danger" className="mb-0 d-flex align-items-center gap-2">
                  <Icon path={mdiAlertCircle} size={0.8} />
                  {errorUpload}
                </Alert>
              )}
              {uploadSuccess && (
                <Alert variant="success" className="mb-0 d-flex align-items-center gap-2">
                  <Icon path={mdiCheckCircle} size={0.8} />
                  {uploadSuccess}
                </Alert>
              )}
              {uploading && (
                <Alert variant="info" className="mb-0">
                  Export PDF en cours…
                </Alert>
              )}
              {sending && (
                <Alert variant="info" className="mb-0">
                  Envoi en cours…
                </Alert>
              )}
              {sendSuccess && (
                <Alert variant="success" className="mb-0">
                  L&apos;attestation a été envoyée avec succès !
                </Alert>
              )}
              {sendError && (
                <Alert variant="danger" className="mb-0">
                  {sendError}
                </Alert>
              )}
              {info && (
                <Alert variant="info" className="mb-0">
                  {info}
                </Alert>
              )}
            </div>
          </div>

          {/* Colonne aperçu */}
          <div className="att-preview-col">
            <div className="att-preview-card">
              <div className="att-preview-header">
                <h5>
                  <Icon path={mdiEye} size={0.85} />
                  Aperçu
                </h5>
                {showPreview && (
                  <button type="button" className="att-btn att-btn-secondary att-btn-sm" onClick={() => setShowPreview(false)}>
                    Masquer
                  </button>
                )}
              </div>

              {!showPreview ? (
                <div className="att-preview-empty">
                  <Icon path={mdiEye} size={1.4} color="#4B49AC" />
                  <p>Générez l&apos;aperçu pour visualiser le document avant export ou envoi.</p>
                  <button type="button" className="att-btn att-btn-primary" onClick={() => setShowPreview(true)}>
                    <Icon path={mdiEye} size={0.8} />
                    Afficher l&apos;aperçu
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="att-preview-doc" ref={previewRef}>
                      {logoPreview && (
                        <div className="mb-3 text-start">
                          <img src={logoPreview} alt="Logo" style={{ width: '140px', objectFit: 'contain' }} />
                        </div>
                      )}

                      <p className="att-preview-doc-title">{aboutModel.certificateTypeName || 'Attestation'}</p>

                      <p className="att-preview-ref">
                        <strong style={{ textDecoration: 'underline' }}>Ref</strong> : {aboutModel.reference}
                      </p>

                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className="mb-3"
                          dangerouslySetInnerHTML={{
                            __html: replaceVariables(section.content),
                          }}
                        />
                      ))}

                      <Row>
                        <Col md={8}>
                          <div className="mt-4 text-start">
                            <p>
                              <strong style={{ textDecoration: 'underline' }}>Motif</strong> :{' '}
                              <strong>{aboutModel.reason}</strong>
                            </p>
                          </div>
                          <div className="mt-4 text-center">
                            <QRCodeSVG value={qrValue} size={120} />
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mt-4 text-end">
                            <p>
                              Fait à <strong>{aboutModel.place}</strong>, le{' '}
                              <strong>
                                <DateDisplayNoTime isoDate={aboutModel.date} />
                              </strong>
                            </p>
                            <p>
                              <strong>{aboutModel.signatoryPosition}</strong>
                            </p>
                          </div>
                          <div className="mt-5 text-end" style={{ paddingTop: '40px' }}>
                            <p>
                              <strong>{aboutModel.signatoryName}</strong>
                            </p>
                          </div>
                        </Col>
                      </Row>

                      <footer className="att-preview-footer">
                        <Row>
                          <Col md={8}>
                            <p className="mb-1">
                              <strong>Adresse :</strong> {companyInfo.adresse || '…'}
                            </p>
                            <p className="mb-1">
                              <strong>Téléphone :</strong> {companyInfo.telephone || '…'}
                            </p>
                            <p className="mb-0">
                              <strong>Email :</strong> {companyInfo.email || '…'}
                            </p>
                          </Col>
                          <Col md={4} className="text-md-end">
                            <p className="mb-1">
                              <strong>Site web :</strong> {companyInfo.site || '…'}
                            </p>
                            <p className="mb-0">
                              <strong>Réseaux :</strong> {companyInfo.reseaux || '…'}
                            </p>
                          </Col>
                        </Row>
                      </footer>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ModelEdit;
