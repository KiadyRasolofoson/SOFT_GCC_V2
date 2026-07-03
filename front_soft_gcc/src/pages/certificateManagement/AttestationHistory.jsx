import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Card, Badge, Modal, Button, Toast } from 'react-bootstrap';
import { Eye, Trash } from 'react-bootstrap-icons';
import { FaFileAlt, FaCalendarAlt, FaThumbtack, FaBoxOpen, FaLink } from 'react-icons/fa';
import './AttestationHistory.css'; // pour le style modernisé du tableau
import { urlApi } from '../../helpers/utils';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import FullscreenModal from './FullscreenModal'; // adapte le chemin si nécessaire


const AttestationHistory = ({ registrationNumber }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedToDeleteId, setSelectedToDeleteId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // type: 'success' | 'error'

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!registrationNumber) return;
    setLoading(true);
    axios
      .get(urlApi(`/CareerPlan/Certificate/Get/${registrationNumber}`))
      .then(res => setHistory(res.data))
      .catch(err => console.error('Erreur chargement historique :', err))
      .finally(() => setLoading(false));
  }, [registrationNumber]);

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <Badge bg="info">Fichier exporté</Badge>;
      case 2:
        return <Badge bg="secondary">Fichier envoyé par email</Badge>;
      default:
        return <Badge bg="light" text="dark">Inconnu</Badge>;
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(urlApi(`/CareerPlan/Certificate/GetPdfFilebyId/${id}`), {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      setSelectedPDF(fileURL);
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du fichier PDF :', error);
      showToastMessage("Impossible de charger le fichier PDF.", 'error');
    }
  };

  const handleAskDelete = (id) => {
    setSelectedToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(urlApi(`/CareerPlan/Certificate/Delete/${selectedToDeleteId}`));
      setHistory(prev => prev.filter(item => item.id !== selectedToDeleteId));
      showToastMessage('Attestation supprimée avec succès.', 'success');
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      showToastMessage("Échec de la suppression.", 'error');
    } finally {
      setShowConfirmModal(false);
      setSelectedToDeleteId(null);
    }
  };


  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSelectedToDeleteId(null);
  };


  return (
    <Card className="mt-4">
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        delay={3000}
        autohide
        bg={toast.type === 'success' ? 'success' : 'danger'}
        animation={true} // <== active l'animation de fondu
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
            {toast.type === 'success' ? '✅ Succès' : '❌ Erreur'}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>


      <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
        <i className="mdi mdi-folder-outline  me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
        <h3 className="mb-0" style={{color: '#B8860B'}}>Historique des attestations</h3>
      </div>
      <Modal
        show={showConfirmModal}
        onHide={handleCancelDelete}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Voulez-vous vraiment supprimer ce fichier d’attestation ?</p>
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


      <Card.Body>
        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" /> Chargement...
          </div>
        ) : history.length === 0 ? (
          <p className="text-muted">Aucune attestation trouvée.</p>
        ) : (
            <Table responsive hover className="table-modern align-middle shadow-sm rounded">
              <thead className="table-light">
                <tr>
                  <th><FaFileAlt className="icon-table" />Nom</th>
                  <th><FaCalendarAlt className="icon-table" />Date de création</th>
                  <th><FaThumbtack className="icon-table" />Statut</th>
                  <th><FaBoxOpen className="icon-table" />Taille</th>
                  <th><FaLink className="icon-table" />Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                      <FaFileAlt className="me-2 text-muted" />
                      {item.fileName || 'Attestation.pdf'}
                    </td>
                    <td><DateDisplayWithTime isoDate={item.createdAt} /></td>
                    <td>{renderStatus(item.state)}</td>
                    <td>{(item.fileSize / 1024).toFixed(1)} ko</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleView(item.id)}
                        >
                          <Eye className="me-1" />
                          Visualiser
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleAskDelete(item.id)}
                        >
                          <Trash className="me-1" />
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

        )}
      </Card.Body>
    </Card>
  );
};

export default AttestationHistory;
