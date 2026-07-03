import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Modal, Spinner } from 'react-bootstrap';
import Skeleton from 'react-loading-skeleton';
import { FaUsers, FaClipboardList, FaBriefcase, FaChartLine } from 'react-icons/fa';
import './SummaryCards.css';
import { urlApi } from '../../helpers/utils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slide,
} from '@mui/material';
import { data } from 'react-router-dom';
import axios from 'axios';
import api from '../../helpers/api';

const SummaryCards = ({ dashboard }) => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardDetail, setCardDetail] = useState([]);
  const [boardDetail, setBoardDetail] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(false);

  const dataSource = [
    { 
      key: 'employees', 
      urlList: 'Dashboard/details/employeeDetails', 
      urlBoard: 'Dashboard/details/employeeNumberSexAndActivity',
      columns: ['Matricule', 'Sexe', 'Nom', 'Prenom', 'Etat'], 
      fields: ['registrationNumber', 'sex', 'name', 'firstName', 'isActive'],
      title: 'Total employés', 
      value: dashboard.employeeTotal, 
      icon: <FaUsers />, color: '#007bff' 
    },
    { 
      key: 'skills', 
      urlList: 'Dashboard/details/skillsRepertory', 
      columns: ['Compétence', 'Postes affectéés'], 
      fields: ['skillName', 'positionCount'],
      title: 'Compétences répertoriées', 
      value: dashboard.skillRepertory, 
      icon: <FaClipboardList />, 
      color: '#28a745' 
    },
    { 
      key: 'positions', 
      urlList: 'Dashboard/details/positionActiveDetails', 
      columns: ['Postes', 'Employés'], 
      fields: ['positionName', 'employeeNumber'],
      title: 'Postes actifs', 
      value: dashboard.activePosition, 
      icon: <FaBriefcase />, 
      color: '#17a2b8' 
    },
    { 
      key: 'coverage', 
      urlList: 'Dashboard/details/coverageRatiosDetails', 
      columns: ['Postes', 'Compétences', 'Valeur recquis', 'Taux moyen'], 
      fields: ['positionName', 'skillName', 'requiredLevel', 'averageLevel'],
      title: 'Taux de couverture moyen', 
      value: `${dashboard.coverageRatios} %`, 
      icon: <FaChartLine />, 
      color: '#ffc107' 
    },
    { 
      key: 'evolutions', 
      urlList: 'Dashboard/details/wishEvolution', 
      urlBoard: 'Dashboard/details/stateValue',
      columns: ['Nom', 'Prenom', 'Motivation', 'Poste souhaité', 'Priorité', 'Etat'], 
      fields: ['name', 'firstName', 'motivation', 'wishPosition', 'priorityLetter', 'stateLetter'],
      title: 'Total demandes évolutions', 
      value: dashboard.wishEvolutionTotal, 
      icon: <i className="mdi mdi-trending-up stats-icon"></i>, 
      color: '#ffc107' 
    },
    { 
      key: 'attestations', 
      urlList: 'Dashboard/details/certificateDetails', 
      urlBoard: 'Dashboard/details/certificateByState',
      columns: ['Reference', 'Nom fichier', 'Type', 'Mode'], 
      fields: ['reference', 'fileName', 'certificateTypeName', 'stateLetter'],
      title: 'Total attestations générées', 
      value: dashboard.allAttestationNumber, 
      icon: <i className="mdi mdi-file-document stats-icon"></i>, 
      color: '#28a745' 
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = async (card) => {
    setSelectedCard(card);
    setShowModal(true);
    setLoadingDetail(true);
    setCardDetail(null);
    setError(null); // réinitialise les erreurs

    try {
      const requests = [api.get(`/${card.urlList}`)];

      if (card.urlBoard) {
        requests.push(api.get(`/${card.urlBoard}`));
      }

      const [listResponse, boardResponse] = await Promise.all(requests);

      setCardDetail(listResponse.data);
      console.log(listResponse.data);
      if (boardResponse) {
        setBoardDetail(boardResponse.data);
      } else {
        setBoardDetail([]);
      }

    } catch (err) {
      console.error("Erreur lors du chargement des détails :", err);
      setError({ error: "Impossible de charger les détails." });
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
      <Container fluid className="my-4">
        <Row className="g-4">
          {dataSource.map((item, index) => (
            <Col xs={12} sm={6} md={3} key={index} style={{ marginTop: '20px' }}>
              <Card 
                className="summary-card shadow-lg h-100 border-0" 
                onClick={() => handleCardClick(item)} 
                style={{ cursor: 'pointer', borderRadius: '20px' }}
              >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
                  
                  {/* Logo centré en haut */}
                  <div 
                    className="d-flex align-items-center justify-content-center mb-4"
                    style={{
                      backgroundColor: `${item.color}20`,
                      borderRadius: '50%',
                      width: '80px',
                      height: '80px',
                      color: item.color,
                      fontSize: '2rem'
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Titre centré au milieu */}
                  <h5 className="fw-semibold text-secondary mb-4">
                    {item.title}
                  </h5>

                  {/* Chiffre en énorme */}
                  {loading ? (
                    <Skeleton height={80} width={120} className="mx-auto" />
                  ) : (
                    <div 
                      style={{
                        fontWeight: 500,
                        fontSize: '80px',
                        lineHeight: '1',
                        color: item.color
                      }}
                    >
                      {item.value}
                    </div>
                  )}

                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>


      <Dialog
        open={showModal}
        onClose={handleClose}
        keepMounted
        fullWidth={true}
        maxWidth="xl"
      >
        <DialogTitle
          sx={{
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            color: '#343a40',
            letterSpacing: 1,
            borderBottom: '1px solid #dee2e6',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}
        >
          DÉTAIL : {`${selectedCard?.title || ''} - ${selectedCard?.value || ''}`.toUpperCase()}
        </DialogTitle>

        <DialogContent dividers style={{ overflowX: 'auto' }}>
          {loadingDetail ? (
            <Spinner animation="border" />
          ) : cardDetail?.error ? (
            <p className="text-danger">{cardDetail.error}</p>
          ) : (
          <>
            <Row className="g-3">
              {boardDetail.map((item, index) => (
                <Col xs={12} sm={6} md={3} key={index} style={{ marginTop: '10px' }}>
                  <Card className="summary-card shadow-sm" style={{ backgroundColor: `${item.backgroundColor}`,cursor: 'pointer', padding: '0.5rem' }}>
                    <Card.Body className="text-center p-2">
                      <div
                        className="d-flex align-items-center justify-content-center mb-2"
                        style={{ fontSize: '1rem', color: `${item.color}` }}
                      >
                        <span className="fw-semibold text-muted">{item.label}</span>
                      </div>

                      {loading ? (
                        <Skeleton height={20} width={60} className="mx-auto" />
                      ) : (
                        <Card.Text
                          className="fw-bold"
                          style={{ color: `${item.color}`, fontSize: '28px', margin: 0 }}
                        >
                          {item.value}
                        </Card.Text>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>


            <div className="table-responsive">
              <table className="table table-bordered table-skill">
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
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default SummaryCards;
