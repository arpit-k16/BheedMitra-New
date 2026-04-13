/**
 * Saved Routes Page - Passenger Panel
 * Based on Stitch UI design - Saved favorite routes with real-time crowd insights
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';

const mockSavedRoutes = [
  {
    id: 1,
    name: 'Office Commute',
    icon: 'work',
    iconColor: 'text-primary bg-primary/10',
    from: 'Huda City Centre',
    to: 'Rajiv Chowk',
    lastUsed: '2h ago',
    crowdLevel: 'normal',
    crowdPercentage: 42,
    estimatedTime: '45 mins'
  },
  {
    id: 2,
    name: 'Gym Route',
    icon: 'fitness_center',
    iconColor: 'text-tertiary bg-tertiary/10',
    from: 'Malviya Nagar',
    to: 'Green Park',
    lastUsed: 'Yesterday',
    crowdLevel: 'high',
    crowdPercentage: 88,
    estimatedTime: '12 mins'
  },
  {
    id: 3,
    name: 'Weekend Trip',
    icon: 'weekend',
    iconColor: 'text-secondary bg-secondary/10',
    from: 'Noida Sec-18',
    to: 'Hauz Khas',
    lastUsed: '3 days ago',
    crowdLevel: 'low',
    crowdPercentage: 21,
    estimatedTime: '55 mins'
  }
];

function SavedRoutes() {
  const { selectedSystem } = useStore();
  const [routes, setRoutes] = useState(mockSavedRoutes);
  const [showAddModal, setShowAddModal] = useState(false);

  const getCrowdStyles = (level) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-tertiary-container',
          text: 'text-on-tertiary-fixed',
          label: 'High Density'
        };
      case 'normal':
        return {
          bg: 'bg-primary-container',
          text: 'text-on-primary-fixed',
          label: 'Normal Flow'
        };
      default:
        return {
          bg: 'bg-primary-container',
          text: 'text-on-primary-fixed',
          label: 'Low Traffic'
        };
    }
  };

  const handleDelete = (routeId) => {
    setRoutes(routes.filter(r => r.id !== routeId));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">Saved Routes</h1>
          <p className="text-on-surface-variant max-w-md">
            Access your frequent journeys instantly with real-time crowd insights.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-surface-container-high px-5 py-2.5 rounded-xl text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Favorite
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map(route => {
          const crowdStyles = getCrowdStyles(route.crowdLevel);
          return (
            <div 
              key={route.id}
              className="bg-surface-container-low p-6 rounded-xl relative group overflow-hidden transition-all duration-300 hover:bg-surface-container"
            >
              {/* Menu button */}
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => handleDelete(route.id)}
                  className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors cursor-pointer"
                >
                  more_vert
                </button>
              </div>

              {/* Route Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className={`w-12 h-12 rounded-full ${route.iconColor} flex items-center justify-center`}>
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{route.icon}</span>
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">{route.name}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Last used {route.lastUsed}</p>
                </div>
              </div>

              {/* Route Path */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(92,215,229,0.6)]"></div>
                    <div className="w-0.5 h-8 bg-outline-variant/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-outline-variant"></div>
                  </div>
                  <div className="flex flex-col gap-5">
                    <span className="font-semibold text-on-surface leading-none">{route.from}</span>
                    <span className="font-semibold text-on-surface leading-none">{route.to}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Crowd Level</span>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full ${crowdStyles.bg} ${crowdStyles.text} text-xs font-bold`}>
                      {crowdStyles.label}
                    </div>
                    <span className="text-xs text-on-surface-variant">{route.crowdPercentage}% capacity</span>
                  </div>
                </div>
                <Link 
                  to="/journey"
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all"
                >
                  Quick Start
                </Link>
              </div>
            </div>
          );
        })}

        {/* Smart Suggestion Card */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col group relative">
          <div className="h-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-container/20 opacity-60"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">route</span>
            </div>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">
                Smart Suggestion
              </span>
              <h4 className="font-headline text-xl font-black text-on-surface">Avoid Peak Rajiv Chowk</h4>
            </div>
          </div>
          <div className="p-6 relative z-20 flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Based on your favorites, we recommend starting your office commute 15 mins earlier to save 12 mins in transit time.
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                  BH
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-tertiary">
                  14
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-secondary">
                  M
                </div>
              </div>
              <Link to="/insights" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                View Analytics 
                <span className="material-symbols-outlined text-xs">trending_up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State / Add Suggestion */}
      <div className="flex items-center justify-center border-2 border-dashed border-outline-variant/20 rounded-2xl p-12">
        <div className="text-center max-w-xs">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">route</span>
          <h5 className="font-headline text-lg font-bold text-on-surface-variant">Add more routes?</h5>
          <p className="text-sm text-on-surface-variant/60 mb-6">
            Frequently travel between other stations? Add them here for instant monitoring.
          </p>
          <Link 
            to="/journey"
            className="text-primary font-bold text-sm hover:underline"
          >
            Browse all stations
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <span className="text-sm font-bold text-on-surface-variant">Time Saved This Month</span>
          </div>
          <p className="text-3xl font-bold font-headline text-on-surface">2.5 <span className="text-lg text-on-surface-variant">hrs</span></p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">directions_transit</span>
            <span className="text-sm font-bold text-on-surface-variant">Trips Taken</span>
          </div>
          <p className="text-3xl font-bold font-headline text-on-surface">47</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">eco</span>
            <span className="text-sm font-bold text-on-surface-variant">CO₂ Saved</span>
          </div>
          <p className="text-3xl font-bold font-headline text-primary">12.4 <span className="text-lg text-on-surface-variant">kg</span></p>
        </div>
      </div>
    </div>
  );
}

export default SavedRoutes;
