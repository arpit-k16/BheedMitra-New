import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import portConfig from '../services/portConfig';
import api from '../services/api';

const TRANSIT_SYSTEMS = [
  { id: 'DMRC', name: 'Delhi Metro (DMRC)', city: 'Delhi, India' },
  { id: 'MTA', name: 'MTA Subway', city: 'New York, USA' }
];

function Login() {
  const navigate = useNavigate();
  const { login, setSelectedSystem } = useStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'passenger',
    system: 'DMRC'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize port configuration on mount
  useEffect(() => {
    portConfig.initialize();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData(prev => ({
      ...prev,
      role: selectedRole
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await portConfig.initialize();

      const response = await api.login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      const user = response.user;

      // Login with Zustand store
      login(
        {
          email: user.email,
          name: user.full_name,
          station: user.station || null,
        },
        user.role
      );
      setSelectedSystem((user.system || formData.system || 'DMRC').toUpperCase());
      
      // Redirect to Streamlit panel based on role (using dynamic port)
      const streamlitUrl = portConfig.getStreamlitUrl(
        formData.role,
        (user.system || formData.system || 'DMRC').toUpperCase(),
        user.role === 'admin' ? (user.station || '') : ''
      );
      window.location.href = streamlitUrl;
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        submit: 'Login failed. Please try again.'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col bg-background text-on-surface">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient Element */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full"></div>
        <div className="w-full max-w-[480px] z-10">
          {/* Brand Identity */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-block cursor-pointer">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-high mb-6 shadow-2xl shadow-black/50">
                <span className="material-symbols-outlined text-primary text-4xl" data-icon="hub">hub</span>
              </div>
            </Link>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">BheedMitra</h1>
            <p className="text-on-surface-variant font-medium tracking-wide">Smart Transit Intelligence Platform</p>
          </div>
          {/* Login Card */}
          <div className="bg-surface-container-low rounded-xl p-8 md:p-10 shadow-2xl shadow-black/60 relative group">
            {/* Internal Highlight */}
            <div className="absolute inset-0 border border-outline-variant/10 rounded-xi pointer-events-none"></div>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-error/10 text-error rounded-lg text-sm font-medium text-center">
                  {errors.submit}
                </div>
              )}

              {/* Role Selection (Asymmetric Toggle) */}
              <div className="space-y-3">
                <label className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">Access Role</label>
                <div className="grid grid-cols-2 p-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/5">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('passenger')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                      formData.role === 'passenger'
                        ? 'bg-primary-container text-on-primary-container shadow-lg'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" data-icon="directions_walk">directions_walk</span>
                    Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                      formData.role === 'admin'
                        ? 'bg-primary-container text-on-primary-container shadow-lg'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" data-icon="admin_panel_settings">admin_panel_settings</span>
                    Admin / Operator
                  </button>
                </div>
              </div>

              {/* Transit System Selection */}
              <div className="space-y-2">
                <label className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1" htmlFor="system">Transit System</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors duration-200" data-icon="train">train</span>
                  </div>
                  <select
                    id="system"
                    value={formData.system}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/30 transition-all duration-200 font-medium appearance-none cursor-pointer"
                  >
                    {TRANSIT_SYSTEMS.map(sys => (
                      <option key={sys.id} value={sys.id}>
                        {sys.name} - {sys.city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline" data-icon="expand_more">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors duration-200" data-icon="alternate_email">alternate_email</span>
                    </div>
                    <input
                      className={`block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border-none rounded-xl text-on-surface placeholder:text-outline/50 focus:ring-2 ${
                        errors.email ? 'focus:ring-error/30' : 'focus:ring-primary/30'
                      } transition-all duration-200 font-medium`}
                      id="email"
                      placeholder="name@enterprise.com"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-error px-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest" htmlFor="password">Password</label>
                    <a className="text-xs font-semibold text-primary hover:text-primary-fixed transition-colors" href="#">Forgot Password?</a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors duration-200" data-icon="lock">lock</span>
                    </div>
                    <input
                      className={`block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border-none rounded-xl text-on-surface placeholder:text-outline/50 focus:ring-2 ${
                        errors.password ? 'focus:ring-error/30' : 'focus:ring-primary/30'
                      } transition-all duration-200 font-medium`}
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-error px-1">{errors.password}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-4">
                <button
                  className={`w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <span className="material-symbols-outlined text-xl" data-icon="login">login</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-on-surface-variant text-sm font-medium">
              Don't have an account?
              <Link className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 ml-1" to="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </main>
      {/* Footer Component */}
      <footer className="bg-[#0f141a] w-full py-12 px-8 border-t border-[#40484f]/15 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <span className="font-inter text-xs text-[#c0c7d0] opacity-80">© 2024 BheedMitra. Smart Transit Intelligence Platform. Prototype Status: Alpha v1.2</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="font-inter text-xs text-[#c0c7d0] hover:text-[#5cd7e5] transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="font-inter text-xs text-[#c0c7d0] hover:text-[#5cd7e5] transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="font-inter text-xs text-[#c0c7d0] hover:text-[#5cd7e5] transition-colors opacity-80 hover:opacity-100" href="#">System Status</a>
          <a className="font-inter text-xs text-[#c0c7d0] hover:text-[#5cd7e5] transition-colors opacity-80 hover:opacity-100" href="#">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}

export default Login;
