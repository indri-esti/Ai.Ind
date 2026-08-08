import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from ai import balas
from auth import auth
from database import init_db, get_connection


app = Flask(__name__)

CORS(app)


# ==================================================
# DATABASE
# ==================================================

try:
    init_db()
    print("Database berhasil diinisialisasi")
except Exception as e:
    print("Database error:", repr(e))


# ==================================================
# REGISTER AUTH
# ==================================================

app.register_blueprint(auth)


# ==================================================
# HOME
# ==================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "AI.Ind Backend Running",
        "message": "Backend siap digunakan"
    })


# ==================================================
# CHAT
# ==================================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "error": "Request body kosong"
            }), 400


        # =========================
        # DATA REQUEST
        # =========================

        pesan = data.get("message")
        user_id = data.get("user_id")
        chat_id = data.get("chat_id")


        # =========================
        # VALIDASI PESAN
        # =========================

        if not pesan or not str(pesan).strip():

            return jsonify({
                "error": "Pesan tidak boleh kosong"
            }), 400


        # =========================
        # VALIDASI LOGIN
        # =========================

        if not user_id:

            return jsonify({
                "error": "User belum login"
            }), 401


        try:
            user_id = int(user_id)
        except (ValueError, TypeError):

            return jsonify({
                "error": "User ID tidak valid"
            }), 400


        # =========================
        # DATABASE
        # =========================

        conn = get_connection()
        cursor = conn.cursor()


        # =========================
        # CEK USER
        # =========================

        cursor.execute(
            """
            SELECT id, nama, email, foto
            FROM users
            WHERE id=?
            """,
            (user_id,)
        )

        user = cursor.fetchone()


        if not user:

            conn.close()

            return jsonify({
                "error": "User tidak ditemukan"
            }), 404


        # =========================
        # CHAT BARU
        # =========================

        if not chat_id:

            title = str(pesan).strip()[:40]

            cursor.execute(
                """
                INSERT INTO chats
                (user_id, title)
                VALUES (?, ?)
                """,
                (
                    user_id,
                    title
                )
            )

            chat_id = cursor.lastrowid

            conn.commit()


        # =========================
        # VALIDASI CHAT ID
        # =========================

        try:
            chat_id = int(chat_id)
        except (ValueError, TypeError):

            conn.close()

            return jsonify({
                "error": "Chat ID tidak valid"
            }), 400


        # =========================
        # CEK CHAT MILIK USER
        # =========================

        cursor.execute(
            """
            SELECT id, user_id, title
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
                "error": "Chat tidak ditemukan atau bukan milik akun ini"
            }), 404


        # =========================
        # AMBIL HISTORY CHAT
        # =========================

        cursor.execute(
            """
            SELECT role, content
            FROM messages
            WHERE chat_id=?
            ORDER BY id ASC
            """,
            (chat_id,)
        )

        history = cursor.fetchall()

        conn.close()


        # =========================
        # UBAH HISTORY KE DICT
        # =========================

        history_data = []

        for item in history:

            role = item["role"]
            content = item["content"]

            if role not in ["user", "assistant"]:
                continue

            if not content:
                continue

            history_data.append({
                "role": role,
                "content": str(content)
            })


        # =========================
        # KIRIM KE AI
        # =========================

        jawaban = balas(
            str(pesan).strip(),
            history_data
        )


        # =========================
        # SIMPAN PESAN
        # =========================

        conn = get_connection()
        cursor = conn.cursor()


        # Pesan user
        cursor.execute(
            """
            INSERT INTO messages
            (chat_id, role, content)
            VALUES (?, ?, ?)
            """,
            (
                chat_id,
                "user",
                str(pesan).strip()
            )
        )


        # Jawaban AI
        cursor.execute(
            """
            INSERT INTO messages
            (chat_id, role, content)
            VALUES (?, ?, ?)
            """,
            (
                chat_id,
                "assistant",
                str(jawaban)
            )
        )


        conn.commit()
        conn.close()


        # =========================
        # RESPONSE
        # =========================

        return jsonify({

            "success": True,

            "reply": jawaban,

            "chat_id": chat_id,

            "user": {
                "id": user["id"],
                "nama": user["nama"],
                "email": user["email"],
                "foto": user["foto"]
            }

        })


    except Exception as e:

        print(
            "Chat Error:",
            repr(e)
        )

        return jsonify({
            "error": "Terjadi kesalahan server"
        }), 500


# ==================================================
# ERROR 404
# ==================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "Endpoint tidak ditemukan"
    }), 404


# ==================================================
# PYTHONANYWHERE / WSGI
# ==================================================

application = app


# ==================================================
# LOCAL
# ==================================================

if __name__ == "__main__":

    print(
        "🚀 AI.Ind Backend berjalan..."
    )

    app.run(
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=False
    )