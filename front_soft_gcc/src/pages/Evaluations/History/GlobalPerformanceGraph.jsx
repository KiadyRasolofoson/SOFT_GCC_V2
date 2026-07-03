import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList
} from 'recharts';
import api from '../../../helpers/api';
import { FaChartBar, FaChartLine, FaTachometerAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import '../../../assets/css/Evaluations/GlobalPerformance.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`Année: ${label}`}</p>
        <p className="tooltip-value">
          <span className="tooltip-label">Score moyen:</span>
          <span className="tooltip-score">{payload[0].value.toFixed(2)}</span>
        </p>
        {payload[0].payload.evaluationCount && (
          <p className="tooltip-count">
            <span className="tooltip-label">Nombre d&apos;évaluations:</span>
            <span>{payload[0].payload.evaluationCount}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const GlobalPerformanceGraph = ({ filters = {}, globalStats = null }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({
    participationRate: 0,
    approvalRate: 0,
    overallAverage: 0,
    totalEvaluations: 0
  });

  // Fonction pour récupérer les données de performance globale
  const fetchGlobalPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/EvaluationHistory/global-performance', {
        params: {
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          department: filters.department || null,
          evaluationType: filters.evaluationType || null
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Trier les données par année
        const sortedData = [...response.data].sort((a, b) => parseInt(a.year) - parseInt(b.year));
        setChartData(sortedData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données de performance:", err);
      setError("Impossible de charger les données de performance. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fonction pour récupérer les KPIs
  const fetchKPIs = useCallback(async () => {
    // Si nous avons des statistiques globales passées en prop, les utiliser
    if (globalStats) {
      setKpis({
        participationRate: globalStats.participationRate || 0,
        approvalRate: globalStats.approvalRate || 0,
        overallAverage: globalStats.averageScore || 0,
        totalEvaluations: globalStats.totalEvaluationsCount || 0
      });
      return;
    }
    
    // Sinon, faire l'appel API comme avant
    try {
      const response = await api.get('/EvaluationHistory/kpis', {
        params: {
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          department: filters.department || null,
          evaluationType: filters.evaluationType || null
        }
      });
      
      if (response.data) {
        setKpis({
          participationRate: response.data.participationRate || 0,
          approvalRate: response.data.approvalRate || 0,
          overallAverage: response.data.averageScore || 0,
          totalEvaluations: response.data.totalEvaluations || 0
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des KPIs:", err);
      // Ne pas afficher d'erreur pour les KPIs, juste garder les valeurs par défaut
    }
  }, [filters, globalStats]);

  // Effet pour charger les données lorsque les filtres changent
  useEffect(() => {
    fetchGlobalPerformanceData();
    fetchKPIs();
  }, [fetchGlobalPerformanceData, fetchKPIs]);

  // Calculer le score moyen global de manière sécurisée
  const calculateAverageScore = () => {
    // Si nous avons des statistiques globales, utiliser la valeur directement
    if (globalStats && globalStats.averageScore !== undefined) {
      return globalStats.averageScore.toFixed(2);
    }
    
    // Sinon, calculer à partir des données du graphique
    if (!chartData.length) return 0;
    
    const totalScore = chartData.reduce((sum, item) => sum + (item.averageScore || 0), 0);
    const average = totalScore / chartData.length;
    
    return average.toFixed(2);
  };

  // Calculer le total des évaluations
  const calculateTotalEvaluations = () => {
    // Si nous avons des statistiques globales, utiliser la valeur directement
    if (globalStats && globalStats.totalEvaluationsCount !== undefined) {
      return globalStats.totalEvaluationsCount;
    }
    
    // Sinon, calculer à partir des données du graphique
    if (!chartData.length) return 0;
    return chartData.reduce((sum, item) => sum + (parseInt(item.evaluationCount) || 0), 0);
  };

  // Trouver la meilleure année de manière sécurisée
  const getBestYear = () => {
    if (!chartData.length) return 'N/A';
    
    return chartData.reduce((best, item) => 
      (item.averageScore || 0) > (best.averageScore || 0) ? item : best, chartData[0]).year;
  };

  // Déterminer la tendance de manière sécurisée
  const getTrend = () => {
    if (chartData.length <= 1) return { text: 'N/A', isPositive: false };
    
    const firstScore = chartData[0].averageScore || 0;
    const lastScore = chartData[chartData.length - 1].averageScore || 0;
    const isPositive = lastScore > firstScore;
    
    return {
      text: isPositive ? '↑ En hausse' : '↓ En baisse',
      isPositive
    };
  };

  return (
    <div className="global-performance-graph">
      <div className="graph-header d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0"><FaChartBar className="me-2" /> Performance Globale</h5>
      </div>

      {/* Section KPIs */}
      <div className="kpi-section mb-4">
        <div className="kpi-header">
          <h6><FaTachometerAlt className="me-2" /> Indicateurs de performance clés</h6>
        </div>
        <div className="kpi-cards">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="kpi-card participation">
                <div className="kpi-icon">
                  <FaChartBar />
                </div>
                <div className="kpi-content">
                  <h3>{kpis.participationRate.toFixed(2)}%</h3>
                  <p>Taux de Participation</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="kpi-card approval">
                <div className="kpi-icon">
                  <FaChartLine />
                </div>
                <div className="kpi-content">
                  <h3>{kpis.approvalRate.toFixed(2)}%</h3>
                  <p>Taux d&apos;Approbation</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="kpi-card average">
                <div className="kpi-icon">
                  <FaTachometerAlt />
                </div>
                <div className="kpi-content">
                  <h3>{kpis.overallAverage.toFixed(2)}/5</h3>
                  <p>Score Moyen Global</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Graphique */}
      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden"></span>
          </div>
          <p className="mt-2">Chargement des données...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <p className="mb-0">{error}</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="alert alert-info">
          <p className="mb-0">Aucune donnée disponible pour la période sélectionnée.</p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 5]} tickCount={6} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="averageScore" name="Score moyen" fill="#D4AC0D">
                <LabelList dataKey="averageScore" position="top" formatter={(value) => value.toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Statistiques de performance - Sous le graphique */}
      {chartData.length > 0 && (
        <div className="performance-stats mt-4">
          <div className="stats-header">
            <h6><FaChartLine className="me-2" /> Évolution des performances</h6>
          </div>
          <div className="stats-cards">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="stat-card average-score">
                  <div className="stat-value">{calculateAverageScore()}<span>/5</span></div>
                  <div className="stat-label">Score Moyen</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card total-evals">
                  <div className="stat-value">{calculateTotalEvaluations()}</div>
                  <div className="stat-label">Total Évaluations</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card best-year">
                  <div className="stat-value">{getBestYear()}</div>
                  <div className="stat-label">Meilleure Année</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`stat-card ${getTrend().isPositive ? 'trend-up' : 'trend-down'}`}>
                  <div className="stat-value">{getTrend().text}</div>
                  <div className="stat-label">Tendance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

GlobalPerformanceGraph.propTypes = {
  filters: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    department: PropTypes.string,
    evaluationType: PropTypes.string
  }),
  globalStats: PropTypes.shape({
    totalEvaluationsCount: PropTypes.number,
    averageScore: PropTypes.number,
    participationRate: PropTypes.number,
    approvalRate: PropTypes.number,
    departmentDistribution: PropTypes.array
  })
};

export default GlobalPerformanceGraph;