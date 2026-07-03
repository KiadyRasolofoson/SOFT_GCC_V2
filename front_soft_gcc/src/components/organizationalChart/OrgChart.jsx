import React, { useState } from 'react';
import '../../styles/orgChart.css';

const Node = ({ data }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div 
            className="node" 
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
        >
            <img
                src={`https://ui-avatars.com/api/?name=${data.firstName}`}
                alt={`${data.firstName}`}
                className="avatar"
            />
            <div className="node-name">{data.firstName}</div>
            {showDetails && (
                <div className="node-details">
                    <p>Civilite: {data.civilite || 'Not Specified'}</p>
                    <p>Departement: {data.department || 'Inconnu'}</p>
                    <p>Poste: {data.position || 'Inconnu'}</p>
                </div>
            )}
            {data.children && (
                <div className="children">
                    {data.children.map((child, index) => (
                        <Node key={index} data={child} />
                    ))}
                </div>
            )}
        </div>
    );
};


const OrgChart = ({ data }) => {
    return (
        <div className="org-chart">
            <div className="org-chart-container">
                <Node data={data} />
            </div>
        </div>
    );
};

export default OrgChart;
