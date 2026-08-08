from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_connection

auth = Blueprint("auth", __name__)


# ==================================================
# REGISTER
# ==================================================

@auth.route("/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    nama = data.get("nama", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not nama or not email or not password:
        return jsonify({
            "success": False,
            "message": "Semua field wajib diisi."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE email=?",
        (email,)
    )

    if cursor.fetchone():
        conn.close()

        return jsonify({
            "success": False,
            "message": "Email sudah digunakan."
        }), 400

    password_hash = generate_password_hash(password)

    cursor.execute(
        """
        INSERT INTO users(nama, email, password, foto)
        VALUES(?,?,?,?)
        """,
        (nama, email, password_hash, "")
    )

    conn.commit()

    user_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "success": True,
        "message": "Register berhasil.",
        "user": {
            "id": user_id,
            "nama": nama,
            "email": email,
            "foto": ""
        }
    }), 201


# ==================================================
# LOGIN
# ==================================================

@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email dan password wajib diisi."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    if not user:
        return jsonify({
            "success": False,
            "message": "Email tidak ditemukan."
        }), 404

    if not check_password_hash(user["password"], password):
        return jsonify({
            "success": False,
            "message": "Password salah."
        }), 401

    return jsonify({
        "success": True,
        "message": "Login berhasil.",
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"],
            "foto": user["foto"] or ""
        }
    })


# ==================================================
# GOOGLE LOGIN
# ==================================================

@auth.route("/google-login", methods=["POST"])
def google_login():

    data = request.get_json() or {}

    nama = data.get("nama", "").strip()
    email = data.get("email", "").strip().lower()
    foto = data.get("foto", "")

    if not nama or not email:
        return jsonify({
            "success": False,
            "message": "Data Google tidak lengkap."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()

    if not user:

        password_hash = generate_password_hash(
            "google_login"
        )

        cursor.execute(
            """
            INSERT INTO users
            (nama,email,password,foto)
            VALUES(?,?,?,?)
            """,
            (
                nama,
                email,
                password_hash,
                foto
            )
        )

        conn.commit()

        cursor.execute(
            "SELECT * FROM users WHERE email=?",
            (email,)
        )

        user = cursor.fetchone()

    else:
        # Update nama/foto jika berubah di Google
        cursor.execute(
            """
            UPDATE users
            SET nama=?, foto=?
            WHERE id=?
            """,
            (
                nama,
                foto,
                user["id"]
            )
        )

        conn.commit()

        cursor.execute(
            "SELECT * FROM users WHERE id=?",
            (user["id"],)
        )

        user = cursor.fetchone()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Google login berhasil.",
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"],
            "foto": user["foto"] or ""
        }
    })


# ==================================================
# LOGOUT
# ==================================================

@auth.route("/logout", methods=["POST"])
def logout():

    return jsonify({
        "success": True,
        "message": "Logout berhasil."
    })


# ==================================================
# GET SEMUA CHAT USER
# ==================================================

@auth.route("/chats", methods=["GET"])
def get_chats():

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id diperlukan."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, title, created_at
        FROM chats
        WHERE user_id=?
        ORDER BY id DESC
        """,
        (user_id,)
    )

    chats = cursor.fetchall()

    result = []

    for chat in chats:

        cursor.execute(
            """
            SELECT id, role, content, created_at
            FROM messages
            WHERE chat_id=?
            ORDER BY id ASC
            """,
            (chat["id"],)
        )

        messages = cursor.fetchall()

        result.append({
            "id": chat["id"],
            "title": chat["title"],
            "created_at": chat["created_at"],
            "messages": [
                {
                    "id": msg["id"],
                    "role": msg["role"],
                    "content": msg["content"]
                }
                for msg in messages
            ]
        })

    conn.close()

    return jsonify({
        "success": True,
        "chats": result
    })


# ==================================================
# BUAT CHAT BARU
# ==================================================

@auth.route("/chats", methods=["POST"])
def create_chat():

    data = request.get_json() or {}

    user_id = data.get("user_id")
    title = data.get("title", "Percakapan Baru").strip()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id diperlukan."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO chats(user_id, title)
        VALUES(?,?)
        """,
        (
            user_id,
            title or "Percakapan Baru"
        )
    )

    conn.commit()

    chat_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "success": True,
        "chat": {
            "id": chat_id,
            "title": title or "Percakapan Baru",
            "messages": []
        }
    }), 201


# ==================================================
# TAMBAH MESSAGE
# ==================================================

@auth.route("/chats/<int:chat_id>/messages", methods=["POST"])
def add_chat_message(chat_id):

    data = request.get_json() or {}

    user_id = data.get("user_id")
    role = data.get("role")
    content = data.get("content", "").strip()

    if not user_id or role not in ["user", "assistant"] or not content:
        return jsonify({
            "success": False,
            "message": "Data message tidak lengkap."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    # Pastikan chat memang milik user
    cursor.execute(
        """
        SELECT id
        FROM chats
        WHERE id=? AND user_id=?
        """,
        (
            chat_id,
            user_id
        )
    )

    chat = cursor.fetchone()

    if not chat:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Chat tidak ditemukan."
        }), 404

    cursor.execute(
        """
        INSERT INTO messages(chat_id, role, content)
        VALUES(?,?,?)
        """,
        (
            chat_id,
            role,
            content
        )
    )

    conn.commit()

    message_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "success": True,
        "message": {
            "id": message_id,
            "role": role,
            "content": content
        }
    })


# ==================================================
# HAPUS CHAT
# ==================================================

@auth.route("/chats/<int:chat_id>", methods=["DELETE"])
def delete_chat(chat_id):

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "user_id diperlukan."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM chats
        WHERE id=? AND user_id=?
        """,
        (
            chat_id,
            user_id
        )
    )

    conn.commit()

    deleted = cursor.rowcount

    conn.close()

    if deleted == 0:
        return jsonify({
            "success": False,
            "message": "Chat tidak ditemukan."
        }), 404

    return jsonify({
        "success": True,
        "message": "Chat berhasil dihapus."
    })