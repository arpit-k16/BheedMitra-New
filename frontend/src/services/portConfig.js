/**
 * Port Configuration Service
 * Manages dynamic port allocation for Streamlit panels
 */

// Default ports (fallback)
const DEFAULT_PORTS = {
  passenger: 8501,
  admin: 8502
};

// Port config endpoint (backend API)
const BACKEND_URL = 'http://localhost:8000';
const PORT_CONFIG_ENDPOINT = `${BACKEND_URL}/api/ports`;

class PortConfigService {
  constructor() {
    this.ports = { ...DEFAULT_PORTS };
    this.initialized = false;
  }

  /**
   * Initialize port configuration by trying multiple sources
   */
  async initialize() {
    if (this.initialized) return this.ports;

    // Try to get ports from backend API
    try {
      const response = await fetch(PORT_CONFIG_ENDPOINT);
      if (response.ok) {
        const config = await response.json();
        this.ports = {
          passenger: config.passenger_port || DEFAULT_PORTS.passenger,
          admin: config.admin_port || DEFAULT_PORTS.admin
        };
        this.initialized = true;
        console.log('[PortConfig] Loaded from API:', this.ports);
        return this.ports;
      }
    } catch (e) {
      console.log('[PortConfig] API not available, using defaults...');
    }

    // Use defaults
    this.initialized = true;
    console.log('[PortConfig] Using default ports:', this.ports);
    return this.ports;
  }

  /**
   * Get the port for a specific role
   */
  getPort(role) {
    const normalizedRole = (role || 'passenger').toLowerCase();
    return normalizedRole === 'admin' ? this.ports.admin : this.ports.passenger;
  }

  /**
   * Get the full Streamlit URL for a role
   */
  getStreamlitUrl(role, system = 'DMRC', station = '') {
    const normalizedRole = (role || 'passenger').toLowerCase();
    const normalizedSystem = system || 'DMRC';
    const port = this.getPort(normalizedRole);
    let url = `http://localhost:${port}?role=${encodeURIComponent(normalizedRole)}&system=${encodeURIComponent(normalizedSystem)}`;
    if (station && String(station).trim()) {
      url += `&station=${encodeURIComponent(String(station).trim())}`;
    }
    return url;
  }

  /**
   * Check if a Streamlit panel is running on a port
   */
  async checkPanelHealth(role) {
    const port = this.getPort(role);
    try {
      const response = await fetch(`http://localhost:${port}/healthz`, {
        method: 'GET',
        mode: 'no-cors' // Streamlit may not have CORS enabled
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Find an available Streamlit panel by trying multiple ports
   */
  async findAvailablePort(role, startPort = 8501, endPort = 8510) {
    for (let port = startPort; port <= endPort; port++) {
      try {
        const response = await fetch(`http://localhost:${port}/healthz`, {
          method: 'GET',
          mode: 'no-cors',
          signal: AbortSignal.timeout(1000)
        });
        // If we get here, port is responding
        if (role === 'admin') {
          this.ports.admin = port;
        } else {
          this.ports.passenger = port;
        }
        return port;
      } catch (e) {
        continue;
      }
    }
    return null;
  }
}

export const portConfig = new PortConfigService();
export default portConfig;
