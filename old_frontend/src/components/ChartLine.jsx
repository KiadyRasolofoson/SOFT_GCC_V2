import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";

Chart.register(annotationPlugin);

function ChartLine({ data, year }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Récupérer les valeurs dynamiques et les mois
    const dynamicData = data.map((entry) => entry.DemandRequestValue);
    const months = data.map((entry) => entry.monthLetter);

    // Gradient pour la ligne
    const lineGradient = ctx.createLinearGradient(0, 0, 400, 0);
    lineGradient.addColorStop(0, "rgba(75, 192, 192, 1)");
    lineGradient.addColorStop(1, "rgba(54, 162, 235, 1)");

    // Gradient pour le remplissage
    const fillGradient = ctx.createLinearGradient(0, 0, 0, 300);
    fillGradient.addColorStop(0, "rgba(75, 192, 192, 0.4)");
    fillGradient.addColorStop(1, "rgba(75, 192, 192, 0)");

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: months, // Noms des mois dynamiques
        datasets: [
          {
            label: "Demande par mois",
            data: dynamicData, // Données dynamiques
            backgroundColor: fillGradient, // Zone remplie avec gradient
            borderColor: lineGradient, // Ligne avec gradient
            borderWidth: 3,
            tension: 0.4,
            fill: true, // Activer le remplissage
            pointBackgroundColor: "rgba(54, 162, 235, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(54, 162, 235, 1)",
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: {
                size: 14,
              },
              color: "#333",
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 12,
            },
            callbacks: {
              title: (tooltipItems) => `Mois: ${tooltipItems[0].label}`,
              label: (tooltipItem) => `Demandes: ${tooltipItem.raw}`,
            },
            cornerRadius: 8,
          },
          annotation: {
            annotations: {
              targetLine: {
                type: "line",
                yMin: 10, // Exemple d'objectif
                yMax: 10,
                borderColor: "rgba(255, 99, 132, 0.5)",
                borderWidth: 2,
                label: {
                  content: "Objectif",
                  enabled: true,
                  position: "start",
                  color: "#ff6384",
                  font: {
                    size: 12,
                    weight: "bold",
                  },
                },
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: `${year}`,
              font: {
                size: 16,
                weight: "bold",
              },
              color: "#666",
            },
            ticks: {
              callback: (value, index) => months[index],
              color: "#555",
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Nombre de demandes",
              font: {
                size: 16,
                weight: "bold",
              },
              color: "#666",
            },
            ticks: {
              color: "#555",
              font: {
                size: 12,
              },
            },
            grid: {
              color: "rgba(200, 200, 200, 0.2)",
            },
          },
        },
        animation: {
          duration: 1500,
          easing: "easeOutElastic"
        },
        interaction: {
          mode: "index",
          axis: "x",
          intersect: false,
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return (
      <div className="chart-container" style={{ height: "300px", maxWidth: "100%" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
  );
}

export default ChartLine;
