// SearchForm.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Formulaire de recherche
function SearchForm({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="form-sample">
      <div className="form-group row">
        <div className="col-sm-8">
          <input
            type="text"
            className="form-control"
            placeholder="Nom, prénom ou matricule"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-sm-4">
          <button type="submit" className="btn btn-primary">
            Rechercher
          </button>
        </div>
      </div>
    </form>
  );
}

SearchForm.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default SearchForm;
