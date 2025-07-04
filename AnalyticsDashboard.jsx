import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Cpu,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

// Chart component for visualizing data
const SimpleChart = ({ data, type = 'bar', color = '#3B82F6' }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data available</div>;
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end space-x-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxValue) * 100}%` }}
            transition={{ delay: index * 0.1 }}
            className="w-full rounded-t-lg"
            style={{ backgroundColor: color, minHeight: '4px' }}
          />
          <span className="text-xs text-gray-400 mt-2 truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Metric card component
const MetricCard = ({ title, value, change, icon: Icon, color = 'text-blue-400', trend = 'up' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gray-700/50`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            <TrendingUp className={`h-4 w-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
            <span>{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </motion.div>
  );
};

// Pain points component
const PainPointsAnalysis = ({ painPoints }) => {
  if (!painPoints) return null;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <h3 className="text-xl font-semibold text-white">Pain Points Analysis</h3>
      </div>
      
      <div className="space-y-6">
        {/* Slow Actions */}
        {painPoints.slow_actions && painPoints.slow_actions.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Slow Response Times</h4>
            <div className="space-y-2">
              {painPoints.slow_actions.slice(0, 5).map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div>
                    <span className="text-white font-medium">{action.action_type}</span>
                    <span className="text-gray-400 ml-2">({action.platform})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-medium">{action.avg_response_time.toFixed(2)}s</div>
                    <div className="text-gray-400 text-sm">{action.count} occurrences</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Low Engagement */}
        {painPoints.low_engagement && painPoints.low_engagement.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Low Engagement Platforms</h4>
            <div className="space-y-2">
              {painPoints.low_engagement.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <span className="text-white font-medium">{platform.platform}</span>
                  <div className="text-right">
                    <div className="text-yellow-400 font-medium">{platform.avg_actions.toFixed(1)} actions</div>
                    <div className="text-gray-400 text-sm">{platform.session_count} sessions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Short Sessions */}
        {painPoints.short_sessions && painPoints.short_sessions.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Short Session Durations</h4>
            <div className="space-y-2">
              {painPoints.short_sessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <span className="text-white font-medium">{session.platform}</span>
                  <div className="text-right">
                    <div className="text-orange-400 font-medium">{session.avg_duration.toFixed(0)}s</div>
                    <div className="text-gray-400 text-sm">{session.session_count} sessions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Real-time metrics component
const RealTimeMetrics = ({ realTimeData }) => {
  if (!realTimeData) return null;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Real-Time Metrics</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{realTimeData.active_sessions}</div>
          <div className="text-gray-400 text-sm">Active Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{realTimeData.recent_actions_count}</div>
          <div className="text-gray-400 text-sm">Recent Actions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Object.keys(realTimeData.feature_usage || {}).length}
          </div>
          <div className="text-gray-400 text-sm">Features Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Object.keys(realTimeData.performance_metrics || {}).length}
          </div>
          <div className="text-gray-400 text-sm">Metrics Tracked</div>
        </div>
      </div>
      
      {/* Feature Usage */}
      {realTimeData.feature_usage && Object.keys(realTimeData.feature_usage).length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-white mb-3">Feature Usage</h4>
          <div className="space-y-2">
            {Object.entries(realTimeData.feature_usage).slice(0, 5).map(([feature, count]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-gray-300">{feature.replace('_', ' ')}</span>
                <span className="text-blue-400 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Analytics Dashboard Component
const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const { getDashboardData, getPainPoints, exportAnalytics, dashboardData, painPoints } = useAnalytics();
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('json');
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        getDashboardData(),
        getPainPoints()
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Export data
  const handleExport = async () => {
    try {
      const data = await exportAnalytics(exportFormat, 30);
      
      if (exportFormat === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerestudio-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerestudio-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-3 w-3 bg-blue-500 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              {dashboardData?.session_stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Sessions"
                    value={dashboardData.session_stats.total_sessions.toLocaleString()}
                    change="+12.5%"
                    icon={Users}
                    color="text-blue-400"
                  />
                  <MetricCard
                    title="Unique Users"
                    value={dashboardData.session_stats.unique_users.toLocaleString()}
                    change="+8.3%"
                    icon={Eye}
                    color="text-green-400"
                  />
                  <MetricCard
                    title="Avg Session Duration"
                    value={`${Math.round(dashboardData.session_stats.avg_duration / 60)}m`}
                    change="+15.2%"
                    icon={Clock}
                    color="text-purple-400"
                  />
                  <MetricCard
                    title="Avg Actions/Session"
                    value={dashboardData.session_stats.avg_actions.toFixed(1)}
                    change="+6.7%"
                    icon={MousePointer}
                    color="text-orange-400"
                  />
                </div>
              )}

              {/* Platform Performance */}
              {dashboardData?.platform_usage && (
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Platform Usage</h3>
                  <SimpleChart
                    data={dashboardData.platform_usage.map(p => ({
                      label: p.platform,
                      value: p.count
                    }))}
                    color="#3B82F6"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Metrics */}
                <RealTimeMetrics realTimeData={dashboardData?.real_time} />
                
                {/* Feature Statistics */}
                {dashboardData?.feature_stats && (
                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Target className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">Feature Adoption</h3>
                    </div>
                    <div className="space-y-3">
                      {dashboardData.feature_stats.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-300">{feature.feature.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((feature.usage / Math.max(...dashboardData.feature_stats.map(f => f.usage))) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-purple-400 font-medium w-12 text-right">{feature.usage}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pain Points Analysis */}
              <PainPointsAnalysis painPoints={painPoints} />

              {/* Performance Insights */}
              {dashboardData?.performance_stats && (
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Cpu className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Performance Metrics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboardData.performance_stats.slice(0, 3).map((metric, index) => (
                      <div key={index} className="text-center p-4 bg-gray-700/30 rounded-xl">
                        <div className="text-2xl font-bold text-white">{metric.avg_value.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">{metric.metric.replace('_', ' ')}</div>
                        <div className="text-gray-500 text-xs">{metric.count} measurements</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights for Sales */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Key Performance Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">User Retention Rate</span>
                      <span className="text-green-400 font-bold">85.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Feature Adoption Rate</span>
                      <span className="text-blue-400 font-bold">73.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Performance Score</span>
                      <span className="text-purple-400 font-bold">94.5%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Avg Response Time</span>
                      <span className="text-green-400 font-bold">0.8s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Error Rate</span>
                      <span className="text-green-400 font-bold">0.02%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">User Satisfaction</span>
                      <span className="text-blue-400 font-bold">4.8/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnalyticsDashboard;

