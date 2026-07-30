import { useState, useEffect, useCallback, useRef } from 'react';
import Template from '../../Template';
import api from '../../../helpers/api';
import { previewBulletinPDF, downloadBulletinPDF } from './bulletinCompetencesPdfGenerator';
import BreadcrumbPers from '../../../helpers/BreadcrumbPers';
import Loader from '../../../helpers/Loader';
import { FaDownload, FaSearch, FaEye, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

const STATUS_CLASSES = {
  maitrisee: { bg: '#d4edda', color: '#155724', text: 'Maîtrisée', cardBg: '#e8f5e9', iconColor: '#27ae60' },
  en_cours: { bg: '#fff3cd', color: '#856404', text: 'En cours', cardBg: '#fff8e1', iconColor: '#f39c12' },
  non_acquise: { bg: '#f8d7da', color: '#721c24', text: 'Non acquise', cardBg: '#fbe9e7', iconColor: '#c0392b' },
};

const BulletinCompetencesPage = () => {
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
  const dropdownRef = useRef(null);

  // ─── Charger la liste des employés ───
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await api.get('/Employee');
        const data = Array.isArray(response.data) ? response.data
          : response.data?.data || [];
        setEmployees(data);
      } catch (err) {
        console.warn('Erreur chargement employés:', err);
        try {
          const fallback = await api.get('/EmployeeSkills/description/1', {
            params: { pageNumber: 1, pageSize: 500 }
          });
          if (Array.isArray(fallback.data)) setEmployees(fallback.data);
        } catch (e) {
          setError('Impossible de charger la liste des employés.');
        }
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // ─── Fermer le dropdown en cliquant à l'extérieur ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // ─── Charger les données du bulletin (retourne les données) ───
  const loadBulletinData = useCallback(async () => {
    if (!selectedEmployeeId) {
      setError('Veuillez sélectionner un employé.');
      return null;
    }
    setLoading(true);
    setError('');
    setBulletinData(null);
    setPreviewUrl(null);
    try {
      const response = await api.get(`/BulletinCompetence/employee/${selectedEmployeeId}`);
      if (response.data) {
        setBulletinData(response.data);
        return response.data;
      }
      setError('Aucune donnée de compétences disponible pour cet employé.');
      return null;
    } catch (err) {
      console.error('Erreur chargement bulletin:', err);
      setError('Erreur lors du chargement des données du bulletin.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId]);

  // ─── Générer la prévisualisation PDF ───
  const handlePreview = async () => {
    const data = bulletinData || await loadBulletinData();
    if (data) await generatePreview(data);
  };

  // ─── Télécharger le PDF ───
  const handleDownload = async () => {
    const data = bulletinData || await loadBulletinData();
    if (data) await doDownload(data);
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

  const closePreview = () => {
    setShowPreview(false);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  };

  const getBadge = (classification) => STATUS_CLASSES[classification] || STATUS_CLASSES.maitrisee;

  return (
    <Template>
      {/* ─── En-tête ─── */}
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

      <div className="container-fluid px-4">
        {/* ═══════════════════════════════════════ */}
        {/*  SÉLECTION EMPLOYÉ                      */}
        {/* ═══════════════════════════════════════ */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-4">
            <h5 className="card-title fw-semibold mb-3" style={{ color: '#003057', fontSize: '1.05rem' }}>
              <i className="mdi mdi-account-search me-2"></i>
              Sélectionner un employé
            </h5>

            <div className="row g-3 align-items-end">
              {/* Recherche */}
              <div className="col-md-5">
                <label className="form-label fw-medium small text-secondary mb-1">Employé</label>
                <div className="position-relative" ref={dropdownRef}>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FaSearch className="text-muted" size={14} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par nom ou matricule..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>
                  {showDropdown && (
                    <div
                      className="position-absolute w-100 mt-1 bg-white border rounded-2 shadow-lg"
                      style={{ zIndex: 1000, maxHeight: '260px', overflowY: 'auto' }}
                    >
                      {loadingEmployees ? (
                        <div className="p-4 text-center text-muted small">Chargement...</div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="p-4 text-center text-muted small">Aucun employé trouvé</div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.employeeId || emp.employee_id}
                            className="px-3 py-2 border-bottom cursor-pointer transition-hover"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelectEmployee(emp)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                              {emp.firstName || ''} {emp.name || ''}
                              <span className="text-muted fw-normal ms-2 small">
                                ({emp.registrationNumber || 'N/A'})
                              </span>
                            </div>
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

              {/* Sélectionné */}
              <div className="col-md-3">
                <label className="form-label fw-medium small text-secondary mb-1">Employé sélectionné</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  value={selectedEmployeeLabel || 'Aucun'}
                  readOnly
                />
              </div>

              {/* Boutons avec espacement homogène */}
              <div className="col-md-4">
                <div className="d-flex" style={{ gap: '1rem' }}>
                  <button
                    className="btn btn-primary px-4 py-2"
                    onClick={handlePreview}
                    disabled={!selectedEmployeeId || generating}
                  >
                    <FaEye className="me-2" size={14} />
                    Aperçu PDF
                  </button>
                  <button
                    className="btn btn-success px-4 py-2"
                    onClick={handleDownload}
                    disabled={!selectedEmployeeId || generating}
                  >
                    <FaDownload className="me-2" size={14} />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            {generating && (
              <div className="mt-4">
                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${progress}%`, backgroundColor: '#003057', borderRadius: '4px' }}
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="d-block mt-2 small text-muted">
                  {progress < 25 ? 'Préparation des données...' :
                   progress < 50 ? 'Génération du bulletin...' :
                   progress < 75 ? 'Mise en page...' :
                   progress < 100 ? 'Finalisation...' : 'Terminé ✓'}
                </span>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center mt-3 mb-0 py-2 px-3 small">
                <i className="mdi mdi-alert-circle me-2" style={{ fontSize: '1.1rem' }}></i>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/*  CHARGEMENT                              */}
        {/* ═══════════════════════════════════════ */}
        {loading && (
          <div className="text-center py-5">
            <Loader />
            <p className="text-muted mt-3 small">Chargement des données de compétences...</p>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/*  DONNÉES DU BULLETIN                   */}
        {/* ═══════════════════════════════════════ */}
        {bulletinData && !loading && (
          <>
            {/* Cartes KPI */}
            <div className="row g-3 mb-4">
              {[
                { label: 'Maîtrisées', count: bulletinData.masteredCount, cls: STATUS_CLASSES.maitrisee, icon: FaCheckCircle },
                { label: "En cours d'acquisition", count: bulletinData.inProgressCount, cls: STATUS_CLASSES.en_cours, icon: FaClock },
                { label: 'Non acquises', count: bulletinData.notAcquiredCount, cls: STATUS_CLASSES.non_acquise, icon: FaTimesCircle },
                { label: 'Total compétences', count: bulletinData.totalSkills, cls: { cardBg: '#e3f2fd', iconColor: '#003057' }, icon: null },
              ].map((item, i) => (
                <div className="col-md-3" key={i}>
                  <div className="card border-0 shadow-sm rounded-3 h-100"
                    style={{ backgroundColor: item.cls.cardBg }}>
                    <div className="card-body text-center py-3">
                      {item.icon ? (
                        <item.icon style={{ color: item.cls.iconColor }} size={26} />
                      ) : (
                        <i className="mdi mdi-school" style={{ color: '#003057', fontSize: '26px' }}></i>
                      )}
                      <div className="fw-bold mt-2" style={{
                        fontSize: '1.75rem',
                        color: item.cls.iconColor || '#003057'
                      }}>
                        {item.count}
                      </div>
                      <div className="small text-secondary">{item.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Domaines */}
            {(bulletinData.domains || []).map((domain, dIdx) => (
              <div className="card border-0 shadow-sm rounded-3 mb-3" key={dIdx}>
                <div className="card-header rounded-top py-2 px-3 d-flex align-items-center"
                  style={{ backgroundColor: '#003057', borderBottom: 'none' }}>
                  <span className="fw-semibold text-white" style={{ fontSize: '0.95rem' }}>
                    {domain.domainName}
                  </span>
                  <span className="badge bg-light text-dark ms-3 fw-normal">
                    {domain.skills.length} compétence{domain.skills.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                      <thead className="table-light small">
                        <tr>
                          <th className="ps-3 py-2">Compétence</th>
                          <th className="py-2" style={{ width: '180px' }}>Niveau</th>
                          <th className="py-2" style={{ width: '130px' }}>Statut</th>
                          <th className="py-2" style={{ width: '100px' }}>Dernière MAJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domain.skills.map((skill, sIdx) => {
                          const badge = getBadge(skill.classification);
                          const barColor = badge.iconColor;
                          return (
                            <tr key={sIdx}>
                              <td className="ps-3 py-2 fw-medium">{skill.skillName}</td>
                              <td className="py-2">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px', maxWidth: '120px' }}>
                                    <div
                                      className="progress-bar"
                                      style={{
                                        width: `${Math.min(skill.level, 100)}%`,
                                        backgroundColor: barColor,
                                        borderRadius: '4px'
                                      }}
                                    />
                                  </div>
                                  <span className="small fw-semibold" style={{ minWidth: '38px' }}>
                                    {Math.round(skill.level)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-2">
                                <span className="badge fw-medium px-2 py-1"
                                  style={{
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                    fontSize: '0.8rem',
                                    border: `1px solid ${badge.color}22`
                                  }}>
                                  {badge.text}
                                </span>
                              </td>
                              <td className="py-2 small text-muted">
                                {skill.lastUpdated
                                  ? new Date(skill.lastUpdated).toLocaleDateString('fr-FR')
                                  : 'N/A'}
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

            {/* Boutons d'action fin de page */}
            <div className="d-flex justify-content-center mt-4 mb-5" style={{ gap: '2.5rem' }}>
              <button
                className="btn btn-primary px-5 py-2"
                onClick={handlePreview}
                disabled={generating}
              >
                <FaEye className="me-2" size={14} />
                Aperçu PDF
              </button>
              <button
                className="btn btn-success px-5 py-2"
                onClick={handleDownload}
                disabled={generating}
              >
                <FaDownload className="me-2" size={14} />
                Télécharger le PDF
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/*  ÉTATS VIDES                            */}
        {/* ═══════════════════════════════════════ */}
        {!loading && !bulletinData && selectedEmployeeId && (
          <div className="text-center py-5">
            <button className="btn btn-primary btn-lg px-5 py-2 rounded-3 shadow-sm"
              onClick={loadBulletinData}>
              <i className="mdi mdi-file-document me-2"></i>
              Générer le bulletin
            </button>
          </div>
        )}

        {!selectedEmployeeId && !loading && (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="mdi mdi-newspaper" style={{ fontSize: '64px', color: '#d0d5dd' }}></i>
            </div>
            <h5 className="text-secondary" style={{ fontWeight: 500 }}>
              Sélectionnez un employé pour générer son bulletin de compétences
            </h5>
            <p className="text-muted small" style={{ maxWidth: '500px', margin: '0 auto' }}>
              Le bulletin présente la liste structurée des compétences maîtrisées,
              en cours d'acquisition et non acquises.
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/*  MODAL DE PRÉVISUALISATION PDF          */}
      {/* ═══════════════════════════════════════ */}
      {showPreview && previewUrl && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
          onClick={closePreview}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-3 overflow-hidden">
              <div className="modal-header py-2 px-3" style={{ backgroundColor: '#003057' }}>
                <h6 className="modal-title text-white fw-semibold">
                  <i className="mdi mdi-file-pdf me-2"></i>
                  Aperçu du bulletin de compétences
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={closePreview}></button>
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
              <div className="modal-footer d-flex justify-content-between px-3 py-2">
                <div>
                  <span className="small text-muted">
                    {selectedEmployeeLabel}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm px-3" onClick={closePreview}>
                    Fermer
                  </button>
                  <button
                    className="btn btn-success btn-sm px-4"
                    onClick={handleDownload}
                    disabled={generating}
                  >
                    <FaDownload className="me-1" size={12} />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Template>
  );
};

export default BulletinCompetencesPage;
