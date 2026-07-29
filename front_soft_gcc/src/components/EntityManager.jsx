import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { urlApi } from '../helpers/utils';
import Loader from '../helpers/Loader';

const DEFAULT_PAGE_SIZE = 10;

function SimpleForm({ entity, formData, handleChange, handleSubmit, handleSubmitModified, handleCancel, isEditing, isLoading }) {
  const field = entity.nameField;
  const label = entity.formLabel || 'Désignation';
  return (
    <div className="card entity-form-card">
      <div className="card-header entity-form-header">
        <i className={`mdi mdi-file-document-edit`}></i>
        <span>{isEditing ? 'Modification' : 'Ajout'}</span>
      </div>
      <div className="card-body">
        <form onSubmit={isEditing ? handleSubmitModified : handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor={field} className="entity-form-label">{label}</label>
            <input
              type="text"
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              className="form-control entity-form-input"
              id={field}
              required
              placeholder={`Saisir ${label.toLowerCase()}`}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm px-4" disabled={isLoading}>
              <i className="mdi mdi-check me-1"></i>{isEditing ? 'Modifier' : 'Créer'}
            </button>
            {isEditing && (
              <button type="reset" className="btn btn-outline-secondary btn-sm px-4" onClick={handleCancel}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function EntityManager({ title, icon, entities, basePath }) {
  const [activeKey, setActiveKey] = useState(entities[0]?.key || null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [idItem, setIdItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [tabFilter, setTabFilter] = useState('');

  const currentEntity = entities.find(e => e.key === activeKey) || entities[0];

  const filteredEntities = useMemo(() => {
    if (!tabFilter) return entities;
    const term = tabFilter.toLowerCase();
    return entities.filter(e =>
      e.label.toLowerCase().includes(term) || e.key.toLowerCase().includes(term)
    );
  }, [entities, tabFilter]);

  useEffect(() => {
    if (currentEntity) {
      setFormData(currentEntity.getInitialForm ? currentEntity.getInitialForm() : {});
      setIsEditing(false);
      setIdItem(null);
      setSearchTerm('');
      setCurrentPage(1);
      setError(null);
      fetchData(currentEntity);
    }
  }, [activeKey]);

  useEffect(() => {
    if (filteredEntities.length > 0 && !filteredEntities.find(e => e.key === activeKey)) {
      setActiveKey(filteredEntities[0].key);
    }
  }, [filteredEntities]);

  const fetchData = useCallback(async (entity) => {
    if (!entity) entity = currentEntity;
    setIsLoading(true);
    setError(null);
    try {
      const ep = entity.extraEndpoint?.get || entity.apiEndpoint;
      const response = await axios.get(urlApi(ep));
      setData(response.data || []);
    } catch (err) {
      setError(`Erreur lors du chargement : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (fieldName) => (e) => {
    setFormData(prev => ({ ...prev, [fieldName]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const dataToSend = currentEntity.formatData ? currentEntity.formatData(formData) : formData;
      await axios.post(urlApi(currentEntity.extraEndpoint?.post || currentEntity.apiEndpoint), dataToSend);
      fetchData(currentEntity);
      setFormData(currentEntity.getInitialForm ? currentEntity.getInitialForm() : {});
    } catch (error) {
      setError(`Erreur lors de l'insertion : ${error.response?.data?.errors?.[0]?.code || error.response?.data || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitModified = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const dataToSend = currentEntity.formatData ? currentEntity.formatData(formData, true) : formData;
      await axios.put(urlApi(`${currentEntity.extraEndpoint?.put || currentEntity.apiEndpoint}/${idItem}`), dataToSend);
      fetchData(currentEntity);
      setIsEditing(false);
      setFormData(currentEntity.getInitialForm ? currentEntity.getInitialForm() : {});
    } catch (error) {
      setError(`Erreur lors de la modification : ${error.response?.data?.errors?.[0]?.code || error.response?.data || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(urlApi(`${currentEntity.extraEndpoint?.delete || currentEntity.apiEndpoint}/${itemId}`));
      fetchData(currentEntity);
      if (isEditing) {
        setIsEditing(false);
        setFormData(currentEntity.getInitialForm ? currentEntity.getInitialForm() : {});
      }
    } catch (error) {
      setError(`Erreur lors de la suppression : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (itemId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(urlApi(`${currentEntity.extraEndpoint?.get || currentEntity.apiEndpoint}/${itemId}`));
      setIdItem(itemId);
      setIsEditing(true);
      const form = currentEntity.getFormFromResponse ? currentEntity.getFormFromResponse(response.data) : response.data;
      setFormData(form);
    } catch (err) {
      setError(`Erreur lors de la récupération : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(currentEntity.getInitialForm ? currentEntity.getInitialForm() : {});
    setIdItem(null);
  };

  const defaultSearchFields = [currentEntity.nameField];
  const searchFields = currentEntity.searchFields || defaultSearchFields;
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return searchFields.some(field => {
      const val = item[field];
      return val && val.toString().toLowerCase().includes(term);
    });
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (!currentEntity) return null;

  const columns = currentEntity.columns || [
    { header: '#', render: (item) => item[currentEntity.idField] },
    { header: 'Désignation', render: (item) => item[currentEntity.nameField] },
  ];

  return (
    <div className="entity-manager">
      <div className="entity-header">
        <div className="entity-header-left">
          <div className="entity-header-icon">
            <i className={`${icon || 'mdi mdi-settings'}`}></i>
          </div>
          <div>
            <h1 className="entity-header-title">{title}</h1>
            <p className="entity-header-subtitle">
              <i className="mdi mdi-chevron-right"></i> {currentEntity.label}
            </p>
          </div>
        </div>
      </div>

      <div className="entity-filter-bar">
        <div className="entity-filter-input-wrapper">
          <i className="mdi mdi-magnify entity-filter-icon"></i>
          <input
            type="text"
            className="entity-filter-input"
            placeholder="Filtrer les paramètres..."
            value={tabFilter}
            onChange={(e) => setTabFilter(e.target.value)}
          />
          {tabFilter && (
            <button className="entity-filter-clear" onClick={() => setTabFilter('')}>
              <i className="mdi mdi-close"></i>
            </button>
          )}
        </div>
        <span className="entity-filter-count">{filteredEntities.length} / {entities.length}</span>
      </div>

      <div className="entity-tabs-wrapper">
        <div className="modern-tabs-container">
          {filteredEntities.length === 0 ? (
            <div className="entity-no-tabs">Aucun paramètre trouvé</div>
          ) : (
            filteredEntities.map(entity => (
              <button
                key={entity.key}
                className={`modern-tab ${activeKey === entity.key ? 'active' : ''}`}
                onClick={() => setActiveKey(entity.key)}
              >
                <i className={`${entity.icon} modern-tab-icon`}></i>
                <span className="modern-tab-label">{entity.label}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {isLoading && <Loader />}
      {error && <div className="alert alert-danger entity-error">{error}</div>}

      <div className="row g-4">
        <div className="col-md-5">
          {currentEntity.formComponent ? (
            <currentEntity.formComponent
              entity={currentEntity}
              formData={formData}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              handleSubmit={handleSubmit}
              handleSubmitModified={handleSubmitModified}
              handleCancel={handleCancel}
              isEditing={isEditing}
              isLoading={isLoading}
            />
          ) : (
            <SimpleForm
              entity={currentEntity}
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              handleSubmitModified={handleSubmitModified}
              handleCancel={handleCancel}
              isEditing={isEditing}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className="col-md-7">
          <div className="card entity-list-card">
            <div className="card-header entity-list-header">
              <i className="mdi mdi-format-list-bulleted"></i>
              <span>Liste des enregistrements</span>
              <span className="entity-list-count">{filteredData.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="entity-list-toolbar">
                <div className="d-flex align-items-center gap-2">
                  <span className="entity-label">Afficher</span>
                  <select
                    className="form-select form-select-sm entity-page-size"
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="entity-label">par page</span>
                </div>
                <div className="entity-search-wrapper">
                  <i className="mdi mdi-magnify entity-search-icon"></i>
                  <input
                    type="text"
                    className="form-control form-control-sm entity-search-input"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
              </div>

              <div className="entity-table-wrapper">
                <table className="entity-table">
                  <thead>
                    <tr>
                      {columns.map((col, i) => (
                        <th key={i}>{col.header}</th>
                      ))}
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-4 text-muted">
                          <i className="mdi mdi-inbox fs-3 d-block mb-2"></i>
                          Aucune donnée
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item[currentEntity.idField]}>
                          {columns.map((col, i) => (
                            <td key={i} className={col.className || ''}>{col.render(item)}</td>
                          ))}
                          <td className="td-actions">
                            <button
                              onClick={() => handleEdit(item[currentEntity.idField])}
                              className="btn-action btn-action-edit"
                              title="Modifier"
                            >
                              <i className="mdi mdi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(item[currentEntity.idField])}
                              className="btn-action btn-action-delete"
                              title="Supprimer"
                            >
                              <i className="mdi mdi-delete"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="entity-pagination">
                  <span className="entity-pagination-info">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <div className="d-flex gap-1">
                    <button
                      className={`entity-page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="mdi mdi-chevron-double-left"></i>
                    </button>
                    <button
                      className={`entity-page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="mdi mdi-chevron-left"></i>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`entity-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className={`entity-page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <i className="mdi mdi-chevron-right"></i>
                    </button>
                    <button
                      className={`entity-page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="mdi mdi-chevron-double-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityManager;
