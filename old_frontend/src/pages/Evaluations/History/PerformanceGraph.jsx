import { ResponsiveLine } from '@nivo/line';
import PropTypes from 'prop-types';
import '../../../assets/css/Evaluations/EvaluationHistory.css';

const PerformanceGraph = ({ performanceData }) => {
  console.log("PerformanceGraph reçoit les données:", performanceData);
  
  // Vérification des données
  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="alert alert-info">
        <h5>Évolution des performances</h5>
        <p>Aucune donnée de performance disponible pour afficher le graphique.</p>
        <p>Assurez-vous que des évaluations ont été complétées et rechargez la page.</p>
      </div>
    );
  }

  // Traitement des données pour le graphique Nivo
  const chartData = [
    {
      id: "Performance",
      data: performanceData.map((item) => ({
        x: item.date || "N/A",
        y: item.score || 0
      }))
    }
  ];

  // Calcul des valeurs min et max pour le graphique
  const allScores = performanceData.map(item => item.score).filter(score => score !== null && score !== undefined);
  const minScore = Math.max(0, Math.floor(Math.min(...allScores) - 0.5));
  const maxScore = Math.min(5, Math.ceil(Math.max(...allScores) + 0.5));

  // Thème personnalisé avec la couleur jaune moutarde
  const theme = {
    background: 'transparent',
    textColor: '#333333',
    fontSize: 12,
    axis: {
      domain: { line: { stroke: '#777777', strokeWidth: 1 } },
      ticks: {
        line: { stroke: '#777777', strokeWidth: 1 },
        text: { fontSize: 12, fill: '#333333' }
      },
      legend: {
        text: {
          fontSize: 12,
          fill: '#333333',
          fontWeight: 'bold'
        }
      }
    },
    grid: { line: { stroke: '#dddddd', strokeWidth: 1 } },
    tooltip: {
      container: {
        background: 'white',
        color: '#333',
        fontSize: 12,
        borderRadius: 3,
        boxShadow: '0 3px 9px rgba(0, 0, 0, 0.15)'
      }
    }
  };

  return (
    <div className="performance-graph-container">
      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{ 
            type: 'linear', 
            min: minScore,
            max: maxScore,
            stacked: false
          }}
          curve="monotoneX"
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Période',
            legendOffset: 40,
            legendPosition: 'middle',
            truncateTickAt: 0
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Score',
            legendOffset: -40,
            legendPosition: 'middle',
            truncateTickAt: 0
          }}
          enableGridX={false}
          colors={['#D4AC0D']} // Couleur jaune moutarde
          lineWidth={3}
          pointSize={10}
          pointColor={'#ffffff'}
          pointBorderWidth={2}
          pointBorderColor={'#D4AC0D'}
          pointLabelYOffset={-12}
          enableArea={true}
          areaOpacity={0.15}
          areaBaselineValue={minScore}
          crosshairType="cross"
          useMesh={true}
          animate={true}
          motionConfig="stiff"
          enableSlices="x"
          sliceTooltip={({ slice }) => {
            return (
              <div
                style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>
                  {slice.points[0].data.x}
                </div>
                {slice.points.map(point => (
                  <div
                    key={point.id}
                    style={{
                      padding: '3px 0'
                    }}
                  >
                    <strong style={{
                      color: '#D4AC0D',
                      display: 'inline-block',
                      marginRight: '8px'
                    }}>
                      Score:
                    </strong>
                    {point.data.y.toFixed(2)}
                  </div>
                ))}
              </div>
            );
          }}
          defs={[
            {
              id: 'gradientC',
              type: 'linearGradient',
              colors: [
                { offset: 0, color: '#D4AC0D', opacity: 0.5 },
                { offset: 100, color: '#D4AC0D', opacity: 0 },
              ],
            }
          ]}
          fill={[
            { match: '*', id: 'gradientC' }
          ]}
          theme={theme}
        />
      </div>
    </div>
  );
};

PerformanceGraph.propTypes = {
  performanceData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      score: PropTypes.number
    })
  )
};

export default PerformanceGraph;
