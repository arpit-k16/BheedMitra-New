import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import portConfig from '../services/portConfig';
import api from '../services/api';

function Signup() {
  const navigate = useNavigate();
  const { login, setSelectedSystem } = useStore();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'passenger',
    station: '',
    system: 'DMRC'
  });

  // Fallback station options for each transit system
  const fallbackStationsBySystem = {
    DMRC: [
      'Rajiv Chowk', 'Kashmere Gate', 'Hauz Khas', 'Central Secretariat',
      'New Delhi', 'Chandni Chowk', 'HUDA City Centre', 'Noida City Centre',
      'Dwarka', 'Botanical Garden', 'Vaishali', 'Janakpuri West'
    ],
    MTA: [
      'Times Square-42nd St', 'Grand Central', 'Penn Station', 'Union Square',
      'Herald Square', 'Canal Street', 'Wall Street', 'Fulton Street'
    ]
  };
  const [stationsBySystem, setStationsBySystem] = useState(fallbackStationsBySystem);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize port configuration on mount
  useEffect(() => {
    portConfig.initialize();
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const [dmrcStations, mtaStations] = await Promise.all([
          api.getStations('DMRC'),
          api.getStations('MTA'),
        ]);
        setStationsBySystem({
          DMRC: Array.isArray(dmrcStations) && dmrcStations.length > 0 ? dmrcStations : fallbackStationsBySystem.DMRC,
          MTA: Array.isArray(mtaStations) && mtaStations.length > 0 ? mtaStations : fallbackStationsBySystem.MTA,
        });
      } catch {
        setStationsBySystem(fallbackStationsBySystem);
      }
    };
    loadStations();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      if (id === 'system') {
        return { ...prev, system: value, station: '' };
      }
      return { ...prev, [id]: value };
    });
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'admin' && !formData.station) {
      newErrors.station = 'Station assignment is required for admin accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await portConfig.initialize();

      const response = await api.signup({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        system: formData.system,
        station: formData.role === 'admin' ? formData.station : null,
      });
      const user = response.user;

      // Login with Zustand store
      login({ 
        email: user.email, 
        name: user.full_name,
        station: user.station || null
      }, user.role);
      const selectedSystem = (user.system || formData.system || 'DMRC').toUpperCase();
      setSelectedSystem(selectedSystem);
      
      // Redirect to Streamlit panel based on role (using dynamic port)
      const streamlitUrl = portConfig.getStreamlitUrl(
        formData.role,
        selectedSystem,
        formData.role === 'admin' ? (user.station || formData.station || '') : ''
      );
      window.location.href = streamlitUrl;
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'Signup failed. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="font-body min-h-screen flex flex-col items-center justify-center selection:bg-primary/30 selection:text-primary bg-background text-on-surface">
      <main className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden lg:rounded-xl lg:shadow-2xl lg:shadow-black/60 bg-surface-container-low min-h-[800px] my-6">
        {/* Left Panel - Branding */}
        <section className="hidden lg:flex relative flex-col justify-between p-12 bg-surface-container overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-40">
            <img className="w-full h-full object-cover grayscale contrast-125 brightness-50" data-alt="Cinematic aerial view of a futuristic smart city transit network" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfBMIyaa5fkoXo8D7OfdkVb4xMl8vnPYlUfuu_o-DzTUTpfU7n0I_r5_KVQ4UWqTW3QnTZ3w0MBbPABDqvgi6NALar8QmcTUivXlvbqS9lcV49Odu5ImkWcJhIBGHIXeN_VkJPMzpUL0-E_1Cg8zdyy_at3oUmsqWm2E762L1zAJcWCR5Q0OxIeT-rOk8hCoXGOS9DLOUWemddrNeS748t20VlDO9R0DAQlLSTelkvSCNl8dtCy_doQ4KwHTKvIbLQ3MmjZ7AjehwN" alt="Background" />
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-dim via-surface-dim/80 to-transparent"></div>
          </div>
          <div className="relative z-10">
            <Link to="/" className="inline-block cursor-pointer">
              <div className="flex items-center gap-3 mb-12">
                <span className="material-symbols-outlined text-primary text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>dataset</span>
                <h1 className="text-2xl font-bold font-headline tracking-tight text-on-surface">BheedMitra</h1>
              </div>
            </Link>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold font-headline leading-tight text-on-surface">
                Navigate the pulse of <br/>
                <span className="text-primary">Urban Mobility.</span>
              </h2>
              <p className="text-on-surface-variant text-lg max-w-md font-body leading-relaxed">
                Join the next generation of smart transit intelligence. Real-time crowd analytics and transit mapping at your fingertips.
              </p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-highest/30 backdrop-blur-md">
                <span className="text-primary font-bold text-xl block mb-1">98%</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Prediction Accuracy</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-highest/30 backdrop-blur-md">
                <span className="text-primary font-bold text-xl block mb-1">500+</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Transit Points</span>
              </div>
            </div>
            <div className="text-on-surface-variant text-xs font-light">
              © 2024 BheedMitra. Smart Transit Intelligence Platform. Prototype v2.0
            </div>
          </div>
        </section>

        {/* Right Panel - Signup Form */}
        <section className="flex flex-col justify-center items-center p-8 md:p-16 bg-surface-dim">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h3 className="text-3xl font-bold font-headline text-on-surface">Create Account</h3>
              <p className="text-on-surface-variant font-body">Get started with your smart transit profile today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-error/10 text-error rounded-lg text-sm font-medium text-center">
                  {errors.submit}
                </div>
              )}

              {/* Full Name */}
              <div className="group">
                <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="fullName">Full Name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">person</span>
                  <input
                    className={`w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 ${errors.fullName ? 'focus:ring-error/30' : 'focus:ring-primary/30'} transition-all font-body text-sm outline-none`}
                    id="fullName"
                    placeholder="John Doe"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-error mt-1 ml-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="email">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">mail</span>
                  <input
                    className={`w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 ${errors.email ? 'focus:ring-error/30' : 'focus:ring-primary/30'} transition-all font-body text-sm outline-none`}
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-xs text-error mt-1 ml-1">{errors.email}</p>}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="password">Password</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">lock</span>
                    <input
                      className={`w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 ${errors.password ? 'focus:ring-error/30' : 'focus:ring-primary/30'} transition-all font-body text-sm outline-none`}
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-error mt-1 ml-1">{errors.password}</p>}
                </div>
                <div className="group">
                  <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="confirmPassword">Confirm</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">verified_user</span>
                    <input
                      className={`w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 ${errors.confirmPassword ? 'focus:ring-error/30' : 'focus:ring-primary/30'} transition-all font-body text-sm outline-none`}
                      id="confirmPassword"
                      placeholder="••••••••"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-error mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Role Selection */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-on-surface-variant mb-3 ml-1">Account Role</label>
                <div className="flex p-1 bg-surface-container-lowest rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('passenger')}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                      formData.role === 'passenger'
                        ? 'bg-surface-container-high text-primary border border-primary/10'
                        : 'text-on-surface-variant hover:bg-surface-variant/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">directions_walk</span>
                    Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                      formData.role === 'admin'
                        ? 'bg-surface-container-high text-primary border border-primary/10'
                        : 'text-on-surface-variant hover:bg-surface-variant/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Admin
                  </button>
                </div>
              </div>

              {/* Transit System Selection */}
              <div className="group">
                <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="system">Transit System</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">subway</span>
                  <select
                    id="system"
                    value={formData.system}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/30 transition-all font-body text-sm outline-none appearance-none cursor-pointer"
                  >
                    <option value="DMRC">DMRC - Delhi Metro Rail Corp</option>
                    <option value="MTA">MTA - Metropolitan Transit Authority</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Station Assignment Field (Admin only) */}
              {formData.role === 'admin' && (
                <div className="group animate-fadeIn">
                  <label className="block text-xs font-medium text-on-surface-variant mb-2 ml-1" htmlFor="station">Station Assignment</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-outline text-lg transition-colors group-focus-within:text-primary">train</span>
                    <select
                      id="station"
                      value={formData.station}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-12 pr-10 text-on-surface focus:ring-2 ${errors.station ? 'focus:ring-error/30' : 'focus:ring-primary/30'} transition-all font-body text-sm outline-none appearance-none cursor-pointer`}
                    >
                      <option value="">Select your assigned station</option>
                      {stationsBySystem[formData.system]?.map(station => (
                        <option key={station} value={station}>{station}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 text-outline pointer-events-none">expand_more</span>
                  </div>
                  {errors.station && <p className="text-xs text-error mt-1 ml-1">{errors.station}</p>}
                  <p className="text-[10px] text-on-surface-variant/60 mt-1 ml-1">This is the station you'll be managing as an admin</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-bold py-4 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

            </form>

            <div className="text-center pt-2">
              <p className="text-on-surface-variant text-sm font-body">
                Already have an account?
                <Link className="text-primary font-bold hover:underline ml-1" to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full opacity-60 mt-auto">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 py-8 border-t border-outline-variant/10">
          <span className="font-body text-[11px] text-on-surface-variant tracking-wider uppercase">Prototype v2.0</span>
          <div className="flex gap-6">
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Signup;
