import React, { useMemo, useState } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './MdiIconPicker.css';

/** Jeu d'icônes MDI courantes pour la personnalisation des modules/pages */
const MDI_ICONS = [
    'view-grid', 'view-dashboard', 'home', 'home-outline',
    'school', 'school-outline', 'book-open-page-variant', 'book-education',
    'clipboard-check', 'clipboard-check-outline', 'clipboard-text', 'clipboard-list',
    'crosshairs-gps', 'map-marker-path', 'map-marker', 'compass',
    'sitemap', 'account-network', 'account-group', 'account-multiple',
    'history', 'clock-outline', 'calendar', 'calendar-check',
    'settings', 'cog', 'tune', 'wrench',
    'certificate', 'seal', 'file-certificate', 'award',
    'shield', 'shield-account', 'shield-lock', 'shield-check',
    'lock', 'key', 'key-variant', 'fingerprint',
    'account', 'account-outline', 'account-circle', 'account-tie',
    'briefcase', 'briefcase-outline', 'office-building', 'domain',
    'chart-bar', 'chart-line', 'chart-pie', 'poll',
    'file-document', 'file-document-outline', 'folder', 'folder-open',
    'star', 'star-outline', 'heart', 'flag',
    'bell', 'email', 'message', 'comment',
    'magnify', 'filter', 'sort', 'drag',
    'plus', 'minus', 'check', 'close',
    'pencil', 'delete', 'content-save', 'upload',
    'download', 'export', 'import', 'sync',
    'eye', 'eye-outline', 'information', 'information-outline',
    'alert', 'alert-circle', 'help-circle', 'lightbulb',
    'rocket', 'target', 'trophy', 'medal',
    'hammer-wrench', 'tools', 'palette', 'brush',
    'database', 'server', 'cloud', 'web',
    'cellphone', 'monitor', 'tablet', 'printer',
    'cash', 'currency-usd', 'wallet', 'bank',
    'car', 'airplane', 'train', 'map',
    'food', 'coffee', 'shopping', 'cart',
    'hospital', 'medical-bag', 'heart-pulse', 'pill',
    'gavel', 'scale-balance', 'handshake', 'account-cash',
];

function toClassName(name) {
    return `mdi mdi-${name}`;
}

/**
 * Sélecteur d'icônes Material Design Icons avec recherche et aperçu.
 * Valeur stockée au format "mdi mdi-xxx".
 */
function MdiIconPicker({ value = '', onChange }) {
    const [query, setQuery] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/^mdi\s+mdi-/, '').replace(/^mdi-/, '');
        if (!q) return MDI_ICONS;
        return MDI_ICONS.filter(name => name.includes(q));
    }, [query]);

    const currentName = (value || '').replace(/^mdi\s+mdi-/, '').replace(/^mdi-/, '').trim();

    return (
        <div className="mdi-icon-picker">
            <div className="mdi-icon-picker-preview">
                <span className="mdi-icon-picker-preview-box">
                    {value ? (
                        <i className={value} style={{ fontSize: '1.35rem' }} />
                    ) : (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                    )}
                </span>
                <div className="mdi-icon-picker-search">
                    <FaSearch className="mdi-icon-picker-search-icon" />
                    <input
                        type="text"
                        className="admin-form-control"
                        placeholder="Rechercher une icône (ex: school, shield…)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="mdi-icon-picker-grid">
                {filtered.map(name => {
                    const cls = toClassName(name);
                    const selected = currentName === name;
                    return (
                        <button
                            key={name}
                            type="button"
                            className={`mdi-icon-picker-item ${selected ? 'selected' : ''}`}
                            title={cls}
                            onClick={() => onChange(cls)}
                        >
                            <i className={cls} />
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="mdi-icon-picker-empty">Aucune icône trouvée pour « {query} »</div>
                )}
            </div>

            <button
                type="button"
                className="mdi-icon-picker-custom-toggle"
                onClick={() => setShowCustom(v => !v)}
            >
                {showCustom ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                Classe personnalisée
            </button>
            {showCustom && (
                <input
                    type="text"
                    className="admin-form-control mt-2"
                    placeholder="ex: mdi mdi-clipboard-check-outline"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            )}
        </div>
    );
}

export default MdiIconPicker;
