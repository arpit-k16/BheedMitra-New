/**
 * Zustand Store - Global State Management
 * Manages user authentication, role, and app state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      role: null, // 'passenger' | 'admin'
      isAuthenticated: false,
      
      // Metro system state
      selectedSystem: 'DMRC',
      availableSystems: ['DMRC', 'MTA'],
      
      // UI state
      sidebarOpen: true,
      darkMode: true,
      demoMode: true,
      
      // Data state
      stations: [],
      currentPrediction: null,
      analyticsData: null,
      
      // Loading states
      isLoading: false,
      error: null,
      
      // Actions
      login: (userData, userRole) => set({
        user: userData,
        role: userRole,
        isAuthenticated: true,
        error: null
      }),
      
      logout: () => set({
        user: null,
        role: null,
        isAuthenticated: false,
        currentPrediction: null,
        analyticsData: null
      }),
      
      setRole: (role) => set({ role }),
      
      setSelectedSystem: (system) => set({ selectedSystem: system }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      setStations: (stations) => set({ stations }),
      
      setPrediction: (prediction) => set({ currentPrediction: prediction }),
      
      setAnalyticsData: (data) => set({ analyticsData: data }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'bheedmitra-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        selectedSystem: state.selectedSystem,
        darkMode: state.darkMode
      })
    }
  )
);

export default useStore;
