import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import FormattedDate from '../../helpers/FormattedDate';
import ModalAddSkill from './ModalAddSkill';
import ModalAddEducation from './ModalAddEducation';
import ModalAddLanguage from './ModalAddLanguage';
import ModalAddOtherSkill from './ModalAddOtherSkill';
import ModalEditSkill from './ModalEditSkill';
import ModalEditEducation from './ModalEditEducation';
import ModalEditLanguage from './ModalEditLanguage';
import ModalEditOtherSkill from './ModalEditOtherSkill';
import LoaderComponent from '../../helpers/LoaderComponent';
import DateDisplayNoTime from '../../helpers/DateDisplayNoTime';
import api from '../../helpers/api';

function getStateLetter(state) {
  if (state >= 5 && state <= 9) {
    return 'Validé par évaluation';
  }
  if (state >= 10) {
    return 'Confirmé';
  }
  return 'Non validé';
}

function getBadgeState(state) {
  if (state >= 5 && state <= 9) {
    return 'badge badge-warning';
  }
  if (state >= 10) {
    return 'badge badge-success';
  }
  return 'badge badge-danger';
}

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="skills-actions">
      <button type="button" className="skills-action-btn skills-action-edit" onClick={onEdit} title="Modifier">
        <i className="mdi mdi-pencil" />
      </button>
      <button type="button" className="skills-action-btn skills-action-delete" onClick={onDelete} title="Supprimer">
        <i className="mdi mdi-delete" />
      </button>
    </div>
  );
}

function CardSkills({ dataEmployeeDescription, idEmployee }) {
  const [dataColumn, setDataColumn] = useState(['Domaine', 'Compétences', 'Niveau', 'État']);
  const [modalDisplay, setModalDisplay] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [descriptionToDelete, setDescriptionToDelete] = useState(null);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedOtherSkill, setSelectedOtherSkill] = useState(null);

  const [data, setData] = useState({
    skills: [],
    education: [],
    language: [],
    otherSkills: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSkill, setShowSkill] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [showEditEducation, setShowEditEducation] = useState(false);
  const [showEditLanguage, setShowEditLanguage] = useState(false);
  const [showEditOtherSkill, setShowEditOtherSkill] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [skillsResponse, educationResponse, languageResponse, otherFormationResponse] = await Promise.all([
        api.get(`/EmployeeSkills/employee/${idEmployee}`),
        api.get(`/EmployeeEducation/employee/${idEmployee}`),
        api.get(`/EmployeeLanguage/employee/${idEmployee}`),
        api.get(`/EmployeeOtherFormation/employee/${idEmployee}`),
      ]);
      setData({
        skills: skillsResponse.data || [],
        education: educationResponse.data || [],
        language: languageResponse.data || [],
        otherSkills: otherFormationResponse.data || [],
      });
      setError(null);
    } catch (err) {
      console.log(err);
      setError(`Erreur lors de la récupération des données : ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [idEmployee]);

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(itemToDelete);
      setShowConfirmDelete(false);
      await fetchData();
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Non autorisé. Merci de vous reconnecter.');
      } else {
        setError(`Erreur lors de la suppression : ${err.message}`);
      }
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const addCardSkills = () => {
    setDataColumn(['Domaine', 'Compétences', 'Niveau', 'État']);
    setModalDisplay(1);
  };

  const addCardEducation = () => {
    setDataColumn(['Filière', 'Niveau', 'École', 'Date début', 'Date fin']);
    setModalDisplay(2);
  };

  const addCardLanguage = () => {
    setDataColumn(['Langues', 'Niveau', 'État']);
    setModalDisplay(3);
  };

  const addCardOther = () => {
    setDataColumn(['Description', 'Date début', 'Date fin', 'Commentaire']);
    setModalDisplay(4);
  };

  const confirmDeleteItem = (url, description, itemIndex) => {
    setItemToDelete(url);
    setDescriptionToDelete(description);
    setShowConfirmDelete(true);

    if (itemIndex === 1) {
      dataEmployeeDescription.skillNumber--;
    }
    if (itemIndex === 2) {
      dataEmployeeDescription.educationNumber--;
    }
    if (itemIndex === 3) {
      dataEmployeeDescription.languageNumber--;
    }
    if (itemIndex === 4) {
      dataEmployeeDescription.otherFormationNumber--;
    }
  };

  const handleCloseDelete = () => setShowConfirmDelete(false);

  const handleCloseSkill = () => setShowSkill(false);
  const handleShowSkill = () => setShowSkill(true);
  const handleCloseEducation = () => setShowEducation(false);
  const handleShowEducation = () => setShowEducation(true);
  const handleCloseLanguage = () => setShowLanguage(false);
  const handleShowLanguage = () => setShowLanguage(true);
  const handleCloseOther = () => setShowOther(false);
  const handleShowOther = () => setShowOther(true);
  const handleCloseEditSkill = () => setShowEditSkill(false);
  const handleShowEditSkill = () => setShowEditSkill(true);
  const handleCloseEditEducation = () => setShowEditEducation(false);
  const handleShowEditEducation = () => setShowEditEducation(true);
  const handleCloseEditLanguage = () => setShowEditLanguage(false);
  const handleShowEditLanguage = () => setShowEditLanguage(true);
  const handleCloseEditOtherSkill = () => setShowEditOtherSkill(false);
  const handleShowEditOtherSkill = () => setShowEditOtherSkill(true);

  const handleAddClick = () => {
    if (modalDisplay === 2) handleShowEducation();
    else if (modalDisplay === 3) handleShowLanguage();
    else if (modalDisplay === 4) handleShowOther();
    else handleShowSkill();
  };

  const tabs = [
    {
      id: 2,
      label: `Diplômes & formations (${dataEmployeeDescription.educationNumber ?? 0})`,
      onClick: addCardEducation,
    },
    {
      id: 1,
      label: `Compétences (${dataEmployeeDescription.skillNumber ?? 0})`,
      onClick: addCardSkills,
    },
    {
      id: 3,
      label: `Langues (${dataEmployeeDescription.languageNumber ?? 0})`,
      onClick: addCardLanguage,
    },
    {
      id: 4,
      label: `Autres (${dataEmployeeDescription.otherFormationNumber ?? 0})`,
      onClick: addCardOther,
    },
  ];

  const renderRows = () => {
    if (modalDisplay === 2) {
      if (!Array.isArray(data.education) || data.education.length === 0) {
        return (
          <tr>
            <td colSpan={dataColumn.length + 1} className="skills-empty">
              Aucun diplôme ou formation enregistré.
            </td>
          </tr>
        );
      }
      return data.education.map((item, id) => (
        <tr key={id}>
          <td>{item.studyPathName}</td>
          <td>{item.degreeName}</td>
          <td>{item.schoolName}</td>
          <td>
            <DateDisplayNoTime isoDate={item.startDate} />
          </td>
          <td>
            <DateDisplayNoTime isoDate={item.endingDate} />
          </td>
          <td>
            <ActionButtons
              onEdit={() => {
                setSelectedEducation(item);
                handleShowEditEducation();
              }}
              onDelete={() =>
                confirmDeleteItem(
                  `/EmployeeEducation/${item.employeeEducationId}`,
                  ` le diplôme & formation ${item.studyPathName} ${item.degreeName}`,
                  2
                )
              }
            />
          </td>
        </tr>
      ));
    }

    if (modalDisplay === 3) {
      if (!Array.isArray(data.language) || data.language.length === 0) {
        return (
          <tr>
            <td colSpan={dataColumn.length + 1} className="skills-empty">
              Aucune langue enregistrée.
            </td>
          </tr>
        );
      }
      return data.language.map((item, id) => (
        <tr key={id}>
          <td>{item.languageName}</td>
          <td>{item.level == 0 ? <span>—</span> : <span>{item.level} %</span>}</td>
          <td>
            <label className={getBadgeState(item.state)}>{getStateLetter(item.state)}</label>
          </td>
          <td>
            <ActionButtons
              onEdit={() => {
                setSelectedLanguage(item);
                handleShowEditLanguage();
              }}
              onDelete={() =>
                confirmDeleteItem(
                  `/EmployeeLanguage/${item.employeeLanguageId}`,
                  ` la compétence linguistique ${item.languageName}`,
                  3
                )
              }
            />
          </td>
        </tr>
      ));
    }

    if (modalDisplay === 4) {
      if (!Array.isArray(data.otherSkills) || data.otherSkills.length === 0) {
        return (
          <tr>
            <td colSpan={dataColumn.length + 1} className="skills-empty">
              Aucune autre formation enregistrée.
            </td>
          </tr>
        );
      }
      return data.otherSkills.map((item, id) => (
        <tr key={id}>
          <td>{item.description}</td>
          <td>
            <FormattedDate date={item.startDate} />
          </td>
          <td>
            <FormattedDate date={item.endDate} />
          </td>
          <td>{item.comment}</td>
          <td>
            <ActionButtons
              onEdit={() => {
                setSelectedOtherSkill(item);
                handleShowEditOtherSkill();
              }}
              onDelete={() =>
                confirmDeleteItem(
                  `/EmployeeOtherFormation/${item.employeeOtherFormationId}`,
                  ` la formation ${item.description}`,
                  4
                )
              }
            />
          </td>
        </tr>
      ));
    }

    if (!data.skills || data.skills.length === 0) {
      return (
        <tr>
          <td colSpan={dataColumn.length + 1} className="skills-empty">
            Aucune compétence enregistrée.
          </td>
        </tr>
      );
    }

    return data.skills.map((item, id) => (
      <tr key={id}>
        <td>{item.domainSkillName}</td>
        <td>{item.skillName}</td>
        <td>{item.level == 0 ? <span>—</span> : <span>{item.level} %</span>}</td>
        <td>
          <label className={getBadgeState(item.state)}>{getStateLetter(item.state)}</label>
        </td>
        <td>
          <ActionButtons
            onEdit={() => {
              setSelectedSkill(item);
              handleShowEditSkill();
            }}
            onDelete={() =>
              confirmDeleteItem(
                `/employeeSkills/${item.employeeSkillId}`,
                ` la compétence ${item.skillName}`,
                1
              )
            }
          />
        </td>
      </tr>
    ));
  };

  if (isLoading) {
    return (
      <div className="skills-card">
        <div className="skills-card-body">
          <LoaderComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="skills-card">
      <div className="skills-card-header">
        <h5>
          <i className="mdi mdi-school" />
          Compétences
        </h5>
        <button type="button" className="skills-btn skills-btn-primary" onClick={handleAddClick}>
          <i className="mdi mdi-plus" />
          Ajouter
        </button>
      </div>

      <div className="skills-card-body">
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="skills-toolbar">
          <div className="skills-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={modalDisplay === tab.id}
                className={`skills-tab${modalDisplay === tab.id ? ' active' : ''}`}
                onClick={tab.onClick}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ModalAddSkill
          showSkill={showSkill}
          handleCloseSkill={handleCloseSkill}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
          dataEmployeeDescription={dataEmployeeDescription}
        />
        <ModalAddEducation
          showEducation={showEducation}
          handleCloseEducation={handleCloseEducation}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
          dataEmployeeDescription={dataEmployeeDescription}
        />
        <ModalAddLanguage
          showLanguage={showLanguage}
          handleCloseLanguage={handleCloseLanguage}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
          dataEmployeeDescription={dataEmployeeDescription}
        />
        <ModalAddOtherSkill
          showOtherSkill={showOther}
          handleCloseOtherSkill={handleCloseOther}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
          dataEmployeeDescription={dataEmployeeDescription}
        />
        <ModalEditSkill
          showEditSkill={showEditSkill}
          handleCloseEditSkill={handleCloseEditSkill}
          selectedSkill={selectedSkill}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
        />
        <ModalEditEducation
          showEditEducation={showEditEducation}
          handleCloseEditEducation={handleCloseEditEducation}
          selectedEducation={selectedEducation}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
        />
        <ModalEditLanguage
          showEditLanguage={showEditLanguage}
          handleCloseEditLanguage={handleCloseEditLanguage}
          selectedLanguage={selectedLanguage}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
        />
        <ModalEditOtherSkill
          showEditOtherSkill={showEditOtherSkill}
          handleCloseEditOtherSkill={handleCloseEditOtherSkill}
          selectedOtherSkill={selectedOtherSkill}
          idEmployee={idEmployee}
          fetchData={fetchData}
          error={error}
        />

        <Modal show={showConfirmDelete} onHide={handleCloseDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmer la suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Êtes-vous sûr de vouloir supprimer {descriptionToDelete} ?
            {error && <div className="alert alert-danger mt-2">{error}</div>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseDelete}>
              Non
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              Oui
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="skills-table-wrap">
          <table className="table table-hover skills-table">
            <thead>
              <tr>
                {dataColumn.map((item, index) => (
                  <th key={index}>{item}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CardSkills;
