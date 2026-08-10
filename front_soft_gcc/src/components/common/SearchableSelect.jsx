import Select from 'react-select';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderColor: state.isFocused ? '#4B49AC' : '#e9ecef',
    borderRadius: 6,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(75, 73, 172, 0.08)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#4B49AC' : '#ced4da',
    },
    fontSize: '0.875rem',
    backgroundColor: '#fff',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? '#4B49AC'
      : state.isFocused
        ? 'rgba(75, 73, 172, 0.08)'
        : '#fff',
    color: state.isSelected ? '#fff' : '#2b2d42',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 6,
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    zIndex: 20,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#6c757d',
    fontSize: '0.875rem',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#2b2d42',
    fontSize: '0.875rem',
  }),
  input: (base) => ({
    ...base,
    color: '#2b2d42',
    fontSize: '0.875rem',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

/**
 * Searchable select wrapper around react-select.
 * @param {{ value: string|number, label: string }[]} options
 * @param {string|number|null|undefined} value — selected option value
 * @param {(option: { value: string|number, label: string }|null) => void} onChange
 */
function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Rechercher…',
  isClearable = true,
  isDisabled = false,
  noOptionsMessage = () => 'Aucun résultat',
  className = '',
  name,
  inputId,
}) {
  const selectedOption =
    value !== undefined && value !== null && value !== ''
      ? options.find((opt) => String(opt.value) === String(value)) || null
      : null;

  return (
    <Select
      name={name}
      inputId={inputId}
      className={className}
      classNamePrefix="searchable-select"
      options={options}
      value={selectedOption}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      noOptionsMessage={noOptionsMessage}
      styles={selectStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
}

export default SearchableSelect;
