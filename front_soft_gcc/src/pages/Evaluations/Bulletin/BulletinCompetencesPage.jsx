import { useState, useEffect, useCallback } from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import { previewBulletinPDF, downloadBulletinPDF } from './bulletinCompetencesPdfGenerator';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import Loader from '../../../helpers/Loader';
import { FaFilePdf, FaDownload, FaSearch, FaEye, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import '../../../assets/css/Evaluations/EvaluationHistory.css';

/**
 * Page de génération du Bulletin de Compétences Individuel.
 * Permet de sélectionner un employé, prévisualiser et télécharger son bulletin PDF.
 */
const BulletinCompetencesPage = () => {
  // États
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState('');
  const [bulletinData, setBulletinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // ─── Charger la liste des employés ───
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await api.get('/Employee');
        if (Array.isArray(response.data)) {
          setEmployees(response.data);
        } else if (response.data && response.data.data) {
          setEmployees(response.data.data);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.warn('Erreur chargement employés via Employee, tentative fallback:', err);
        try {
          const fallback = await api.get('/EmployeeSkills/description/1', {
            params: { pageNumber: 1, pageSize: 500 }
          });
          if (Array.isArray(fallback.data)) {
            setEmployees(fallback.data);
          }
        } catch (e) {
          setError('Impossible de charger la liste des employés.');
        }
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // ─── Filtrer les employés ───
  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ''} ${emp.name || ''}`.toLowerCase();
    const regNum = (emp.registrationNumber || '').toLowerCase();
    return fullName.includes(term) || regNum.includes(term);
  });

  // ─── Sélectionner un employé ───
  const handleSelectEmployee = (emp) => {
    const empId = emp.employeeId || emp.employee_id;
    setSelectedEmployeeId(empId);
    setSelectedEmployeeLabel(`${emp.firstName || ''} ${emp.name || ''} (${emp.registrationNumber || 'N/A'})`);
    setShowDropdown(false);
    setSearchTerm('');
    setBulletinData(null);
    setPreviewUrl(null);
    setError('');
  };

  // ─── Charger les données du bulletin ───
  const loadBulletinData = useCallback(async () => {
    if (!selectedEmployeeId) {
      setError('Veuillez sélectionner un employé.');
      return;
    }

    setLoading(true);
    setError('');
    setBulletinData(null);
    setPreviewUrl(null);

    try {
      const response = await api.get(`/BulletinCompetence/employee/${selectedEmployeeId}`);
      if (response.data) {
        setBulletinData(response.data);
      } else {
        setError('Aucune donnée de compétences disponible pour cet employé.');
      }
    } catch (err) {
      console.error('Erreur chargement bulletin:', err);
      setError('Erreur lors du chargement des données du bulletin.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId]);

  // ─── Générer la prévisualisation PDF ───
  const handlePreview = async () => {
    if (!bulletinData) {
      await loadBulletinData();
      // Attendre que bulletinData soit mis à jour
      setTimeout(async () => {
        if (bulletinData) {
          await generatePreview(bulletinData);
        }
      }, 500);
      return;
    }
    await generatePreview(bulletinData);
  };

  const generatePreview = async (data) => {
    setGenerating(true);
    setError('');
    setProgress(0);
    try {
      const url = await previewBulletinPDF(data, (pct) => setProgress(pct));
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      setError('Erreur lors de la génération du PDF.');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Télécharger le PDF ───
  const handleDownload = async () => {
    if (!bulletinData) {
      await loadBulletinData();
      setTimeout(async () => {
        if (bulletinData) {
          await doDownload(bulletinData);
        }
      }, 500);
      return;
    }
    await doDownload(bulletinData);
  };

  const doDownload = async (data) => {
    setGenerating(true);
    setError('');
    setProgress(0);
    try {
      await downloadBulletinPDF(data, (pct) => setProgress(pct));
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      setError('Erreur lors du téléchargement du PDF.');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Fermer la prévisualisation ───
  const closePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // ─── Style pour les badges de classification ───
  const getClassificationBadge = (classification) => {
    switch (classification) {
      case 'maitrisee':
        return { bg: '#d4edda', color: '#155724', text: 'Maîtrisée' };
      case 'en_cours':
        return { bg: '#fff3cd', color: '#856404', text: 'En cours' };
      case 'non_acquise':
        return { bg: '#f8d7da', color: '#721c24', text: 'Non acquise' };
      default:
        return { bg: '#e2e3e5', color: '#383d41', text: 'Indéfini' };
    }
  };

  return (
    <Template>
      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-newspaper skill-icon" style={{ color: '#003057' }}></i>
          <p className="skill-title">BULLETIN DE COMPÉTENCES INDIVIDUEL</p>
        </div>
      </div>

      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
          { label: 'Évaluations', path: '/soft-gcc/evaluations/liste' },
          { label: 'Bulletin de compétences', path: '' }
        ]}
      />

      <div className="container-fluid">
        {/* ─── Panneau de sélection employé ─── */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title" style={{ color: '#003057' }}>
              <i className="mdi mdi-account-search me-2"></i>
              Sélectionner un employé
            </h5>
            <div className="row align-items-end">
              <div className="col-md-6">
                <div className="form-group position-relative">
                  <label className="form-label">Employé</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par nom ou matricule..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>

                  {/* Dropdown des résultats */}
                  {showDropdown && (
                    <div
                      className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm"
                      style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
                    >
                      {loadingEmployees ? (
                        <div className="p-3 text-center text-muted">
                          <span>Chargement...</span>
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="p-3 text-center text-muted">Aucun employé trouvé</div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.employeeId || emp.employee_id}
                            className="px-3 py-2 border-bottom"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelectEmployee(emp)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = ''}
                          >
                            <strong>{emp.firstName || ''} {emp.name || ''}</strong>
                            <small className="text-muted ms-2">
                              ({emp.registrationNumber || 'N/A'})
                            </small>
                            <br />
                            <small className="text-muted">
                              {emp.departmentName || emp.department_name || ''}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Employé sélectionné</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedEmployeeLabel}
                    readOnly
                    placeholder="Aucun"
                  />
                </div>
              </div>

              <div className="col-md-3 d-flex gap-2">
                <button
                  className="btn btn-primary flex-fill"
                  onClick={handlePreview}
                  disabled={!selectedEmployeeId || generating}
                >
                  <FaEye className="me-1" />
                  Aperçu PDF
                </button>
                <button
                  className="btn btn-success flex-fill"
                  onClick={handleDownload}
                  disabled={!selectedEmployeeId || generating}
                >
                  <FaDownload className="me-1" />
                  Télécharger
                </button>
              </div>
            </div>

            {/* Barre de progression */}
            {generating && (
              <div className="mt-3">
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${progress}%`, backgroundColor: '#003057' }}
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    {progress}%
                  </div>
                </div>
                <small className="text-muted mt-1">
                  {progress < 30 ? 'Préparation des données...' :
                   progress < 60 ? 'Génération du bulletin...' :
                   progress < 90 ? 'Mise en page...' : 'Finalisation...'}
                </small>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="alert alert-danger mt-3 mb-0 py-2">
                <i className="mdi mdi-alert-circle me-1"></i>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ─── Aperçu des données du bulletin ─── */}
        {loading && (
          <div className="text-center py-5">
            <Loader />
            <p className="text-muted mt-2">Chargement des données de compétences...</p>
          </div>
        )}

        {bulletinData && !loading && (
          <>
            {/* Cartes de résumé */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card shadow-sm border-0" style={{ backgroundColor: '#e8f5e9' }}>
                  <div className="card-body text-center">
                    <FaCheckCircle style={{ color: '#27ae60' }} size={24} />
                    <h3 className="mt-2 mb-0" style={{ color: '#27ae60' }}>{bulletinData.masteredCount}</h3>
                    <small className="text-muted">Maîtrisées</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff8e1' }}>
                  <div className="card-body text-center">
                    <FaClock style={{ color: '#f39c12' }} size={24} />
                    <h3 className="mt-2 mb-0" style={{ color: '#f39c12' }}>{bulletinData.inProgressCount}</h3>
                    <small className="text-muted">En cours d&apos;acquisition</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0" style={{ backgroundColor: '#fbe9e7' }}>
                  <div className="card-body text-center">
                    <FaTimesCircle style={{ color: '#c0392b' }} size={24} />
                    <h3 className="mt-2 mb-0" style={{ color: '#c0392b' }}>{bulletinData.notAcquiredCount}</h3>
                    <small className="text-muted">Non acquises</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0" style={{ backgroundColor: '#e3f2fd' }}>
                  <div className="card-body text-center">
                    <i className="mdi mdi-school" style={{ color: '#003057', fontSize: '24px' }}></i>
                    <h3 className="mt-2 mb-0" style={{ color: '#003057' }}>{bulletinData.totalSkills}</h3>
                    <small className="text-muted">Total compétences</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Détail par domaine */}
            {bulletinData.domains && bulletinData.domains.map((domain, dIdx) => (
              <div className="card shadow-sm mb-3" key={dIdx}>
                <div className="card-header" style={{ backgroundColor: '#003057', color: 'white' }}>
                  <strong>{domain.domainName}</strong>
                  <span className="ms-3 badge bg-light text-dark">
                    {domain.skills.length} compétence{domain.skills.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Compétence</th>
                          <th>Niveau</th>
                          <th>Progression</th>
                          <th>Statut</th>
                          <th>Dernière MAJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domain.skills.map((skill, sIdx) => {
                          const badge = getClassificationBadge(skill.classification);
                          return (
                            <tr key={sIdx}>
                              <td>{skill.skillName}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress flex-grow-1" style={{ height: '8px', minWidth: '100px' }}>
                                    <div
                                      className="progress-bar"
                                      style={{
                                        width: `${skill.level}%`,
                                        backgroundColor: skill.level >= 70 ? '#27ae60' :
                                                         skill.level >= 40 ? '#f39c12' : '#c0392b'
                                      }}
                                    />
                                  </div>
                                  <span className="ms-2 small fw-bold">{Math.round(skill.level)}%</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                  {badge.text}
                                </span>
                              </td>
                              <td>{skill.classificationLabel}</td>
                              <td className="small text-muted">
                                {skill.lastUpdated ? new Date(skill.lastUpdated).toLocaleDateString('fr-FR') : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            {/* Boutons d'action */}
            <div className="text-center mt-4 mb-4">
              <button
                className="btn btn-primary me-2"
                onClick={handlePreview}
                disabled={generating}
              >
                <FaEye className="me-1" />
                Aperçu PDF
              </button>
              <button
                className="btn btn-success"
                onClick={handleDownload}
                disabled={generating}
              >
                <FaDownload className="me-1" />
                Télécharger le PDF
              </button>
            </div>
          </>
        )}

        {!loading && !bulletinData && selectedEmployeeId && (
          <div className="text-center py-5">
            <button className="btn btn-primary btn-lg" onClick={loadBulletinData}>
              <i className="mdi mdi-file-document me-2"></i>
              Générer le bulletin
            </button>
          </div>
        )}

        {!selectedEmployeeId && !loading && (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="mdi mdi-newspaper" style={{ fontSize: '64px', color: '#ccc' }}></i>
            </div>
            <h5 className="text-muted">Sélectionnez un employé pour générer son bulletin de compétences</h5>
            <p className="text-muted small">
              Le bulletin présente la liste structurée des compétences maîtrisées, en cours d'acquisition et non acquises.
            </p>
          </div>
        )}
      </div>

      {/* ─── Modal de prévisualisation PDF ─── */}
      {showPreview && previewUrl && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#003057', color: 'white' }}>
                <h5 className="modal-title">
                  <i className="mdi mdi-file-pdf me-2"></i>
                  Aperçu du bulletin de compétences
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closePreview}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ height: '80vh' }}>
                <iframe
                  src={previewUrl}
                  title="Aperçu du bulletin de compétences"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closePreview}>
                  Fermer
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleDownload}
                  disabled={generating}
                >
                  <FaDownload className="me-1" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Template>
  );
};

export default BulletinCompetencesPage;
