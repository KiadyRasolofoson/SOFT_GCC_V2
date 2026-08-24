import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Badge, Modal, Button, Toast } from 'react-bootstrap';
import { Eye, Trash } from 'react-bootstrap-icons';
import './AttestationHistory.css';
import { urlApi } from '../../helpers/utils';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import FullscreenModal from './FullscreenModal';

const AttestationHistory = ({ registrationNumber, embedded = false }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedToDeleteId, setSelectedToDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!registrationNumber) return;
    setLoading(true);
    axios
      .get(urlApi(`/CareerPlan/Certificate/Get/${registrationNumber}`))
      .then((res) => setHistory(res.data))
      .catch((err) => console.error('Erreur chargement historique :', err))
      .finally(() => setLoading(false));
  }, [registrationNumber]);

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <span className="fiche-badge fiche-badge-info">Fichier exporté</span>;
      case 2:
        return <span className="fiche-badge fiche-badge-muted">Envoyé par email</span>;
      default:
        return <Badge bg="light" text="dark">Inconnu</Badge>;
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(urlApi(`/CareerPlan/Certificate/GetPdfFilebyId/${id}`), {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      setSelectedPDF(fileURL);
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du fichier PDF :', error);
      showToastMessage('Impossible de charger le fichier PDF.', 'error');
    }
  };

  const handleAskDelete = (id) => {
    setSelectedToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(urlApi(`/CareerPlan/Certificate/Delete/${selectedToDeleteId}`));
      setHistory((prev) => prev.filter((item) => item.id !== selectedToDeleteId));
      showToastMessage('Attestation supprimée avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      showToastMessage('Échec de la suppression.', 'error');
    } finally {
      setShowConfirmModal(false);
      setSelectedToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSelectedToDeleteId(null);
  };

  const content = (
    <>
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        delay={3000}
        autohide
        bg={toast.type === 'success' ? 'success' : 'danger'}
        animation
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          minWidth: '300px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          borderRadius: '0.75rem',
        }}
      >
        <Toast.Header closeButton={false}>
          <strong className="me-auto">
            {toast.type === 'success' ? 'Succès' : 'Erreur'}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>

      <Modal show={showConfirmModal} onHide={handleCancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Voulez-vous vraiment supprimer ce fichier d&apos;attestation ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      <FullscreenModal
        show={showModal}
        onClose={() => setShowModal(false)}
        pdfUrl={selectedPDF}
      />

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" /> Chargement...
        </div>
      ) : history.length === 0 ? (
        <p className="fiche-table-empty mb-0">Aucune attestation trouvée.</p>
      ) : (
        <div className="fiche-table-wrap">
          <Table responsive hover className="table-modern fiche-table align-middle mb-0">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Date de création</th>
                <th>Statut</th>
                <th>Taille</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="text-truncate" style={{ maxWidth: '220px' }}>
                    <i className="mdi mdi-file-pdf-box me-2 text-muted" />
                    {item.fileName || 'Attestation.pdf'}
                  </td>
                  <td>
                    <DateDisplayWithTime isoDate={item.createdAt} />
                  </td>
                  <td>{renderStatus(item.state)}</td>
                  <td>{item.fileSize != null ? `${(item.fileSize / 1024).toFixed(1)} ko` : '—'}</td>
                  <td>
                    <div className="fiche-actions">
                      <button
                        type="button"
                        className="fiche-btn-sm fiche-btn-outline"
                        onClick={() => handleView(item.id)}
                      >
                        <Eye className="me-1" />
                        Visualiser
                      </button>
                      <button
                        type="button"
                        className="fiche-btn-sm fiche-btn-danger-outline"
                        onClick={() => handleAskDelete(item.id)}
                      >
                        <Trash className="me-1" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="fiche-history-embedded">{content}</div>;
  }

  return (
    <div className="fiche-card fiche-career-card mt-4">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-folder-outline" />
          Historique des attestations
        </h5>
      </div>
      <div className="fiche-card-body">{content}</div>
    </div>
  );
};

export default AttestationHistory;
