/**
 * Alerts Page - Admin Panel Alerts
 * Based on Stitch UI design - Real-time system monitoring and congestion management
 */

import React, { useState } from 'react';
import useStore from '../store/useStore';

const mockAlerts = [
  {
    id: 1,
    severity: 'high',
    title: 'Rajiv Chowk congestion exceeds safe threshold',
    station: 'Rajiv Chowk',
    time: '2m ago',
    description: 'Platform 1 & 2 crowd density at 94%. Immediate action recommended.',
    actions: ['Deploy Staff', 'Broadcast Alert']
  },
  {
    id: 2,
    severity: 'high',
    title: 'Train delay affecting Blue Line',
    station: 'Yamuna Bank',
    time: '8m ago',
    description: 'Technical issue causing 15-minute delay. Backup trains being dispatched.',
    actions: ['View Details', 'Notify Passengers']
  },
  {
    id: 3,
    severity: 'medium',
    title: 'Elevated crowd levels detected',
    station: 'Kashmere Gate',
    time: '14m ago',
    description: 'Platform congestion at 72%. Monitor closely for next 30 minutes.',
    actions: ['Monitor', 'Dismiss']
  },
  {
    id: 4,
    severity: 'low',
    title: 'Scheduled maintenance reminder',
    station: 'Central Secretariat',
    time: '1h ago',
    description: 'Escalator maintenance scheduled for tonight 11 PM - 5 AM.',
    actions: ['Acknowledge']
  }
];

const stationOptions = ['All Stations', 'Rajiv Chowk', 'Kashmere Gate', 'Hauz Khas', 'Central Secretariat'];

function Alerts() {
  const { selectedSystem, user } = useStore();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [alerts, setAlerts] = useState(mockAlerts);

  const filteredAlerts = alerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (stationFilter !== 'All Stations' && alert.station !== stationFilter) return false;
    return true;
  });

  const handleDismiss = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high':
        return {
          border: 'border-l-error',
          bg: 'bg-error-container/10',
          badge: 'bg-error-container/20 text-error',
          icon: 'warning',
          iconColor: 'text-error'
        };
      case 'medium':
        return {
          border: 'border-l-tertiary',
          bg: 'bg-tertiary-container/10',
          badge: 'bg-tertiary-container/20 text-tertiary',
          icon: 'info',
          iconColor: 'text-tertiary'
        };
      default:
        return {
          border: 'border-l-primary',
          bg: 'bg-primary-container/10',
          badge: 'bg-primary-container/20 text-primary',
          icon: 'notifications',
          iconColor: 'text-primary'
        };
    }
  };

  const activeAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">Active Alerts</h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            Real-time system monitoring and congestion management for {selectedSystem}.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Dashboard Status</p>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-headline font-bold text-on-surface">{activeAlerts} critical alerts</span>
              {activeAlerts > 0 && (
                <span className="ml-3 flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
          <span className="text-xs font-bold text-on-surface-variant mr-3">Severity:</span>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer py-0"
          >
            <option value="all">All Levels</option>
            <option value="high">High ({alerts.filter(a => a.severity === 'high').length})</option>
            <option value="medium">Medium ({alerts.filter(a => a.severity === 'medium').length})</option>
            <option value="low">Low ({alerts.filter(a => a.severity === 'low').length})</option>
          </select>
        </div>
        <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
          <span className="text-xs font-bold text-on-surface-variant mr-3">Station:</span>
          <select 
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 cursor-pointer py-0"
          >
            {stationOptions.map(station => (
              <option key={station} value={station}>{station}</option>
            ))}
          </select>
        </div>
        <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-fixed rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-sm">campaign</span>
          Broadcast All
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Cards */}
        <div className="space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error">bolt</span>
            Live Alerts
          </h3>
          
          {filteredAlerts.length === 0 ? (
            <div className="bg-surface-container-low p-8 rounded-xl text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-4">check_circle</span>
              <p className="text-on-surface-variant">No alerts match your current filters.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const styles = getSeverityStyles(alert.severity);
              return (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-xl border-l-4 ${styles.border} ${styles.bg} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined ${styles.iconColor}`}>{styles.icon}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles.badge}`}>
                        {alert.severity} Priority
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{alert.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-2">{alert.title}</h4>
                  <p className="text-xs text-on-surface-variant mb-4">{alert.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-xs mr-1 align-middle">location_on</span>
                      {alert.station}
                    </span>
                    <div className="flex gap-2">
                      {alert.actions.map((action, idx) => (
                        <button 
                          key={idx}
                          onClick={() => action === 'Dismiss' && handleDismiss(alert.id)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                            idx === 0 
                              ? `${alert.severity === 'high' ? 'bg-error text-on-error' : 'bg-primary text-on-primary-fixed'}`
                              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Suggested Actions Panel */}
        <div className="space-y-4">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
            Suggested Actions
          </h3>
          
          <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Increase train frequency</p>
                  <p className="text-xs text-on-surface-variant">Shorten headway to 2.5 mins on Blue Line during peak.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">person_add</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Deploy additional staff</p>
                  <p className="text-xs text-on-surface-variant">Move 4 marshals to Platform 1 exits at Rajiv Chowk.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">campaign</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Update passenger announcements</p>
                  <p className="text-xs text-on-surface-variant">Inform passengers about alternative routes via Yellow Line.</p>
                </div>
              </div>
              <button className="w-full py-2.5 bg-primary text-on-primary-fixed font-bold rounded-lg text-sm hover:opacity-90 transition-opacity">
                Apply Recommended Measures
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-xs text-on-surface-variant mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold font-headline text-on-surface">3.2<span className="text-sm text-on-surface-variant">min</span></p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-xs text-on-surface-variant mb-1">Alerts Resolved Today</p>
              <p className="text-2xl font-bold font-headline text-primary">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert History Section */}
      <div className="bg-surface-container-low rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-on-surface">Alert History</h3>
          <button className="text-xs text-primary font-bold hover:underline">View Full Log</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Time</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Station</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Alert</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Resolved By</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-outline-variant/5 hover:bg-surface-container/50">
                <td className="py-3 px-4 text-on-surface-variant">09:45 AM</td>
                <td className="py-3 px-4 text-on-surface">Hauz Khas</td>
                <td className="py-3 px-4 text-on-surface">Crowd threshold exceeded</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-primary-container/20 text-primary text-xs font-bold">Resolved</span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">{user?.name || 'Admin'}</td>
              </tr>
              <tr className="border-b border-outline-variant/5 hover:bg-surface-container/50">
                <td className="py-3 px-4 text-on-surface-variant">08:12 AM</td>
                <td className="py-3 px-4 text-on-surface">Rajiv Chowk</td>
                <td className="py-3 px-4 text-on-surface">Train delay notification</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-primary-container/20 text-primary text-xs font-bold">Resolved</span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">System Auto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
