import React, { useState, useEffect, useCallback } from 'react';
import Template from '../Template';
import { runSync, getSyncLogs } from '../../services/EmployeeSyncService';
import { toast } from 'react-toastify';
import { FaSync, FaHistory, FaPlay, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaDownload } from 'react-icons/fa';

function EmployeeSyncPage() {
    const [syncing, setSyncing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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
                `Synchro terminée : ${result.recordsInserted} ajoutés, ${result.recordsUpdated} mis à jour` +
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
            'Success': { color: 'success', icon: <FaCheckCircle />, label: 'Succès' },
            'Partial': { color: 'warning', icon: <FaExclamationTriangle />, label: 'Partiel' },
            'Failed':  { color: 'danger',  icon: <FaTimesCircle />,       label: 'Échec' },
        };
        const s = map[status] || map['Failed'];
        return (
            <span className={`badge bg-${s.color} bg-opacity-15 text-${s.color} d-inline-flex align-items-center gap-1 px-2 py-1`}>
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

    return (
        <Template>
            <div className="container-fluid px-2 py-3 px-md-4">

                {/* En-tête */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                            <FaSync size={24} />
                        </div>
                        <div>
                            <h4 className="fw-bold mb-1">Synchronisation des Employés</h4>
                            <p className="text-muted small mb-0">
                                Synchronise les données salariés de <strong>p_sw (T_SAL)</strong> vers <strong>Soft GCC (Employee)</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4"
                        onClick={handleRunSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" />
                                Synchronisation en cours...
                            </>
                        ) : (
                            <>
                                <FaPlay /> Lancer la synchronisation
                            </>
                        )}
                    </button>
                </div>

                {/* Résultat de la dernière synchro */}
                {lastResult && (
                    <div className={`alert alert-${lastResult.status === 'Success' ? 'success' : lastResult.status === 'Partial' ? 'warning' : 'danger'} border-0 shadow-sm d-flex align-items-center gap-3 mb-4 rounded-3`}>
                        <div className={`p-2 rounded-circle bg-${lastResult.status === 'Success' ? 'success' : lastResult.status === 'Partial' ? 'warning' : 'danger'} bg-opacity-20`}>
                            {lastResult.status === 'Success' ? <FaCheckCircle size={28} className={`text-${lastResult.status === 'Success' ? 'success' : 'danger'}`} /> :
                             lastResult.status === 'Partial' ? <FaExclamationTriangle size={28} className="text-warning" /> :
                             <FaTimesCircle size={28} className="text-danger" />}
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold">
                                {lastResult.status === 'Success' ? 'Synchronisation réussie' :
                                 lastResult.status === 'Partial' ? 'Synchronisation partielle' : 'Échec de la synchronisation'}
                            </h6>
                            <div className="d-flex flex-wrap gap-3 small text-muted">
                                <span><strong className="text-success">{lastResult.recordsInserted}</strong> ajoutés</span>
                                <span><strong className="text-primary">{lastResult.recordsUpdated}</strong> mis à jour</span>
                                {lastResult.recordsFailed > 0 && (
                                    <span><strong className="text-danger">{lastResult.recordsFailed}</strong> échecs</span>
                                )}
                            </div>
                            {lastResult.error && <p className="mb-0 mt-1 text-danger small">{lastResult.error}</p>}
                        </div>
                    </div>
                )}

                {/* Carte : Historique */}
                <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center py-3 px-4">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                            <FaHistory className="text-primary" /> Historique des synchronisations
                        </h5>
                        <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogs} disabled={loadingLogs}>
                            <FaSync className={loadingLogs ? 'fa-spin' : ''} /> Actualiser
                        </button>
                    </div>
                    <div className="card-body p-0">
                        {loadingLogs ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" />
                                <p className="mt-2 text-muted">Chargement...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaHistory size={48} className="mb-3 opacity-25" />
                                <p>Aucune synchronisation enregistrée</p>
                                <p className="small">Cliquez sur &quot;Lancer la synchronisation&quot; pour commencer.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Date</th>
                                            <th>Statut</th>
                                            <th className="text-center">Ajoutés</th>
                                            <th className="text-center">Mis à jour</th>
                                            <th className="text-center">Échecs</th>
                                            <th className="pe-4">Erreur</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.syncLogId}>
                                                <td className="ps-4 small">{formatDate(log.syncDate)}</td>
                                                <td>{getStatusBadge(log.status)}</td>
                                                <td className="text-center">
                                                    <span className="badge bg-success bg-opacity-15 text-success fw-semibold">{log.recordsInserted}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge bg-primary bg-opacity-15 text-primary fw-semibold">{log.recordsUpdated}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge fw-semibold ${log.recordsFailed > 0 ? 'bg-danger bg-opacity-15 text-danger' : 'bg-light text-muted'}`}>
                                                        {log.recordsFailed}
                                                    </span>
                                                </td>
                                                <td className="pe-4 small text-muted">
                                                    {log.errorMessage || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {logs.length > 0 && (
                        <div className="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center py-3 px-4">
                            <small className="text-muted">Page {page}</small>
                            <div className="btn-group btn-group-sm">
                                <button
                                    className="btn btn-outline-secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Précédent
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
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
