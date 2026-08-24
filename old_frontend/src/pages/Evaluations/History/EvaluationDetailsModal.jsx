import { Modal, Button, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import PropTypes from 'prop-types';
import { FaUser, FaCalendarAlt, FaBuilding, FaClipboardList, FaCommentDots, FaLightbulb, FaExclamationTriangle, FaStar, FaTasks, FaUsers, FaInfoCircle } from 'react-icons/fa';
import '../../../assets/css/Evaluations/EvaluationDetailsModal.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Palette de couleurs professionnelle
const MUSTARD_YELLOW = '#D4AC0D';
const TEXT_DARK_PRIMARY = '#212529';
const TEXT_DARK_SECONDARY = '#495057';
const BORDER_COLOR = '#e9ecef';

// Nouvelles couleurs pour les scores et statuts
const SCORE_COLORS = {
  excellent: { bg: '#28a745', text: 'white', lighter: '#d4edda' },
  tresBien: { bg: '#20c997', text: 'white', lighter: '#d2f4ea' },
  satisfaisant: { bg: '#17a2b8', text: 'white', lighter: '#d1ecf1' },
  aAmeliorer: { bg: '#ffc107', text: '#212529', lighter: '#fff3cd' },
  insuffisant: { bg: '#dc3545', text: 'white', lighter: '#f8d7da' },
  na: { bg: '#6c757d', text: 'white', lighter: '#e2e3e5' }
};

const STATUS_COLORS = {
  termine: { bg: '#28a745', text: 'white', border: '#28a745', light: '#d4edda' },
  enCours: { bg: '#17a2b8', text: 'white', border: '#17a2b8', light: '#d1ecf1' },
  planifie: { bg: MUSTARD_YELLOW, text: 'white', border: MUSTARD_YELLOW, light: '#fff3cd' },
  annule: { bg: '#dc3545', text: 'white', border: '#dc3545', light: '#f8d7da' },
  rejete: { bg: '#dc3545', text: 'white', border: '#dc3545', light: '#f8d7da' },
  defaut: { bg: '#6c757d', text: 'white', border: '#6c757d', light: '#e2e3e5' }
};

const EvaluationDetailsModal = ({ evaluation, onClose }) => {
  if (!evaluation) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const getStatusBadge = (status) => {
    if (status === null || typeof status === 'undefined') return (
      <Badge pill className="professional-badge" 
        style={{
          backgroundColor: STATUS_COLORS.defaut.bg,
          color: STATUS_COLORS.defaut.text,
          padding: '0.35rem 0.75rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
        Non défini
      </Badge>
    );

    const statusString = String(status).toLowerCase();
    let statusColor;
    let statusText;

    switch (statusString) {
      case 'completed': case 'terminée': case '30':
        statusColor = STATUS_COLORS.termine;
        statusText = "Terminée"; 
        break;
      case 'in progress': case 'en cours': case '20': case '25':
        statusColor = STATUS_COLORS.enCours;
        statusText = "En cours"; 
        break;
      case 'pending': case 'planifiée': case '10':
        statusColor = STATUS_COLORS.planifie;
        statusText = "Planifiée"; 
        break;
      case 'cancelled': case 'annulée': case '50':
        statusColor = STATUS_COLORS.annule;
        statusText = "Annulée"; 
        break;
      case 'rejected': case 'rejeté': case '40':
        statusColor = STATUS_COLORS.rejete;
        statusText = "Rejetée"; 
        break;
      default:
        statusColor = STATUS_COLORS.defaut;
        statusText = renderWithDefault(statusString, "Inconnu"); 
        break;
    }

    return (
      <Badge pill className="professional-badge" 
        style={{
          backgroundColor: statusColor.bg,
          color: statusColor.text,
          padding: '0.35rem 0.75rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
        {statusText}
      </Badge>
    );
  };

  const getScoreColor = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return SCORE_COLORS.na;
    if (numericScore >= 4.5) return SCORE_COLORS.excellent;
    if (numericScore >= 4) return SCORE_COLORS.tresBien;
    if (numericScore >= 3) return SCORE_COLORS.satisfaisant;
    if (numericScore >= 2) return SCORE_COLORS.aAmeliorer;
    return SCORE_COLORS.insuffisant;
  };

  const getScoreText = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return "N/A";
    if (numericScore < 2) return "Insuffisant";
    if (numericScore < 3) return "À améliorer";
    if (numericScore < 4) return "Satisfaisant";
    if (numericScore < 4.5) return "Très bien";
    return "Excellent";
  };

  const renderWithDefault = (text, defaultMessage = "Non spécifié") => {
    const sText = String(text);
    return text && sText.trim() !== "" && sText.toLowerCase() !== 'null' ? sText : defaultMessage;
  };

  const extractQuestionDetails = () => {
    if (!evaluation || !evaluation.questionDetails) return [];
    if (Array.isArray(evaluation.questionDetails)) return evaluation.questionDetails;
    if (typeof evaluation.questionDetails === 'string') {
      try {
        return evaluation.questionDetails.split(';')
          .filter(q => q.trim().length > 0)
          .map(q => {
            const scorePart = q.match(/Score:(\d+(\.\d+)?)/);
            const questionText = q.match(/Question:(.*?),/)?.[1]?.trim() || "Question sans titre";
            return {
              question: questionText,
              score: scorePart ? parseFloat(scorePart[1]) : null
            };
          });
      } catch (e) {
        console.error("Erreur parsing QuestionDetails:", e);
        return [];
      }
    }
    return [];
  };
  const questionDetails = extractQuestionDetails();

  const cardHeaderStyle = {
    backgroundColor: '#ffffff',
    borderBottom: `2px solid ${MUSTARD_YELLOW}`,
    color: TEXT_DARK_PRIMARY,
    fontWeight: '600',
    padding: '0.75rem 1.25rem',
    fontSize: '0.95rem'
  };

  const cardStyle = {
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '1.25rem',
    backgroundColor: 'white'
  };

  const scoreColor = getScoreColor(evaluation.overallScore);

  return (
    <Modal 
      show={true}
      onHide={onClose} 
      dialogClassName="evaluation-details-modal professional-modal modal-lg"
      aria-labelledby="evaluation-details-title"
      centered
      backdrop="static"
      scrollable
    >
      <Modal.Header closeButton style={{borderBottom: `1px solid ${BORDER_COLOR}`, padding: '1rem 1.25rem', backgroundColor: 'white'}}>
        <Modal.Title id="evaluation-details-title" style={{color: MUSTARD_YELLOW, fontWeight: 'bold', fontSize: '1.3rem'}}>
          <FaClipboardList className="me-2" style={{fontSize: '1.2em'}}/> Détails de l&apos;Évaluation
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{backgroundColor: 'white', padding: '1.25rem'}}>
        {/* Employee Info + Overall Score */}
        <div className="mb-4 p-3 rounded-3" style={{ 
          backgroundColor: 'white', 
          border: `1px solid ${BORDER_COLOR}`, 
          borderLeft: `4px solid ${MUSTARD_YELLOW}` 
        }}>
          <Row className="align-items-center">
            <Col md={3} className="text-center mb-3 mb-md-0">
              <div className="score-circle-professional mx-auto" style={{
                background: scoreColor.lighter,
                borderColor: scoreColor.bg,
                borderWidth: '3px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <span style={{color: scoreColor.bg, fontWeight: 'bold', fontSize: '1.8rem'}}>
                  {evaluation.overallScore ? parseFloat(evaluation.overallScore).toFixed(1) : '--'}
                </span>
              </div>
              <div className="score-label-professional mt-2 fw-bold" style={{
                color: scoreColor.bg,
                fontSize: '1rem'
              }}>
                {getScoreText(evaluation.overallScore)}
              </div>
            </Col>
            <Col md={9}>
              <h3 className="mb-2" style={{color: TEXT_DARK_PRIMARY, fontWeight: '600'}}>{renderWithDefault(evaluation.firstName)} {renderWithDefault(evaluation.lastName)}</h3>
              <p className="mb-1 professional-text-item" style={{color: TEXT_DARK_SECONDARY}}>
                <FaBuilding className="me-2" style={{color: MUSTARD_YELLOW}} /> {renderWithDefault(evaluation.position)}
              </p>
              <p className="mb-1 professional-text-item" style={{color: TEXT_DARK_SECONDARY}}>
                <FaBuilding className="me-2" style={{color: MUSTARD_YELLOW}} /> {renderWithDefault(evaluation.department)} 
              </p>
              <p className="mb-0 professional-text-item" style={{color: TEXT_DARK_SECONDARY}}>
                <FaCalendarAlt className="me-2" style={{color: MUSTARD_YELLOW}} /> 
                Période: {formatDate(evaluation.startDate)} - {formatDate(evaluation.endDate)}
              </p>
            </Col>
          </Row>
        </div>

        {/* General Info & Interview Details Card */}
        <Card style={cardStyle}>
          <Card.Header style={cardHeaderStyle}>
            <FaInfoCircle className="me-2" style={{color: MUSTARD_YELLOW}} /> Informations Générales
          </Card.Header>
          <Card.Body className="professional-card-body">
            <Row>
              <Col md={4} className="mb-2 mb-md-0">
                <p className="mb-1 professional-text-item"><strong>Type d&apos;évaluation:</strong></p>
                <p className="mb-0">{renderWithDefault(evaluation.evaluationType)}</p>
              </Col>
              <Col md={4} className="mb-2 mb-md-0">
                <p className="mb-1 professional-text-item"><strong>Date de l&apos;entretien:</strong></p>
                <p className="mb-0">{formatDate(evaluation.interviewDate)}</p>
              </Col>
              <Col md={4}>
                <p className="mb-1 professional-text-item"><strong>Statut:</strong></p>
                <p className="mb-0">{getStatusBadge(evaluation.interviewStatus)}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Participants Card */}
        {evaluation.participants && evaluation.participants.length > 0 && (
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <FaUsers className="me-2" style={{color: MUSTARD_YELLOW}} /> Participants
            </Card.Header>
            <ListGroup variant="flush">
              {evaluation.participants.map((participant, index) => (
                <ListGroup.Item key={index} className="d-flex align-items-center py-2 professional-list-item" style={{border: 'none', borderBottom: index < evaluation.participants.length - 1 ? `1px solid ${BORDER_COLOR}` : 'none'}}>
                  <FaUser className="me-2" style={{color: MUSTARD_YELLOW}} /> {renderWithDefault(participant)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        )}

        <Row>
          {/* Points forts */}
          <Col md={6} className="mb-3 mb-md-0">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <FaLightbulb className="me-2" style={{color: MUSTARD_YELLOW}} /> Points Forts
              </Card.Header>
              <Card.Body className="professional-card-body">
                <p className="mb-0 professional-text-item">{renderWithDefault(evaluation.strengths)}</p>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Points à améliorer */}
          <Col md={6}>
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <FaExclamationTriangle className="me-2" style={{color: MUSTARD_YELLOW}} /> Points à Améliorer
              </Card.Header>
              <Card.Body className="professional-card-body">
                <p className="mb-0 professional-text-item">{renderWithDefault(evaluation.weaknesses)}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Commentaires et recommandations */}
        <Row className="mt-3">
          <Col md={6} className="mb-3 mb-md-0">
            {renderWithDefault(evaluation.evaluationComments, '') !== 'Non spécifié' && (
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  <FaCommentDots className="me-2" style={{color: MUSTARD_YELLOW}} /> Commentaires Généraux
                </Card.Header>
                <Card.Body className="professional-card-body">
                  <p className="mb-0 professional-text-item">{renderWithDefault(evaluation.evaluationComments)}</p>
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col md={6}>
            {renderWithDefault(evaluation.recommendations, '') !== 'Non spécifié' && (
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  <FaStar className="me-2" style={{color: MUSTARD_YELLOW}}/> Recommandations
                </Card.Header>
                <Card.Body className="professional-card-body">
                  <p className="mb-0 professional-text-item">{renderWithDefault(evaluation.recommendations)}</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Question Details Card */}
        {questionDetails.length > 0 && (
          <Card style={{...cardStyle, marginTop: '1.25rem'}}>
            <Card.Header style={cardHeaderStyle}>
              <FaTasks className="me-2" style={{color: MUSTARD_YELLOW}} /> Questions Détaillées
            </Card.Header>
            <ListGroup variant="flush">
              {questionDetails.map((item, index) => {
                const questionScoreColor = item.score !== null && typeof item.score !== 'undefined' 
                  ? getScoreColor(item.score).bg 
                  : '#6c757d';
                  
                return (
                  <ListGroup.Item 
                    key={index} 
                    className="d-flex justify-content-between align-items-center py-3 professional-list-item" 
                    style={{
                      border: 'none', 
                      borderBottom: index < questionDetails.length - 1 ? `1px solid ${BORDER_COLOR}` : 'none'
                    }}
                  >
                    <span className="flex-grow-1 me-3 professional-text-item">{renderWithDefault(item.question)}</span>
                    {item.score !== null && typeof item.score !== 'undefined' ? (
                      <Badge pill 
                             style={{
                               backgroundColor: questionScoreColor,
                               color: 'white',
                               fontSize: '0.9rem',
                               fontWeight: '500',
                               padding: '0.35rem 0.75rem',
                               boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                             }} 
                             className="professional-score-badge">
                        {parseFloat(item.score).toFixed(1)} / 5
                      </Badge>
                    ) : (
                      <Badge pill bg="secondary" className="px-3 py-2 professional-badge">N/A</Badge>
                    )}
                  </ListGroup.Item>
                )}
              )}
            </ListGroup>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer style={{borderTop: `1px solid ${BORDER_COLOR}`, padding: '0.75rem 1.25rem', backgroundColor: 'white'}}>
        <Button variant="outline-secondary" className="professional-button rounded-pill px-4" style={{borderColor: MUSTARD_YELLOW, color: MUSTARD_YELLOW}} onClick={onClose}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

EvaluationDetailsModal.propTypes = {
  evaluation: PropTypes.object, 
  onClose: PropTypes.func.isRequired
};

EvaluationDetailsModal.defaultProps = {
  evaluation: null,
};

export default EvaluationDetailsModal;