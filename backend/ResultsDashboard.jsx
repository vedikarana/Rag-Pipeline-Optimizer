import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Trophy, TrendingUp, DollarSign, Zap } from 'lucide-react';

function ResultsDashboard({ results }) {
  const { summary, winner } = results;

  // Prepare data for charts
  const barChartData = Object.entries(summary).map(([pipeline, metrics]) => ({
    name: pipeline.replace('pipeline_', 'Pipeline ').toUpperCase(),
    Accuracy: metrics.avg_accuracy,
    Relevance: metrics.avg_relevance,
    Completeness: metrics.avg_completeness,
    Score: metrics.composite_score / 100 // Scale down for visibility
  }));

  const radarChartData = ['Accuracy', 'Relevance', 'Completeness'].map(metric => {
    const data = { metric };
    Object.entries(summary).forEach(([pipeline, metrics]) => {
      data[pipeline] = metrics[`avg_${metric.toLowerCase()}`];
    });
    return data;
  });

  const winnerData = summary[winner];
  const allPipelines = Object.keys(summary);

  return (
    <div className="space-y-8">
      
      {/* Winner Banner */}
      <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-2xl p-8 text-center winner-badge relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
        <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-900 relative z-10" />
        <h2 className="text-4xl font-bold text-yellow-900 mb-2 relative z-10">
          🏆 Winner: {winner.replace('pipeline_', 'Pipeline ').toUpperCase()}
        </h2>
        <p className="text-yellow-800 text-lg relative z-10">
          Composite Score: {winnerData.composite_score.toFixed(2)}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={TrendingUp}
          label="Accuracy"
          value={winnerData.avg_accuracy}
          max={10}
          color="purple"
        />
        <MetricCard
          icon={Zap}
          label="Relevance"
          value={winnerData.avg_relevance}
          max={10}
          color="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Completeness"
          value={winnerData.avg_completeness}
          max={10}
          color="green"
        />
        <MetricCard
          icon={DollarSign}
          label="Cost"
          value={winnerData.avg_cost}
          prefix="$"
          color="yellow"
          isCurrency
        />
      </div>

      {/* Bar Chart - Comparison Across Pipelines */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">
          Pipeline Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Accuracy" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Relevance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Completeness" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart - Multi-dimensional View */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">
          Multi-dimensional Analysis
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarChartData}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
            <PolarRadiusAxis stroke="#94a3b8" />
            {allPipelines.map((pipeline, idx) => (
              <Radar
                key={pipeline}
                name={pipeline.replace('pipeline_', 'Pipeline ').toUpperCase()}
                dataKey={pipeline}
                stroke={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx]}
                fill={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx]}
                fillOpacity={0.3}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-slate-800 rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          Detailed Metrics
        </h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-4 text-slate-300 font-semibold">Pipeline</th>
              <th className="pb-4 text-slate-300 font-semibold">Accuracy</th>
              <th className="pb-4 text-slate-300 font-semibold">Relevance</th>
              <th className="pb-4 text-slate-300 font-semibold">Completeness</th>
              <th className="pb-4 text-slate-300 font-semibold">Cost</th>
              <th className="pb-4 text-slate-300 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([pipeline, metrics]) => (
              <tr 
                key={pipeline}
                className={`border-b border-slate-700 ${
                  pipeline === winner ? 'bg-yellow-500/10' : ''
                }`}
              >
                <td className="py-4">
                  <span className="text-white font-semibold flex items-center gap-2">
                    {pipeline.replace('pipeline_', 'Pipeline ').toUpperCase()}
                    {pipeline === winner && <Trophy className="w-4 h-4 text-yellow-400" />}
                  </span>
                </td>
                <td className="py-4 text-purple-400">{metrics.avg_accuracy.toFixed(2)}</td>
                <td className="py-4 text-blue-400">{metrics.avg_relevance.toFixed(2)}</td>
                <td className="py-4 text-green-400">{metrics.avg_completeness.toFixed(2)}</td>
                <td className="py-4 text-yellow-400">${metrics.avg_cost.toFixed(6)}</td>
                <td className="py-4 text-white font-bold">{metrics.composite_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function MetricCard({ icon: Icon, label, value, max, color, prefix = '', isCurrency = false }) {
  const percentage = max ? (value / max) * 100 : 0;
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Icon className={`w-8 h-8 text-${color}-400`} />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {prefix}{isCurrency ? value.toFixed(6) : value.toFixed(2)}
      </div>
      {!isCurrency && (
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default ResultsDashboard;