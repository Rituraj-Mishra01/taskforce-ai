import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BarChart2, TrendingUp, Calendar, Zap, AlertTriangle } from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const labels = logs.map(log => {
    const dateObj = new Date(log.date);
    if (isNaN(dateObj.getTime())) return log.date;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  });

  const efficiencyData = logs.map(log => log.efficiencyScore);

  // Compute metrics
  const avgEfficiency = efficiencyData.length > 0 
    ? Math.round(efficiencyData.reduce((a, b) => a + b, 0) / efficiencyData.length) 
    : 0;

  const getPrimaryDistraction = () => {
    const counts = {};
    logs.forEach(log => {
      if (log.primaryDistraction && log.primaryDistraction !== 'None') {
        counts[log.primaryDistraction] = (counts[log.primaryDistraction] || 0) + 1;
      }
    });
    
    let primary = 'None';
    let max = 0;
    for (const [dist, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        primary = dist;
      }
    }
    return primary;
  };

  const commonDistraction = getPrimaryDistraction();

  // Chart configuration
  const chartData = {
    labels: labels.length > 0 ? labels : ['No Data'],
    datasets: [
      {
        label: 'Efficiency Score (%)',
        data: efficiencyData.length > 0 ? efficiencyData : [0],
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
        pointRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(156, 163, 175, 0.15)', // theme neutral grid line color
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter',
            size: 11
          },
          callback: (value) => `${value}%`
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Inter',
            size: 11
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: '#1f2937',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Efficiency: ${context.parsed.y}%`
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-slate-100 dark:bg-darkBorder rounded-lg border border-slate-200 dark:border-transparent">
          <BarChart2 size={18} className="text-neonBlue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">7-Day Rolling Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400">Track task completion efficiency trends</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-10 h-10 border-3 border-t-neonBlue border-r-transparent border-b-neonPurple border-l-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Syncing telemetry data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Display */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder flex flex-col h-[400px]">
            <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-neonBlue" />
              Efficiency Trend Line
            </h3>
            <div className="flex-1 relative">
              {logs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-gray-500 text-sm">
                  Complete your first daily debrief to generate metrics.
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPurple opacity-5 blur-xl rounded-full"></div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Average 7-Day Performance</span>
              <h4 className="text-4xl font-extrabold bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
                {avgEfficiency}%
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">
                Aim for a score above 85% to maintain compounding momentum.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-xl rounded-full"></div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Primary Focus Leaks</span>
              <h4 className={`text-xl font-bold flex items-center gap-1.5 ${
                commonDistraction === 'None' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {commonDistraction === 'None' ? (
                  <span>Optimal Focus</span>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    <span>{commonDistraction}</span>
                  </>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">
                {commonDistraction === 'None' 
                  ? 'No severe concentration blocks logged this week. Excellent job!'
                  : `Your schedule logs show ${commonDistraction} is your primary distraction block.`
                }
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Logged Entries</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{logs.length} days</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-darkBg/60 border border-slate-200 dark:border-darkBorder rounded-xl text-neonBlue">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
