import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../helpers/api';
import { toast } from 'react-toastify';
import { 
  Card, TextField, Button, Typography, Box, CircularProgress, 
  Alert, Paper, Container, Grid, Divider, FormHelperText 
} from '@mui/material';
import { 
  FaLock, FaUser, FaClock, FaExclamationTriangle, 
  FaSignInAlt, FaSpinner, FaCalendarAlt 
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const EvaluationLogin = () => {
  const [tempLogin, setTempLogin] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem('evaluationToken');
    const evaluationId = localStorage.getItem('evaluationId');
    
    if (token && evaluationId) {
      // Vérifier si le token est toujours valide
      api.get(`/evaluation/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        if (response.data.valid) {
          navigate('/employee-evaluation');
        } else {
          // Token expiré, supprimer du localStorage
          localStorage.removeItem('evaluationToken');
          localStorage.removeItem('evaluationId');
        }
      })
      .catch(err => {
        localStorage.removeItem('evaluationToken');
        localStorage.removeItem('evaluationId');
        console.error('Token validation error:', err);
      });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Récupérer l'adresse IP pour le suivi de sécurité
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      const ipAddress = ipResponse.data.ip;

      const response = await api.post('/EvaluationLogin/login', {
        tempLogin,
        tempPassword,
        ipAddress
      });

      if (response.data.success) {
        // Stocker le token et l'ID d'évaluation
        localStorage.setItem('evaluationToken', response.data.token);
        localStorage.setItem('evaluationId', response.data.evaluationId);
        
        toast.success('Connexion réussie! Redirection vers votre évaluation...');
        navigate('/employee-evaluation');
      } 
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        // Gestion des différents types d'erreurs
        switch (err.response.status) {
          case 401:
            setError('Identifiants invalides. Veuillez vérifier votre login et mot de passe.');
            break;
          case 403:
            setError(err.response.data.message || 'Votre évaluation n\'est pas encore disponible.');
            setShowExpirationWarning(true);
            break;
          case 404:
            setError('Évaluation non trouvée. Veuillez contacter votre administrateur.');
            break;
          default:
            setError('Une erreur est survenue lors de la connexion.');
        }
      } else {
        setError('Problème de connexion au serveur. Ve uillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ padding: '20px', borderRadius: '8px' }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <FaLock size={40} color="#1976d2" />
            <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
              Connexion à l'évaluation
            </Typography>
            <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '16px' }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Login temporaire"
                value={tempLogin}
                onChange={(e) => setTempLogin(e.target.value)}
                InputProps={{
                  startAdornment: <FaUser style={{ marginRight: '8px' }} />
                }}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Mot de passe temporaire"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                InputProps={{
                  startAdornment: <FaLock style={{ marginRight: '8px' }} />
                }}
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {showExpirationWarning && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <FaExclamationTriangle style={{ marginRight: '8px' }} />
                  Attention : Votre évaluation pourrait être expirée ou non disponible.
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? <FaSpinner className="spinner" /> : 'Se connecter'}
              </Button>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EvaluationLogin;
