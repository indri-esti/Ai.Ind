import os

import libsql

from dotenv import load_dotenv


# ==================================================
# ENV
# ==================================================

load_dotenv()

TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")


# ==================================================
# ROW (biar bisa diakses row["kolom"] sama seperti sqlite3.Row)
# ==================================================

class Row(dict):

    def __getitem__(self, key):
        return dict.__getitem__(self, key)


# ==================================================
# WRAPPER CURSOR
# ==================================================

class CursorWrapper:

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, sql, params=()):
        self._cursor.execute(sql, params)
        return self

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def fetchone(self):

        row = self._cursor.fetchone()

        return self._ubah_row(row)

    def fetchall(self):

        rows = self._cursor.fetchall()

        return [
            self._ubah_row(r)
            for r in rows
        ]

    def _ubah_row(self, row):

        if row is None:
            return None

        kolom = [
            d[0]
            for d in self._cursor.description
        ]

        return Row(
            zip(kolom, row)
        )


# ==================================================
# WRAPPER CONNECTION
# ==================================================

class ConnectionWrapper:

    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return CursorWrapper(
            self._conn.cursor()
        )

    def execute(self, sql, params=()):
        return self.cursor().execute(sql, params)

    def commit(self):
        self._conn.commit()

    def close(self):

        try:
            self._conn.close()
        except Exception:
            pass


# ==================================================
# KONEKSI
# ==================================================

def get_connection():

    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:

        raise RuntimeError(
            "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN belum "
            "diset di environment variables."
        )

    conn = libsql.connect(
        database=TURSO_DATABASE_URL,
        auth_token=TURSO_AUTH_TOKEN,
    )

    return ConnectionWrapper(conn)


# ==================================================
# INIT DATABASE
# ==================================================

def init_db():

    conn = get_connection()

    cursor = conn.cursor()

    # =========================
    # USERS
    # =========================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        foto TEXT DEFAULT ''
    )
    """)

    # =========================
    # CHAT
    # =========================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
    """)

    # =========================
    # CHAT MESSAGES
    # =========================

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(chat_id)
        REFERENCES chats(id)
        ON DELETE CASCADE
    )
    """)

    # =========================
    # INDEX
    # =========================

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_chats_user_id
    ON chats(user_id)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id
    ON messages(chat_id)
    """)

    conn.commit()

    conn.close()
