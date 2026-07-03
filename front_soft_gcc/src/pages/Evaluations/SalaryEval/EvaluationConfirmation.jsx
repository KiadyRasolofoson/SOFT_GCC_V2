import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimes,
  FaHandshake,
  FaLock
} from 'react-icons/fa';

const EvaluationConfirmation = () => {
  const navigate = useNavigate();
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a accès à cette page
    const token = localStorage.getItem('evaluationToken');
    if (!token) {
      navigate('/EvaluationLogin');
      return;
    }

    // Invalider le token et nettoyer le localStorage car l'évaluation est terminée
    localStorage.removeItem('evaluationToken');
    localStorage.removeItem('evaluationId');
  }, [navigate]);

  const handleCloseApplication = () => {
    // Montrer la modale de confirmation au lieu d'une alerte
    setShowCloseDialog(true);
  };

  const confirmCloseApplication = () => {
    // Fermer la fenêtre après confirmation
    window.close();
    
    // Si la fenêtre ne se ferme pas (ce qui peut arriver dans certains navigateurs),
    // rediriger vers une page d'accueil par défaut
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 300);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#ffffff'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <FaCheckCircle
                size={80}
                color="#4CAF50"
                style={{ marginBottom: '1rem' }}
              />
            </motion.div>

            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: '#2c3e50', fontWeight: 'bold' }}
            >
              Évaluation Soumise avec Succès !
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: '#7f8c8d', mb: 3 }}
            >
              Nous vous remercions d&apos;avoir participé à cette évaluation. Vos réponses ont été enregistrées avec succès.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <FaLock color="#f44336" size={20} style={{ marginRight: '10px' }} />
              <Typography variant="body2" sx={{ color: '#f44336' }}>
                Votre session d&apos;évaluation est maintenant terminée
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 3 }}>
              Pour des raisons de sécurité, votre accès temporaire a été révoqué. Si vous souhaitez consulter vos évaluations ultérieurement, veuillez contacter votre responsable RH.
            </Typography>

            <Box 
              sx={{ 
                mt: 4,
                p: 2,
                bgcolor: '#f8f9fa',
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <FaHandshake color="#1976d2" size={20} style={{ marginRight: '10px' }} />
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Que se passe-t-il maintenant ?
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Votre évaluation sera examinée par votre responsable. Vous serez informé(e) des résultats lors de votre prochain entretien.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                startIcon={<FaTimes />}
                onClick={handleCloseApplication}
                fullWidth
                sx={{ mt: 2 }}
              >
                Fermer cette application
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Box>
      
      {/* Dialogue de confirmation pour fermer l'application */}
      <Dialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        aria-labelledby="close-dialog-title"
        aria-describedby="close-dialog-description"
      >
        <DialogTitle id="close-dialog-title">
          {"Fermeture de l'application"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="close-dialog-description">
            Merci pour votre participation. Vous pouvez maintenant fermer cette fenêtre en toute sécurité.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCloseDialog(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmCloseApplication} color="primary" autoFocus>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EvaluationConfirmation; 