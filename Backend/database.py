import sqlite3
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "users.db")


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row

    # Aktifkan foreign key SQLite
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


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