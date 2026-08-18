import React from 'react';

function getPageNumbers(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return Array.from({ length: maxVisible }, (_, i) => i + 1);
  }
  if (currentPage >= totalPages - 2) {
    return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + i + 1);
  }
  return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
}

function ListPagination({ currentPage, totalPages, totalRecords, pageSize, onPageChange }) {
  if (totalPages <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="list-pagination">
      <span className="list-pagination-info">
        {totalRecords > 0
          ? `${start}–${end} sur ${totalRecords} résultat${totalRecords > 1 ? 's' : ''}`
          : 'Aucun résultat'}
      </span>
      <div className="list-pagination-controls">
        <button
          className="list-page-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Première page"
        >
          <i className="mdi mdi-chevron-double-left"></i>
        </button>
        <button
          className="list-page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <i className="mdi mdi-chevron-left"></i>
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`list-page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="list-page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <i className="mdi mdi-chevron-right"></i>
        </button>
        <button
          className="list-page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Dernière page"
        >
          <i className="mdi mdi-chevron-double-right"></i>
        </button>
      </div>
    </div>
  );
}

export default ListPagination;
