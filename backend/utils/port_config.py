"""
BheedMitra - Port Configuration Utility
Finds available ports and manages port allocation for Streamlit panels.
"""

import socket
import os
import json
from typing import Tuple, Optional

# Default port configuration
DEFAULT_PASSENGER_PORT = 8501
DEFAULT_ADMIN_PORT = 8502
PORT_RANGE_START = 8501
PORT_RANGE_END = 8599

# Port config file location (at project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
PORT_CONFIG_FILE = os.path.join(PROJECT_ROOT, ".port_config.json")


def is_port_available(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a port is available for use.

    On Windows, bind-only checks can report false positives in some dual-stack
    situations. We first check whether anything is already listening on
    localhost (IPv4/IPv6), then perform a bind test.
    """
    # If something is already listening, port is not available.
    for connect_host, family in (("127.0.0.1", socket.AF_INET), ("::1", socket.AF_INET6)):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as probe:
                probe.settimeout(0.3)
                if probe.connect_ex((connect_host, port)) == 0:
                    return False
        except (socket.error, OSError):
            # Ignore family/host issues and continue checks.
            pass

    # Bind test as final confirmation.
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            s.bind((host, port))
            return True
    except (socket.error, OSError):
        return False


def find_available_port(start_port: int, end_port: int = None, host: str = "127.0.0.1") -> Optional[int]:
    """Find an available port starting from start_port."""
    if end_port is None:
        end_port = start_port + 100
    
    for port in range(start_port, end_port):
        if is_port_available(port, host):
            return port
    return None


def get_available_ports(
    preferred_passenger: int = DEFAULT_PASSENGER_PORT,
    preferred_admin: int = DEFAULT_ADMIN_PORT
) -> Tuple[int, int]:
    """
    Get available ports for passenger and admin panels.
    Tries preferred ports first, then finds alternatives.
    
    Returns:
        Tuple of (passenger_port, admin_port)
    """
    # Try preferred passenger port
    if is_port_available(preferred_passenger):
        passenger_port = preferred_passenger
    else:
        passenger_port = find_available_port(PORT_RANGE_START, PORT_RANGE_END)
        if passenger_port is None:
            raise RuntimeError(f"No available ports found in range {PORT_RANGE_START}-{PORT_RANGE_END}")
    
    # Try preferred admin port (must be different from passenger)
    if preferred_admin != passenger_port and is_port_available(preferred_admin):
        admin_port = preferred_admin
    else:
        # Find next available port after passenger port
        admin_port = find_available_port(passenger_port + 1, PORT_RANGE_END)
        if admin_port is None:
            # Try from beginning of range
            admin_port = find_available_port(PORT_RANGE_START, passenger_port)
        if admin_port is None:
            raise RuntimeError("Could not find available port for admin panel")
    
    return passenger_port, admin_port


def save_port_config(passenger_port: int, admin_port: int) -> str:
    """Save port configuration to file for other services to read."""
    config = {
        "passenger_port": passenger_port,
        "admin_port": admin_port,
        "passenger_url": f"http://localhost:{passenger_port}",
        "admin_url": f"http://localhost:{admin_port}"
    }
    
    with open(PORT_CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    
    return PORT_CONFIG_FILE


def load_port_config() -> Optional[dict]:
    """Load port configuration from file."""
    if os.path.exists(PORT_CONFIG_FILE):
        try:
            with open(PORT_CONFIG_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    return None


def get_ports() -> Tuple[int, int]:
    """
    Get ports for the application.
    First checks saved config, then finds available ports.
    
    Returns:
        Tuple of (passenger_port, admin_port)
    """
    # Try to load existing config
    config = load_port_config()
    
    if config:
        passenger_port = config.get("passenger_port", DEFAULT_PASSENGER_PORT)
        admin_port = config.get("admin_port", DEFAULT_ADMIN_PORT)
        
        # Verify ports are still available
        if is_port_available(passenger_port) and is_port_available(admin_port):
            return passenger_port, admin_port
    
    # Find new available ports
    passenger_port, admin_port = get_available_ports()
    save_port_config(passenger_port, admin_port)
    
    return passenger_port, admin_port


def print_port_status():
    """Print current port status for debugging."""
    print("=" * 50)
    print("BheedMitra Port Status")
    print("=" * 50)
    
    # Check default ports
    print(f"\nDefault Passenger Port ({DEFAULT_PASSENGER_PORT}): ", end="")
    print("✓ Available" if is_port_available(DEFAULT_PASSENGER_PORT) else "✗ In Use")
    
    print(f"Default Admin Port ({DEFAULT_ADMIN_PORT}): ", end="")
    print("✓ Available" if is_port_available(DEFAULT_ADMIN_PORT) else "✗ In Use")
    
    # Get allocated ports
    try:
        passenger_port, admin_port = get_ports()
        print(f"\nAllocated Ports:")
        print(f"  Passenger Panel: {passenger_port}")
        print(f"  Admin Panel: {admin_port}")
        print(f"\nURLs:")
        print(f"  Passenger: http://localhost:{passenger_port}")
        print(f"  Admin: http://localhost:{admin_port}")
    except RuntimeError as e:
        print(f"\nError: {e}")
    
    print("=" * 50)


if __name__ == "__main__":
    print_port_status()
