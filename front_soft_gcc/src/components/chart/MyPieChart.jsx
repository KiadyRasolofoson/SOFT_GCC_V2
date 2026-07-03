import React, { useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slide
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

const MyPieChart = ({datas}) => {
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState([]);

  const handleClick = async (datum) => {
    setSelected(datum);
    setOpen(true);

    try {
      const response = await api.get(`/Dashboard/details/employeeAgeDistribution/${encodeURIComponent(datum.label)}`);
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
    setSelected(null);
  };

  return (
    <>
      <Box sx={{ height: 450 }}>
        <ResponsivePie
          data={datas}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={5}
          activeOuterRadiusOffset={10}
          colors={{ scheme: 'set2' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#555"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          onClick={handleClick}
          animate={true}
          motionConfig="wobbly"
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
          DÉTAILS SUR {`${selected?.label}`.toUpperCase()}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1"><strong>Tranche :</strong> {selected?.label}</Typography>
          <Typography variant="subtitle1"><strong>Nombre d'employés :</strong> {selected?.value}</Typography>
          {details.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Matricule</strong></TableCell>
                    <TableCell><strong>Nom</strong></TableCell>
                    <TableCell><strong>Prénom</strong></TableCell>
                    <TableCell align="center"><strong>Âge</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.map((emp) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell>{emp.registrationNumber}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.firstName}</TableCell>
                      <TableCell align="center">{emp.age} ans</TableCell>
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

export default MyPieChart;
