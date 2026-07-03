import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from "react-paginate";
import "./history.css"; // Import du style personnalisé
import Template from "../Template";
import PageHeader from "../../components/PageHeader";
import axios from 'axios';
import { urlApi } from '../../helpers/utils';
import Loader from '../../helpers/Loader';
import DateDisplayWithTime from '../../helpers/DateDisplayWithTime';
import '../../styles/skillsStyle.css';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';

const HistoryPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const module = "Historiques";
  const action = "Liste";
  const url = "/Historiques";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(urlApi("/activityLog")); // Vérifiez l'URL exacte.
      setActivityLogs(response.data);
    } catch (err) {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const offset = currentPage * itemsPerPage;
  const currentItems = activityLogs.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(activityLogs.length / itemsPerPage);

  return (
    <Template>
      {loading && <Loader />}
      <div className="title-container">
        <div className="col-lg-10 skill-header">
          <i className="mdi mdi-history skill-icon"></i>
          <p className="skill-title">HISTORIQUES DES ACTIONS</p>
        </div>
      </div>
      <BreadcrumbPers
        items={[
          { label: 'Accueil', path: '/softGcc/tableauBord' },
          { label: 'Historiques actions', path: '/softGcc/activityHistory' },
          { label: 'Liste', path: '/softGcc/activityHistory' }
        ]}
      />
      {error && <div className="error-message">{error}</div>}

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card shadow-sm rounded-lg">
            <div className="card-header d-flex align-items-center" style={{color: '#B8860B'}}>
              <i className="mdi mdi-format-list-bulleted me-2 fs-4" style={{fontSize: '30px', marginRight: '10px'}}></i>
              <h3 className="mb-0" style={{color: '#B8860B'}}> Liste des Historiques </h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                {activityLogs.length > 0 ? (
                  <>
                    <table className="table table-hover table-bordered">
                      <thead className="bg-primary text-white">
                        <tr>
                          <th>#</th>
                          <th>Description</th>
                          <th>Date et Heure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((activity, index) => (
                          <tr key={activity.id}>
                            <td className="text-center">{offset + index + 1}</td>
                            <td>
                              <span className="font-medium">{activity.description}</span>
                            </td>
                            <td className="text-gray-500"><DateDisplayWithTime isoDate={activity.timestamp} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ReactPaginate
                      previousLabel={"← Précédent"}
                      nextLabel={"Suivant →"}
                      pageCount={pageCount}
                      onPageChange={handlePageClick}
                      containerClassName={"pagination justify-content-center mt-4"}
                      previousLinkClassName={"btn btn-outline-primary"}
                      nextLinkClassName={"btn btn-outline-primary"}
                      disabledClassName={"btn-disabled"}
                      activeClassName={"active"}
                      pageLinkClassName={"page-link"}
                    />
                  </>
                ) : (
                  !loading && <div className="alert alert-warning">Aucun historique disponible.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
};

export default HistoryPage;
