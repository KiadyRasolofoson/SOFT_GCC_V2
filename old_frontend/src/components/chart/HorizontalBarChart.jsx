import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slide,
} from '@mui/material';
import { Box } from '@mui/system';
import { urlApi } from '../../helpers/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import api from '../../helpers/api';

const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const HorizontalBarChart = ({datas}) => {
  const [selectedBar, setSelectedBar] = useState(null);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState([]);

  const handleBarClick = async (bar) => {
    console.log(bar);
    setSelectedBar(bar.data);
    setOpen(true);

    try {
      const response = await api.get(
        (`/Dashboard/details/employeeExperienceRangeDetails/${encodeURIComponent(bar.data.ageGroup)}`)
      );
      console.log(response);
      if (!response.status === 200) throw new Error('Erreur de chargement');
      const data = await response.data;
      setDetails(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails :', error);
      setDetails([]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBar(null);
  };

  return (
    <>
      <Box sx={{ height: 400 }}>
        <ResponsiveBar
          data={datas}
          keys={['count']}
          indexBy="ageGroup"
          layout="horizontal"
          margin={{ top: 20, right: 100, bottom: 50, left: 80 }}
          padding={0.3}
          colors={{ scheme: 'pastel1' }}
          borderRadius={4}
          enableLabel={true}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
          animate={true}
          motionConfig="gentle"
          onClick={handleBarClick}
          tooltip={({ data }) => (
            <strong style={{ padding: 6 }}>
              {data.ageGroup}: {data.count} employés
            </strong>
          )}
        />
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        keepMounted
        fullWidth
        maxWidth="lg"
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
          DÉTAILS SUR {`${selectedBar?.ageGroup}`.toUpperCase()}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1"><strong>Tranche d'expérience :</strong> {selectedBar?.ageGroup}</Typography>
          <Typography variant="subtitle1"><strong>Nombre :</strong> {selectedBar?.count}</Typography>
          {details.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Matricule</strong></TableCell>
                    <TableCell><strong>Nom</strong></TableCell>
                    <TableCell><strong>Prénom</strong></TableCell>
                    <TableCell align="center"><strong>Expérience</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.map((emp) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell>{emp.registrationNumber}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.firstName}</TableCell>
                      <TableCell align="center">{emp.experience}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Aucun détail disponible.
            </Typography>
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

export default HorizontalBarChart;
