import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';

// Composant pour afficher un graphique en barres
function BarChart({ datas, states, labelLetter }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null); // Référence pour l'instance du graphique
  const [legendItems, setLegendItems] = useState([]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    // Si un graphique existe déjà, on le détruit avant d'en créer un nouveau
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Récupération des données et des labels
    const dynamicData = datas.map((entry) => entry.value);
    const labels = datas.map((entry) => entry.label);
    const colors = datas.map((entry) => entry.color);
    const borderColors = datas.map((entry) => entry.borderColor);

    setLegendItems(states.map((entry) => entry));

    // Création du graphique avec Chart.js
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: labelLetter,
            data: dynamicData,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10, // Les valeurs de l'axe des y seront des multiples de 10
              callback: function (value) {
                return value; // Affiche uniquement les multiples de 10
              },
            },
          },
        },
      }
    });

    // Cleanup : détruire l'instance du graphique quand le composant est démonté
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [datas, states]);

  return (
    <div className="row">
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card shadow-sm">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <ul className="list-unstyled d-flex">
                {legendItems.map((item, index) => (
                  <li key={index} style={{ margin: '0 10px', display: 'flex', alignItems: 'center' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ height: '300px', padding: '20px' }}>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarChart;
