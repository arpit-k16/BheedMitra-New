"""
SQLite-backed authentication storage for BheedMitra.
Stores passenger and admin credentials with hashed passwords.
"""

import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
from typing import Dict, Optional


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTH_DB_PATH = os.path.join(PROJECT_ROOT, "data", "auth_users.db")
PBKDF2_ITERATIONS = 100_000
SUPPORTED_SYSTEMS = {"DMRC", "MTA"}


def _get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(AUTH_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db() -> None:
    with _get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'passenger')),
                full_name TEXT NOT NULL,
                station TEXT,
                system TEXT NOT NULL DEFAULT 'DMRC',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (email, role)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role)"
        )


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    hash_b64 = base64.b64encode(password_hash).decode("utf-8")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${hash_b64}"


def _verify_password(password: str, encoded_hash: str) -> bool:
    algo, iterations, salt_b64, hash_b64 = encoded_hash.split("$", 3)
    if algo != "pbkdf2_sha256":
        return False

    salt = base64.b64decode(salt_b64.encode("utf-8"))
    expected_hash = base64.b64decode(hash_b64.encode("utf-8"))
    computed_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        int(iterations),
    )
    return hmac.compare_digest(computed_hash, expected_hash)


def create_user(
    *,
    email: str,
    password: str,
    role: str,
    full_name: str,
    station: Optional[str] = None,
    system: str = "DMRC",
) -> Dict:
    normalized_email = email.strip().lower()
    normalized_role = role.strip().lower()
    normalized_system = (system or "DMRC").strip().upper()

    if normalized_role not in {"admin", "passenger"}:
        raise ValueError("Role must be either 'admin' or 'passenger'")
    if normalized_system not in SUPPORTED_SYSTEMS:
        raise ValueError(f"System must be one of: {sorted(SUPPORTED_SYSTEMS)}")

    if normalized_role == "admin" and not (station or "").strip():
        raise ValueError("Station assignment is required for admin accounts")

    password_hash = _hash_password(password)

    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (email, password_hash, role, full_name, station, system)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    normalized_email,
                    password_hash,
                    normalized_role,
                    full_name.strip(),
                    (station or "").strip() or None,
                    normalized_system,
                ),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError as exc:
        raise ValueError("User already exists for this role") from exc

    return {
        "id": user_id,
        "email": normalized_email,
        "role": normalized_role,
        "full_name": full_name.strip(),
        "station": (station or "").strip() or None,
        "system": normalized_system,
    }


def authenticate_user(*, email: str, password: str, role: str) -> Optional[Dict]:
    normalized_email = email.strip().lower()
    normalized_role = role.strip().lower()

    if normalized_role not in {"admin", "passenger"}:
        return None

    with _get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, email, password_hash, role, full_name, station, system, is_active
            FROM users
            WHERE email = ? AND role = ?
            """,
            (normalized_email, normalized_role),
        ).fetchone()

    if row is None or row["is_active"] != 1:
        return None

    if not _verify_password(password, row["password_hash"]):
        return None

    return {
        "id": row["id"],
        "email": row["email"],
        "role": row["role"],
        "full_name": row["full_name"],
        "station": row["station"],
        "system": row["system"],
    }
