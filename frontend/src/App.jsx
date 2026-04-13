import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LiveMapComingSoon from './pages/LiveMapComingSoon';

// Dashboard Pages
import { Dashboard } from './pages/dashboard';
import Insights from './pages/Insights';
import Maps from './pages/Maps';
import Reports from './pages/Reports';
import JourneyPlanner from './pages/JourneyPlanner';
import Alerts from './pages/Alerts';
import SavedRoutes from './pages/SavedRoutes';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/live-map" element={<LiveMapComingSoon />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute><Insights /></ProtectedRoute>
        } />
        <Route path="/maps" element={
          <ProtectedRoute><Maps /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute><Reports /></ProtectedRoute>
        } />
        <Route path="/journey" element={
          <ProtectedRoute><JourneyPlanner /></ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute><Alerts /></ProtectedRoute>
        } />
        <Route path="/saved" element={
          <ProtectedRoute><SavedRoutes /></ProtectedRoute>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
