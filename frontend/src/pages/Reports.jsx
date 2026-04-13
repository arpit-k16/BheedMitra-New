/**
 * Reports Page - Admin Reports
 * Redesigned to match Stitch UI - Admin Panel Reports
 */

import React, { useState } from 'react';
import useStore from '../store/useStore';

const monthlyData = [
  { name: 'Mon', value: 82000 },
  { name: 'Tue', value: 75000 },
  { name: 'Wed', value: 90000 },
  { name: 'Thu', value: 78000 },
  { name: 'Fri', value: 95000 },
  { name: 'Sat', value: 65000 },
  { name: 'Sun', value: 55000 },
];

const peakData = [
  { time: '06:00', morning: 12, evening: 5 },
  { time: '08:00', morning: 45, evening: 8 },
  { time: '10:00', morning: 32, evening: 12 },
  { time: '12:00', morning: 18, evening: 15 },
  { time: '14:00', morning: 15, evening: 22 },
  { time: '16:00', morning: 10, evening: 38 },
  { time: '18:00', morning: 8, evening: 52 },
  { time: '20:00', morning: 5, evening: 30 },
];

const crowdDistribution = [
  { name: 'Low', value: 35, color: '#006b74' },
  { name: 'Moderate', value: 45, color: '#8f5201' },
  { name: 'High', value: 20, color: '#93000a' },
];

const recentReports = [
  { id: 'RPT-2024-0431', title: 'Weekly Ridership Analysis', date: 'Jan 15, 2024', status: 'Generated', type: 'Ridership' },
  { id: 'RPT-2024-0430', title: 'Station Congestion Report', date: 'Jan 14, 2024', status: 'Pending', type: 'Congestion' },
  { id: 'RPT-2024-0429', title: 'Peak Hour Breakdown', date: 'Jan 13, 2024', status: 'Generated', type: 'Peak Analysis' },
  { id: 'RPT-2024-0428', title: 'Monthly KPI Summary', date: 'Jan 12, 2024', status: 'Generated', type: 'KPI' },
];

function Reports() {
  const { role } = useStore();
  const [timeRange, setTimeRange] = useState('week');
  const [reportType, setReportType] = useState('all');

  const maxValue = Math.max(...monthlyData.map(d => d.value));

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">lock</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Access Restricted</h3>
          <p className="text-on-surface-variant">Reports are only available for admin users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface font-headline">Analytics Reports</h1>
          <p className="text-sm text-on-surface-variant mt-1">Comprehensive system performance analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-surface-container rounded-lg p-1">
            {['day', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-primary text-on-primary-fixed' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-fixed rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container/20 text-primary">+12.4%</span>
          </div>
          <p className="text-2xl font-black text-on-surface">2.4M</p>
          <p className="text-xs text-on-surface-variant mt-1">Total Ridership</p>
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">speed</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary">-2.1%</span>
          </div>
          <p className="text-2xl font-black text-on-surface">68%</p>
          <p className="text-xs text-on-surface-variant mt-1">Avg. Capacity Utilization</p>
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-error-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-container/20 text-error">+8</span>
          </div>
          <p className="text-2xl font-black text-on-surface">47</p>
          <p className="text-xs text-on-surface-variant mt-1">Congestion Alerts</p>
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">timer</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container/20 text-primary">-0.8m</span>
          </div>
          <p className="text-2xl font-black text-on-surface">4.2m</p>
          <p className="text-xs text-on-surface-variant mt-1">Avg. Wait Time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ridership Trend - Bar Chart */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Ridership Trend</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Weekly passenger flow analysis</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                <span className="text-on-surface-variant">This Week</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end gap-4 px-4">
            {monthlyData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-on-surface-variant">{(item.value/1000).toFixed(0)}k</span>
                <div 
                  className="w-full bg-gradient-to-t from-primary/50 to-primary rounded-t-lg transition-all hover:from-primary/70"
                  style={{ height: `${(item.value / maxValue) * 200}px` }}
                ></div>
                <span className="text-xs text-on-surface-variant">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crowd Distribution - Donut Chart */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-white/5">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-on-surface">Crowd Distribution</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">By congestion level</p>
          </div>
          <div className="h-48 flex items-center justify-center">
            <div className="relative w-36 h-36">
              {/* Simple donut visualization */}
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#006b74" strokeWidth="4" strokeDasharray="35 65" strokeDashoffset="25" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#8f5201" strokeWidth="4" strokeDasharray="45 55" strokeDashoffset="-10" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#93000a" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-55" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-on-surface">100%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {crowdDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-on-surface-variant">{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-surface-container-low rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Peak Hour Analysis</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Morning vs Evening rush comparison</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              <span className="text-on-surface-variant">Morning Peak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
              <span className="text-on-surface-variant">Evening Peak</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex flex-col">
          {/* Chart area */}
          <div className="flex-1 flex items-end gap-4 px-4 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-4">
              {[100, 75, 50, 25, 0].map((val) => (
                <div key={val} className="flex items-center gap-2">
                  <span className="text-[10px] text-on-surface-variant w-8">{val}%</span>
                  <div className="flex-1 border-b border-outline-variant/10"></div>
                </div>
              ))}
            </div>
            {/* Bars */}
            <div className="flex-1 flex items-end gap-2 relative z-10 ml-10">
              {peakData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end justify-center h-48">
                    <div 
                      className="w-3 bg-primary rounded-t"
                      style={{ height: `${item.morning * 1.8}px` }}
                      title={`Morning: ${item.morning}%`}
                    ></div>
                    <div 
                      className="w-3 bg-tertiary rounded-t"
                      style={{ height: `${item.evening * 1.8}px` }}
                      title={`Evening: ${item.evening}%`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/15">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Generated Reports</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Recent report history</p>
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-primary/50 focus:outline-none text-on-surface"
            >
              <option value="all">All Types</option>
              <option value="ridership">Ridership</option>
              <option value="congestion">Congestion</option>
              <option value="kpi">KPI</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Report ID</th>
                <th className="text-left py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id} className="border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-xs font-mono text-on-surface-variant">{report.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-semibold text-on-surface">{report.title}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs text-on-surface-variant">{report.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      report.status === 'Generated' 
                        ? 'bg-primary-container/20 text-primary' 
                        : 'bg-tertiary-container/20 text-tertiary'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant hover:text-on-surface">download</span>
                    </button>
                    <button className="p-2 hover:bg-surface-container rounded-lg transition-colors ml-1">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant hover:text-on-surface">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
