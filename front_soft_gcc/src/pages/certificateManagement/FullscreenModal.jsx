import React from 'react';

const FullscreenModal = ({ show, onClose, pdfUrl }) => {
  if (!show) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h5 style={{ margin: 0 }}>Visualisation de l’attestation</h5>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <iframe
          src={pdfUrl}
          title="Aperçu PDF"
          style={styles.iframe}
        />
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '95vw',
    height: '95vh',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 20px rgba(0,0,0,0.25)',
  },
  header: {
    height: '50px',
    padding: '0 1rem',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 600,
  },
  closeButton: {
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    lineHeight: '1',
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
  },
};

export default FullscreenModal;
