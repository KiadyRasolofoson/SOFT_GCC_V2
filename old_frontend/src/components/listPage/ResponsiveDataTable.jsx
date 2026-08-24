import React from 'react';
import ListPagination from './ListPagination';

function SortIndicator({ column, sortColumn, sortDirection }) {
  if (column !== sortColumn) return null;
  return (
    <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  );
}

function ResponsiveDataTable({
  title,
  icon = 'mdi-format-list-bulleted',
  count,
  columns,
  data,
  rowKey,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'Aucun résultat trouvé.',
  mobileTitle,
  mobileSubtitle,
  mobileAvatar,
  pagination,
}) {
  const clickable = Boolean(onRowClick);

  const renderCell = (col, item) => {
    if (col.render) return col.render(item);
    return item[col.key] ?? '—';
  };

  const visibleColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <div className="list-data-card">
      <div className="list-data-card-header">
        <div className="list-data-card-header-left">
          <i className={`mdi ${icon}`}></i>
          <span>{title}</span>
        </div>
        {count != null && <span className="list-data-count">{count} résultat{count !== 1 ? 's' : ''}</span>}
      </div>

      {data.length === 0 ? (
        <div className="list-empty-state">
          <i className="mdi mdi-inbox-outline"></i>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="list-table-desktop">
            <div className="list-table-wrapper">
              <table className="list-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={col.sortable ? 'sortable' : ''}
                        onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                        style={col.headerStyle}
                      >
                        {col.header}
                        {col.sortable && (
                          <SortIndicator
                            column={col.key}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr
                      key={rowKey(item)}
                      className={clickable ? 'clickable' : ''}
                      onClick={clickable ? () => onRowClick(item) : undefined}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={[col.className, col.key === 'actions' ? 'td-actions' : ''].filter(Boolean).join(' ')}
                          style={col.cellStyle}
                        >
                          {renderCell(col, item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="list-mobile-cards">
            {data.map((item) => (
              <div
                key={rowKey(item)}
                className={`list-mobile-card ${clickable ? 'clickable' : ''}`}
                onClick={clickable ? () => onRowClick(item) : undefined}
              >
                {(mobileTitle || mobileSubtitle || mobileAvatar) && (
                  <div className="list-mobile-card-header">
                    {mobileAvatar?.(item)}
                    <div>
                      {mobileTitle && <p className="list-mobile-card-title">{mobileTitle(item)}</p>}
                      {mobileSubtitle && <p className="list-mobile-card-subtitle">{mobileSubtitle(item)}</p>}
                    </div>
                  </div>
                )}
                <div className="list-mobile-card-body">
                  {visibleColumns
                    .filter((col) => col.key !== 'actions' && col.key !== 'photo')
                    .map((col) => (
                      <div key={col.key} className="list-mobile-row">
                        <span className="list-mobile-label">{col.mobileLabel || col.header}</span>
                        <span className="list-mobile-value">{renderCell(col, item)}</span>
                      </div>
                    ))}
                </div>
                {columns.find((c) => c.key === 'actions') && (
                  <div className="list-mobile-card-footer">
                    {renderCell(columns.find((c) => c.key === 'actions'), item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {pagination && data.length > 0 && (
        <ListPagination {...pagination} />
      )}
    </div>
  );
}

export default ResponsiveDataTable;
