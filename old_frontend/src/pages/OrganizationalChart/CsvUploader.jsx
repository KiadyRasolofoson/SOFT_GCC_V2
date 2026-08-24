import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Template from '../Template';
import { useNavigate } from 'react-router-dom';
import { urlApi } from '../../helpers/utils';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import '../../styles/orgChart.css';

const CsvUploader = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const parseFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data || []);
      },
      error: () => {
        setError('Erreur lors de la lecture du fichier CSV.');
        setCsvData([]);
      },
    });
  }, []);

  const handleFileUpload = (event) => {
    parseFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    parseFile(event.dataTransfer.files?.[0]);
  };

  const transformData = (data) =>
    data.map((item) => ({
      employeeId: 0,
      registrationNumber: item.registrationNumber || '',
      name: item.name || '',
      firstName: item.firstName || '',
      birthday: item.birthday
        ? new Date(item.birthday.split('/').reverse().join('-')).toISOString().split('T')[0]
        : null,
      department_id: parseInt(item.department_id, 10) || 0,
      hiring_date: item.hiring_date
        ? new Date(item.hiring_date.split('/').reverse().join('-')).toISOString().split('T')[0]
        : null,
      civiliteId: parseInt(item.civiliteId, 10) || 0,
      managerId: parseInt(item.managerId, 10) || 0,
    }));

  const handleSubmit = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formattedData = transformData(csvData);
      const token = localStorage.getItem('token');
      const response = await fetch(urlApi('/Org/employee/import'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi des données au serveur.");
      }

      setSuccess(`${formattedData.length} ligne(s) envoyée(s) avec succès.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const previewRows = csvData.slice(0, 8);
  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <Template>
      <div className="org-page">
        <div className="org-breadcrumb">
          <BreadcrumbPers
            items={[
              { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
              { label: 'Effectifs', path: '/soft-gcc/effectifs' },
              { label: 'Import CSV', path: '/soft-gcc/effectifs/importer' },
            ]}
          />
        </div>

        <header className="org-header">
          <div>
            <p className="org-header__eyebrow">Organisation</p>
            <h1 className="org-header__title">Importer des employés</h1>
            <p className="org-header__subtitle">
              Chargez un fichier CSV pour ajouter des collaborateurs à l&apos;effectif.
            </p>
          </div>
          <div className="org-header__actions">
            <button
              type="button"
              className="org-btn org-btn--ghost"
              onClick={() => navigate('/soft-gcc/effectifs')}
            >
              <i className="mdi mdi-arrow-left" />
              Retour
            </button>
          </div>
        </header>

        {error && <div className="org-alert">{error}</div>}
        {success && (
          <div
            className="org-alert"
            style={{
              borderColor: '#a7f3d0',
              background: '#ecfdf5',
              color: '#047857',
            }}
          >
            {success}
          </div>
        )}

        <div className="org-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="org-panel__head">
            <div className="org-panel__title-wrap">
              <span className="org-panel__icon">
                <i className="mdi mdi-file-upload-outline" />
              </span>
              <div>
                <h2 className="org-panel__title">Fichier CSV</h2>
                <p className="org-panel__desc">
                  Colonnes attendues : registrationNumber, name, firstName, birthday,
                  hiring_date, department_id, civiliteId, managerId.
                </p>
              </div>
            </div>
          </div>
          <div className="org-panel__body" style={{ padding: '1.25rem' }}>
            <div
              className={`org-import-drop${dragActive ? ' org-import-drop--active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <i className="mdi mdi-cloud-upload-outline" />
              <p>
                {fileName
                  ? `Fichier sélectionné : ${fileName}`
                  : 'Glissez-déposez un fichier CSV ici, ou choisissez-en un.'}
              </p>
              <label className="org-import-drop__label org-btn org-btn--primary">
                <i className="mdi mdi-folder-open-outline" />
                Choisir un fichier
                <input
                  className="org-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="org-btn org-btn--primary"
                onClick={handleSubmit}
                disabled={uploading || csvData.length === 0}
              >
                <i className="mdi mdi-upload" />
                {uploading ? "Import en cours…" : `Importer (${csvData.length})`}
              </button>
              {csvData.length > 0 && (
                <button
                  type="button"
                  className="org-btn org-btn--ghost"
                  onClick={() => {
                    setCsvData([]);
                    setFileName('');
                    setSuccess(null);
                    setError(null);
                  }}
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {previewRows.length > 0 && (
          <div className="org-panel">
            <div className="org-panel__head">
              <div className="org-panel__title-wrap">
                <span className="org-panel__icon">
                  <i className="mdi mdi-table" />
                </span>
                <div>
                  <h2 className="org-panel__title">Aperçu</h2>
                  <p className="org-panel__desc">
                    {csvData.length} ligne(s) — affichage des {previewRows.length} premières.
                  </p>
                </div>
              </div>
            </div>
            <div className="org-panel__body">
              <div className="org-table-wrap">
                <table className="org-table">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map((col) => (
                          <td key={col}>{row[col] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Template>
  );
};

export default CsvUploader;
