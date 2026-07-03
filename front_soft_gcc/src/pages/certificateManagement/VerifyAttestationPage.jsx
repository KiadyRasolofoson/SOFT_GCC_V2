import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import Icon from '@mdi/react';
import {
  mdiDomain,
  mdiAccount,
  mdiBriefcase,
  mdiCalendarStart,
  mdiCalendarEnd,
  mdiFileDocumentOutline,
  mdiCheckCircleOutline,
  mdiAlertCircleOutline
} from '@mdi/js';
import './AttestationHistory.css';
import FormattedDate from '../../helpers/FormattedDate';

const VerifyAttestationPage = () => {
  const { Token } = useParams();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(urlApi(`/CareerPlan/verify/${Token}`));
        if (!response.data.valid) {
          setError("Attestation invalide");
          throw new Error("Attestation invalide");
        }
        setData(response.data);
      } catch (error) {
        setError(error.message || "Erreur lors de la vérification");
      } finally {
        setLoading(false);
      }
    };
    if (Token) fetchData();
  }, [Token]);

  if (loading)
    return <div className="loader">Chargement...</div>;

  if (error)
    return (
      <div className="verify-container error">
        <Icon path={mdiAlertCircleOutline} size={1.5} color="red" />
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );

  if (!data)
    return <div className="verify-container">Données non disponibles</div>;

  return (
    <div className="verify-container">
      <div className="card">
        {/* Logo statique de la société */}
       <img className="logo-top-left" src="/Logo/softwellogo.png" alt="Logo société" />


        {/* Titre centré uniquement */}
        <h2 className="title">
          <Icon path={mdiCheckCircleOutline} size={1.2} color="green" />
          ATTESTATION VÉRIFIÉE
        </h2>

        <div className="info-group">
          <p><Icon path={mdiDomain} size="1em" /> <span className='label'>Société :</span> {data.society}</p>
          <p><Icon path={mdiFileDocumentOutline} size="1em" /> <span className='label'>Référence :</span> {data.reference}</p>
          <p><Icon path={mdiCalendarEnd} size="1em" /> <span className='label'>Delivré le : </span><FormattedDate date={data.createdAt} /></p>
          <p><Icon path={mdiAccount} size="1em" /> <span className='label'>Nom :</span> {data.employee.fullName}</p>
          <p><Icon path={mdiBriefcase} size="1em" /> <span className='label'>Poste :</span> {data.employee.position}</p>
          <p><Icon path={mdiCalendarStart} size="1em" /> <span className='label'>Du :</span> {new Date(data.employee.startDate).toLocaleDateString()}</p>
          <p><Icon path={mdiCalendarEnd} size="1em" /> 
            <span className='label'>Au :
            </span>  
              {data.employee.endDate 
                ? new Date(data.employee.endDate).toLocaleDateString() 
                : "Aujourd’hui"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyAttestationPage;
