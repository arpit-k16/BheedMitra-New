/**
 * Utility function to redirect users to Streamlit dashboard with role parameters
 * @param {string} role - 'passenger' or 'admin'
 * @param {string} system - Transit system name (default: 'DMRC')
 * @param {string} streamlitUrl - Streamlit app URL (default: production URL)
 */
export function redirectToDashboard(
  role = 'passenger',
  system = 'DMRC',
  streamlitUrl = 'https://bheed-mitra.streamlit.app'
) {
  try {
    // Validate role
    const validRoles = ['passenger', 'admin'];
    const normalizedRole = role ? role.toLowerCase() : 'passenger';

    if (!validRoles.includes(normalizedRole)) {
      console.warn(`Invalid role: ${role}. Defaulting to 'passenger'`);
    }

    // Build URL with query parameters
    const params = new URLSearchParams({
      role: normalizedRole,
      system: system || 'DMRC'
    });

    const redirectUrl = `${streamlitUrl}?${params.toString()}`;

    console.log(`Redirecting to: ${redirectUrl}`);

    // Perform redirect
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Error redirecting to dashboard:', error);
    // Fallback to default passenger dashboard
    window.location.href = `${streamlitUrl}?role=passenger&system=DMRC`;
  }
}

/**
 * Alternative: Use window.open for opening in new tab (if preferred)
 * @param {string} role - User role
 * @param {boolean} newTab - Open in new tab (default: false)
 */
export function redirectToDashboardTab(role = 'passenger', newTab = false) {
  const url = `https://bheed-mitra.streamlit.app?role=${role}&system=DMRC`;

  if (newTab) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}
