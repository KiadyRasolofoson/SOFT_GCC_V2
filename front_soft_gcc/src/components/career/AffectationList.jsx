import React, { useEffect, useState } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import FormattedDate from '../../helpers/FormattedDate';

const ASSIGNMENT_TYPES = [
  { id: 1, label: 'Nomination', icon: 'mdi-account-star' },
  { id: 2, label: 'Avancements', icon: 'mdi-trending-up' },
  { id: 3, label: 'Mise en disponibilités', icon: 'mdi-calendar-remove' },
];

function ActionButtons({ onEdit, onDelete, onDetail, isClosed }) {
  if (isClosed) {
    return (
      <div className="fiche-actions">
        <button
          type="button"
          className="fiche-action-btn fiche-action-view"
          onClick={onDetail}
          title="Voir le détail"
        >
          <i className="mdi mdi-eye" />
        </button>
      </div>
    );
  }

  return (
    <div className="fiche-actions">
      <button
        type="button"
        className="fiche-action-btn fiche-action-edit"
        onClick={onEdit}
        title="Modifier"
      >
        <i className="mdi mdi-pencil" />
      </button>
      <button
        type="button"
        className="fiche-action-btn fiche-action-delete"
        onClick={onDelete}
        title="Supprimer"
      >
        <i className="mdi mdi-delete" />
      </button>
    </div>
  );
}

function StateBadge({ state }) {
  const isClosed = state === 'terminé';
  return (
    <span className={`fiche-badge ${isClosed ? 'fiche-badge-warning' : 'fiche-badge-success'}`}>
      {state || '—'}
    </span>
  );
}

function EmptyRow({ colSpan, label }) {
  return (
    <tr>
      <td colSpan={colSpan} className="fiche-table-empty">
        {label}
      </td>
    </tr>
  );
}

function AffectationList({
  dataAssignmentAppointment,
  dataAssignmentAdvancement,
  dataAssignmentAvailability,
  fetchData,
}) {
  const navigate = useNavigate();
  const [selectedAssignment, setSelectedAssignment] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [descriptionToDelete, setDescriptionToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleClickEdit = (item) => {
    navigate(`/soft-gcc/carrieres/fiche/modifier/${item.careerPlanId}`);
  };

  const handleClickDetail = (item) => {
    navigate(`/soft-gcc/carrieres/fiche/detail/${item.careerPlanId}`);
  };

  const confirmDeleteItem = (url, description) => {
    setItemToDelete(url);
    setDescriptionToDelete(description);
    setShowConfirmDelete(true);
  };

  const handleCloseDelete = () => setShowConfirmDelete(false);

  const handleDeleteConfirmed = async () => {
    try {
      await axios.put(urlApi(itemToDelete));
      setShowConfirmDelete(false);
      setSuccessMessage("L'élément a été supprimé avec succès.");
      await fetchData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression: ' + err.message);
    }
  };

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const currentType = ASSIGNMENT_TYPES.find((t) => t.id === selectedAssignment);

  const renderAppointmentRows = () => {
    if (!Array.isArray(dataAssignmentAppointment) || dataAssignmentAppointment.length === 0) {
      return <EmptyRow colSpan={10} label="Aucune nomination enregistrée." />;
    }

    return dataAssignmentAppointment.map((item, id) => {
      const isClosed = item.careerState === 'terminé';
      return (
        <tr key={item.careerPlanId || id}>
          <td>{item.assignmentDate ? new Date(item.assignmentDate).toLocaleDateString() : '—'}</td>
          <td>{item.establishmentName || '—'}</td>
          <td>{item.departmentName || '—'}</td>
          <td>{item.positionName || '—'}</td>
          <td>{item.employeeTypeName || '—'}</td>
          <td>
            <FormattedDate date={item.assignmentDate} />
          </td>
          <td>
            <FormattedDate date={item.endingContract} />
          </td>
          <td>{item.netSalary != null ? item.netSalary : '—'}</td>
          <td>
            <StateBadge state={item.careerState} />
          </td>
          <td>
            <ActionButtons
              isClosed={isClosed}
              onEdit={() => handleClickEdit(item)}
              onDetail={() => handleClickDetail(item)}
              onDelete={() =>
                confirmDeleteItem(
                  `/CareerPlan/delete/${item.careerPlanId}`,
                  ` la carrière ${item.assignmentTypeName} pour l'employé ${item.registrationNumber}`
                )
              }
            />
          </td>
        </tr>
      );
    });
  };

  const renderAdvancementRows = () => {
    if (!Array.isArray(dataAssignmentAdvancement) || dataAssignmentAdvancement.length === 0) {
      return <EmptyRow colSpan={6} label="Aucun avancement enregistré." />;
    }

    return dataAssignmentAdvancement.map((item, id) => (
      <tr key={item.careerPlanId || id}>
        <td>{item.assignmentDate ? new Date(item.assignmentDate).toLocaleDateString() : '—'}</td>
        <td>{item.departmentName || '—'}</td>
        <td>{item.socioCategoryProfessionalName || '—'}</td>
        <td>{item.indicationName || '—'}</td>
        <td>{item.echelonName || '—'}</td>
        <td>
          <ActionButtons
            onEdit={() => handleClickEdit(item)}
            onDelete={() =>
              confirmDeleteItem(
                `/CareerPlan/delete/${item.careerPlanId}`,
                ` la carrière ${item.assignmentTypeName} pour l'employé ${item.registrationNumber}`
              )
            }
          />
        </td>
      </tr>
    ));
  };

  const renderAvailabilityRows = () => {
    if (!Array.isArray(dataAssignmentAvailability) || dataAssignmentAvailability.length === 0) {
      return <EmptyRow colSpan={7} label="Aucune mise en disponibilité enregistrée." />;
    }

    return dataAssignmentAvailability.map((item, id) => {
      const isClosed = item.careerState === 'terminé';
      return (
        <tr key={item.careerPlanId || id}>
          <td>{item.assignmentDate ? new Date(item.assignmentDate).toLocaleDateString() : '—'}</td>
          <td>{item.assigningInstitution || '—'}</td>
          <td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'}</td>
          <td>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '—'}</td>
          <td>{item.reason || '—'}</td>
          <td>
            <StateBadge state={item.careerState} />
          </td>
          <td>
            <ActionButtons
              isClosed={isClosed}
              onEdit={() => handleClickEdit(item)}
              onDetail={() => handleClickDetail(item)}
              onDelete={() =>
                confirmDeleteItem(
                  `/CareerPlan/delete/${item.careerPlanId}`,
                  ` la carrière ${item.assignmentTypeName} pour l'employé ${item.registrationNumber}`
                )
              }
            />
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="fiche-card fiche-career-card">
      <div className="fiche-card-header">
        <h5>
          <i className="mdi mdi-timeline-text" />
          Suivi carrière
        </h5>
      </div>

      <div className="fiche-card-body">
        {successMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="fiche-filter-tabs" role="tablist">
          {ASSIGNMENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              role="tab"
              aria-selected={selectedAssignment === type.id}
              className={`fiche-filter-tab${selectedAssignment === type.id ? ' active' : ''}`}
              onClick={() => setSelectedAssignment(type.id)}
            >
              <i className={`mdi ${type.icon}`} />
              {type.label}
            </button>
          ))}
        </div>

        <div className="fiche-section-title">
          <i className={`mdi ${currentType?.icon || 'mdi-briefcase'}`} />
          {currentType?.label}
        </div>

        <div className="fiche-table-wrap">
          {selectedAssignment === 1 && (
            <table className="table table-hover fiche-table">
              <thead>
                <tr>
                  <th>Date d&apos;affectation</th>
                  <th>Établissement</th>
                  <th>Département</th>
                  <th>Poste</th>
                  <th>Type</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Salaire</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderAppointmentRows()}</tbody>
            </table>
          )}

          {selectedAssignment === 2 && (
            <table className="table table-hover fiche-table">
              <thead>
                <tr>
                  <th>Date d&apos;affectation</th>
                  <th>Département</th>
                  <th>Catégorie socio-professionnelle</th>
                  <th>Indice</th>
                  <th>Échelon</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderAdvancementRows()}</tbody>
            </table>
          )}

          {selectedAssignment === 3 && (
            <table className="table table-hover fiche-table">
              <thead>
                <tr>
                  <th>Date d&apos;affectation</th>
                  <th>Institution</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Motif</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderAvailabilityRows()}</tbody>
            </table>
          )}
        </div>
      </div>

      <Modal show={showConfirmDelete} onHide={handleCloseDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>Êtes-vous sûr de vouloir supprimer {descriptionToDelete} ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            Non
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed}>
            Oui
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AffectationList;
