/**
 * Risk Panel Component - Risk alerts and warnings
 */

import React from 'react';

const mockAlerts = [
  { id: 1, level: 'high', station: 'Rajiv Chowk', message: 'Expected overcrowding 6-7 PM', time: '15 min ago' },
  { id: 2, level: 'medium', station: 'Kashmere Gate', message: 'Moderate delays expected', time: '32 min ago' },
  { id: 3, level: 'low', station: 'Central Secretariat', message: 'Platform maintenance', time: '1 hour ago' },
];

const levelConfig = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'warning', iconColor: 'text-red-400' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'info', iconColor: 'text-amber-400' },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'notifications', iconColor: 'text-blue-400' },
};

function RiskPanel() {
  return (
    <div className="bg-[#0f1629] rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Risk Alerts</h3>
          <p className="text-sm text-gray-500">Real-time notifications</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-400 text-sm">notification_important</span>
        </div>
      </div>

      <div className="space-y-3">
        {mockAlerts.map((alert) => {
          const config = levelConfig[alert.level];
          
          return (
            <div
              key={alert.id}
              className={`${config.bg} border ${config.border} rounded-xl p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined ${config.iconColor} mt-0.5`}>
                  {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.station}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Actions */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-sm">lightbulb</span>
          Suggested Actions
        </h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            Deploy additional staff at Rajiv Chowk
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            Increase train frequency on Blue Line
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            Enable crowd control barriers at gates 3-5
          </li>
        </ul>
      </div>
    </div>
  );
}

export default RiskPanel;
