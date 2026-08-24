import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import Skeleton from 'react-loading-skeleton';
import { FaUsers, FaClipboardList, FaBriefcase, FaChartLine } from 'react-icons/fa';
import './SummaryCards.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import api from '../../helpers/api';

const KPI_THEMES = {
  employees: { accent: '#2563eb', soft: '#eff6ff' },
  skills: { accent: '#059669', soft: '#ecfdf5' },
  positions: { accent: '#0891b2', soft: '#ecfeff' },
  coverage: { accent: '#d97706', soft: '#fffbeb' },
  evolutions: { accent: '#1d4ed8', soft: '#dbeafe' },
  attestations: { accent: '#0d9488', soft: '#f0fdfa' },
};

const SummaryCards = ({ dashboard }) => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardDetail, setCardDetail] = useState([]);
  const [boardDetail, setBoardDetail] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const dataSource = [
    {
      key: 'employees',
      urlList: 'Dashboard/details/employeeDetails',
      urlBoard: 'Dashboard/details/employeeNumberSexAndActivity',
      columns: ['Matricule', 'Sexe', 'Nom', 'Prenom', 'Etat'],
      fields: ['registrationNumber', 'sex', 'name', 'firstName', 'isActive'],
      title: 'Total employés',
      value: dashboard.employeeTotal,
      icon: <FaUsers />,
    },
    {
      key: 'skills',
      urlList: 'Dashboard/details/skillsRepertory',
      columns: ['Compétence', 'Postes affectéés'],
      fields: ['skillName', 'positionCount'],
      title: 'Compétences répertoriées',
      value: dashboard.skillRepertory,
      icon: <FaClipboardList />,
    },
    {
      key: 'positions',
      urlList: 'Dashboard/details/positionActiveDetails',
      columns: ['Postes', 'Employés'],
      fields: ['positionName', 'employeeNumber'],
      title: 'Postes actifs',
      value: dashboard.activePosition,
      icon: <FaBriefcase />,
    },
    {
      key: 'coverage',
      urlList: 'Dashboard/details/coverageRatiosDetails',
      columns: ['Postes', 'Compétences', 'Valeur recquis', 'Taux moyen'],
      fields: ['positionName', 'skillName', 'requiredLevel', 'averageLevel'],
      title: 'Taux de couverture moyen',
      value: `${dashboard.coverageRatios} %`,
      icon: <FaChartLine />,
    },
    {
      key: 'evolutions',
      urlList: 'Dashboard/details/wishEvolution',
      urlBoard: 'Dashboard/details/stateValue',
      columns: ['Nom', 'Prenom', 'Motivation', 'Poste souhaité', 'Priorité', 'Etat'],
      fields: ['name', 'firstName', 'motivation', 'wishPosition', 'priorityLetter', 'stateLetter'],
      title: 'Demandes d’évolutions',
      value: dashboard.wishEvolutionTotal,
      icon: <i className="mdi mdi-trending-up stats-icon" />,
    },
    {
      key: 'attestations',
      urlList: 'Dashboard/details/certificateDetails',
      urlBoard: 'Dashboard/details/certificateByState',
      columns: ['Reference', 'Nom fichier', 'Type', 'Mode'],
      fields: ['reference', 'fileName', 'certificateTypeName', 'stateLetter'],
      title: 'Attestations générées',
      value: dashboard.allAttestationNumber,
      icon: <i className="mdi mdi-file-document-outline stats-icon" />,
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = async (card) => {
    setSelectedCard(card);
    setShowModal(true);
    setLoadingDetail(true);
    setCardDetail(null);
    setError(null);

    try {
      const listPromise = api.get(`/${card.urlList}`);
      const boardPromise = card.urlBoard
        ? api.get(`/${card.urlBoard}`)
        : Promise.resolve(null);

      const [listResult, boardResult] = await Promise.allSettled([
        listPromise,
        boardPromise,
      ]);

      if (listResult.status === 'fulfilled') {
        setCardDetail(listResult.value.data);
      } else {
        console.error('Erreur liste détail :', listResult.reason);
        setError({ error: 'Impossible de charger les détails.' });
        setCardDetail([]);
      }

      if (boardResult.status === 'fulfilled' && boardResult.value) {
        setBoardDetail(boardResult.value.data || []);
      } else {
        if (boardResult.status === 'rejected') {
          console.error('Erreur stats détail :', boardResult.reason);
        }
        setBoardDetail([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails :', err);
      setError({ error: 'Impossible de charger les détails.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedCard(null);
    setCardDetail(null);
  };

  return (
    <>
      <div className="db-kpis">
        <Row className="g-3">
          {dataSource.map((item) => {
            const theme = KPI_THEMES[item.key] || KPI_THEMES.employees;
            return (
              <Col xs={12} sm={6} xl={4} key={item.key}>
                <button
                  type="button"
                  className="db-kpi"
                  style={{
                    '--kpi-accent': theme.accent,
                    '--kpi-soft': theme.soft,
                  }}
                  onClick={() => handleCardClick(item)}
                >
                  <span className="db-kpi__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="db-kpi__meta">
                    <p className="db-kpi__label">{item.title}</p>
                    {loading ? (
                      <Skeleton height={28} width={72} />
                    ) : (
                      <p className="db-kpi__value">{item.value ?? '—'}</p>
                    )}
                    <span className="db-kpi__hint">Voir le détail</span>
                  </span>
                </button>
              </Col>
            );
          })}
        </Row>
      </div>

      <Dialog open={showModal} onClose={handleClose} keepMounted fullWidth maxWidth="lg">
        <DialogTitle className="db-dialog-title">
          <span className="db-dialog-title__text">
            {selectedCard?.title || 'Détail'}
          </span>
          {selectedCard?.value != null && (
            <span className="db-dialog-title__badge">{selectedCard.value}</span>
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, px: 3 }}>
          {loadingDetail ? (
            <div className="db-dialog-loading">
              <Spinner animation="border" size="sm" />
              Chargement des détails…
            </div>
          ) : error?.error || cardDetail?.error ? (
            <p className="text-danger mb-0">{error?.error || cardDetail.error}</p>
          ) : (
            <>
              {boardDetail?.length > 0 && (
                <div className="db-dialog-board">
                  {boardDetail.map((item, index) => (
                    <div
                      key={index}
                      className="db-dialog-stat"
                      style={
                        item.backgroundColor
                          ? { backgroundColor: item.backgroundColor, borderColor: 'transparent' }
                          : undefined
                      }
                    >
                      <span className="db-dialog-stat__label">{item.label}</span>
                      <span
                        className="db-dialog-stat__value"
                        style={item.color ? { color: item.color } : undefined}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="db-dialog-table-wrap">
                <table className="db-dialog-table">
                  <thead>
                    <tr>
                      {selectedCard?.columns.map((col, idx) => (
                        <th key={idx}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(cardDetail) ? cardDetail : []).map((row, idx) => (
                      <tr key={idx}>
                        {selectedCard.fields.map((field, i) => (
                          <td key={i}>{row[field]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            onClick={handleClose}
            variant="contained"
            disableElevation
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SummaryCards;
