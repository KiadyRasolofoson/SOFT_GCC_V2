import React, { useState, useEffect, useCallback } from 'react';
import Template from '../Template';
import { runSync, getSyncLogs } from '../../services/EmployeeSyncService';
import { toast } from 'react-toastify';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import Loader from '../../helpers/Loader';
import { 
    FaSync, 
    FaHistory, 
    FaPlay, 
    FaCheckCircle, 
    FaExclamationTriangle, 
    FaTimesCircle, 
    FaDatabase, 
    FaServer, 
    FaChevronDown, 
    FaChevronUp, 
    FaInfoCircle
} from 'react-icons/fa';
import '../../styles/syncStyle.css';
import '../../styles/skillsStyle.css';

function EmployeeSyncPage() {
    const [syncing, setSyncing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const pageSize = 15;

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const data = await getSyncLogs(page, pageSize);
            setLogs(data || []);
            // Estimation : si on reçoit moins de pageSize résultats, c'est la dernière page
            if (Array.isArray(data) && data.length < pageSize) {
                setTotalPages(page);
            } else {
                setTotalPages(page + 1);
            }
        } catch (err) {
            toast.error('Erreur lors du chargement de l\'historique');
        } finally {
            setLoadingLogs(false);
        }
    }, [page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRunSync = async () => {
        setSyncing(true);
        setLastResult(null);
        try {
            const result = await runSync();
            setLastResult(result);
            toast.success(
                `Synchronisation terminée : ${result.recordsInserted} ajoutés, ${result.recordsUpdated} mis à jour` +
                (result.recordsFailed > 0 ? `, ${result.recordsFailed} échecs` : '')
            );
            fetchLogs();
        } catch (err) {
            toast.error('Échec de la synchronisation : ' + (err.apiData?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'Success': { className: 'badge-success-soft', icon: <FaCheckCircle className="me-1" />, label: 'Succès' },
            'Partial': { className: 'badge-warning-soft', icon: <FaExclamationTriangle className="me-1" />, label: 'Partiel' },
            'Failed':  { className: 'badge-danger-soft',  icon: <FaTimesCircle className="me-1" />,       label: 'Échec' },
        };
        const s = map[status] || map['Failed'];
        return (
            <span className={`badge ${s.className} d-inline-flex align-items-center px-2 py-1`}>
                {s.icon} {s.label}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const toggleExpandLog = (id) => {
        setExpandedLogId(prev => prev === id ? null : id);
    };

    // Obtenir le résumé de la dernière synchronisation (soit le résultat en direct, soit la dernière de l'historique)
    const latestSync = lastResult || (logs && logs.length > 0 ? {
        status: logs[0].status,
        recordsInserted: logs[0].recordsInserted,
        recordsUpdated: logs[0].recordsUpdated,
        recordsFailed: logs[0].recordsFailed,
        syncDate: logs[0].syncDate,
        error: logs[0].errorMessage
    } : null);

    return (
        <Template>
            {syncing && <Loader />}
            
            <div className="sync-container">
                {/* En-tête de la page */}
                <div className="title-container mb-3">
                    <div className="col-lg-10 skill-header">
                        <i className="mdi mdi-sync skill-icon spin-active" style={{ color: '#0d6efd' }}></i>
                        <p className="skill-title">SYNCHRONISATION DES EMPLOYÉS</p>
                    </div>
                </div>

                <BreadcrumbPers
                    items={[
                        { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
                        { label: 'Paramètres', path: '/soft-gcc/parametres' },
                        { label: 'Synchronisation', path: '/soft-gcc/parametres/synchronisation' },
                    ]}
                />

                {/* Section supérieure : Contrôle et Visualisation */}
                <div className="sync-control-card p-4">
                    <div className="row align-items-center">
                        <div className="col-lg-7 mb-4 mb-lg-0">
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <FaInfoCircle className="text-primary" /> Visualisation du flux de données
                            </h5>
                            <div className={`sync-flow-wrapper ${syncing ? 'syncing-active' : ''}`}>
                                {/* Source */}
                                <div className="sync-node sync-node-source">
                                    <div className="sync-node-icon">
                                        <FaDatabase />
                                    </div>
                                    <div className="sync-node-title">Base de paie p_sw</div>
                                    <div className="sync-node-desc">Table source : T_SAL</div>
                                </div>

                                {/* Connecteur */}
                                <div className="sync-flow-connector">
                                    <div className="sync-flow-pulse"></div>
                                </div>

                                {/* Destination */}
                                <div className="sync-node sync-node-dest">
                                    <div className="sync-node-icon">
                                        <FaServer />
                                    </div>
                                    <div className="sync-node-title">Soft GCC Portal</div>
                                    <div className="sync-node-desc">Table destination : Employee</div>
                                </div>
                            </div>
                        </div>

                        {/* Zone d'action */}
                        <div className="col-lg-5 text-center text-lg-start ps-lg-4 border-lg-start">
                            <div className="p-2">
                                <h5 className="fw-bold mb-2">Lancer une mise à jour</h5>
                                <p className="text-muted small mb-4">
                                    Cette opération permet de récupérer en temps réel les nouveaux salariés créés ou les modifications enregistrées dans le système de paie.
                                </p>
                                <button
                                    className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                                    onClick={handleRunSync}
                                    disabled={syncing}
                                    style={{ borderRadius: '8px', fontWeight: '600' }}
                                >
                                    <FaPlay size={12} /> Lancer la synchronisation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widgets de synthèse de la dernière synchronisation */}
                {latestSync && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                <FaCheckCircle className="text-success" /> Résumé de la dernière activité
                            </h5>
                            {latestSync.syncDate && (
                                <span className="text-muted small">
                                    Exécuté le : <strong>{formatDate(latestSync.syncDate)}</strong>
                                </span>
                            )}
                        </div>

                        {/* Statut de dernière synchronisation avec visibilité garantie */}
                        {lastResult && (
                            <div className={`sync-alert-custom sync-alert-custom-${lastResult.status === 'Success' ? 'success' : lastResult.status === 'Partial' ? 'warning' : 'danger'}`}>
                                <div className="sync-alert-icon-wrapper">
                                    {lastResult.status === 'Success' ? <FaCheckCircle size={20} /> :
                                     lastResult.status === 'Partial' ? <FaExclamationTriangle size={20} /> :
                                     <FaTimesCircle size={20} />}
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 fw-bold">
                                        {lastResult.status === 'Success' ? 'Synchronisation réussie' :
                                         lastResult.status === 'Partial' ? 'Synchronisation partielle' : 'Échec de la synchronisation'}
                                    </h6>
                                    {lastResult.error && <p className="mb-0 small">{lastResult.error}</p>}
                                </div>
                            </div>
                        )}

                        <div className="sync-metrics-grid">
                            {/* Inserted */}
                            <div className="sync-metric-card sync-metric-inserted">
                                <div className="sync-metric-icon-box">
                                    <FaCheckCircle />
                                </div>
                                <div className="sync-metric-content">
                                    <div className="sync-metric-title">Nouveaux Employés</div>
                                    <div className="sync-metric-value">{latestSync.recordsInserted}</div>
                                </div>
                            </div>

                            {/* Updated */}
                            <div className="sync-metric-card sync-metric-updated">
                                <div className="sync-metric-icon-box">
                                    <FaSync />
                                </div>
                                <div className="sync-metric-content">
                                    <div className="sync-metric-title">Mis à jour</div>
                                    <div className="sync-metric-value">{latestSync.recordsUpdated}</div>
                                </div>
                            </div>

                            {/* Failed */}
                            <div className="sync-metric-card sync-metric-failed">
                                <div className="sync-metric-icon-box">
                                    <FaTimesCircle />
                                </div>
                                <div className="sync-metric-content">
                                    <div className="sync-metric-title">Échecs</div>
                                    <div className="sync-metric-value">{latestSync.recordsFailed}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historique des synchronisations */}
                <div className="sync-history-card">
                    <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center py-3 px-4">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                            <FaHistory className="text-primary" /> Historique des activités
                        </h5>
                        <button 
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3" 
                            onClick={fetchLogs} 
                            disabled={loadingLogs}
                            style={{ borderRadius: '6px' }}
                        >
                            <FaSync className={loadingLogs ? 'spin-active' : ''} /> Actualiser
                        </button>
                    </div>

                    <div className="card-body p-0">
                        {loadingLogs ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2 text-muted">Récupération de l'historique...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaHistory size={48} className="mb-3 opacity-25" />
                                <p className="mb-1 fw-bold">Aucun enregistrement trouvé</p>
                                <p className="small text-muted mb-0">Lancez une synchronisation pour débuter l'historique.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table sync-table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th className="ps-4">Date & Heure</th>
                                            <th>Statut</th>
                                            <th className="text-center">Ajoutés</th>
                                            <th className="text-center">Mis à jour</th>
                                            <th className="text-center">Échecs</th>
                                            <th className="pe-4 text-end">Action / Erreur</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, index) => (
                                            <React.Fragment key={log.syncLogId}>
                                                <tr className={index === 0 && page === 1 ? 'sync-row-latest' : ''}>
                                                    <td className="ps-4 fw-semibold text-dark small">
                                                        {formatDate(log.syncDate)}
                                                        {index === 0 && page === 1 && (
                                                            <span className="badge bg-primary text-white ms-2" style={{ fontSize: '9px', padding: '3px 6px' }}>Dernier</span>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(log.status)}</td>
                                                    <td className="text-center">
                                                        <span className="badge badge-inserted-count">
                                                            {log.recordsInserted}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge badge-updated-count">
                                                            {log.recordsUpdated}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${log.recordsFailed > 0 ? 'badge-failed-count' : 'badge-zero-count'}`}>
                                                            {log.recordsFailed}
                                                        </span>
                                                    </td>
                                                    <td className="pe-4 text-end">
                                                        {log.errorMessage ? (
                                                            <button 
                                                                className="btn-toggle-details"
                                                                onClick={() => toggleExpandLog(log.syncLogId)}
                                                            >
                                                                {expandedLogId === log.syncLogId ? (
                                                                    <>Masquer <FaChevronUp className="ms-1" /></>
                                                                ) : (
                                                                    <>Détails <FaChevronDown className="ms-1" /></>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="text-muted small">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {/* Détails d'erreur expansibles façon Terminal Unix */}
                                                {log.errorMessage && expandedLogId === log.syncLogId && (
                                                    <tr>
                                                        <td colSpan="6" className="bg-light p-0 border-bottom">
                                                            <div className="terminal-error-box">
                                                                <div className="terminal-header">
                                                                    <span className="terminal-dot terminal-dot-red"></span>
                                                                    <span className="terminal-dot terminal-dot-yellow"></span>
                                                                    <span className="terminal-dot terminal-dot-green"></span>
                                                                    <span className="terminal-title">Rapport d'erreur système</span>
                                                                </div>
                                                                <div className="terminal-content">
                                                                    {log.errorMessage}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {logs.length > 0 && (
                        <div className="sync-pagination-wrapper card-footer d-flex justify-content-between align-items-center py-3 px-4">
                            <small className="text-muted fw-semibold">Page {page}</small>
                            <div className="btn-group btn-group-sm">
                                <button
                                    className="btn btn-outline-secondary sync-pagination-btn"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Précédent
                                </button>
                                <button
                                    className="btn btn-outline-secondary sync-pagination-btn"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Template>
    );
}

export default EmployeeSyncPage;
