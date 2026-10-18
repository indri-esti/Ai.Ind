# ==================================================
# main.py  -  SERVER UTAMA AI.Ind (Flask)
#
# - Menjalankan server dan mendaftarkan login/register/chats (auth.py)
# - Menyediakan POST /chat yang memanggil ai.py (versi baru)
# - Route tersedia di dua alamat sekaligus: /chat dan /api/chat
#   (begitu juga /login, /api/login, dst), jadi tetap jalan
#   apa pun baseURL di frontend.
# ==================================================

import os
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS

from database import get_connection, init_db
from auth import auth
from ai import balas


# ==================================================
# APP
# ==================================================

app = Flask(__name__)

# Foto sudah dikompres di frontend, tapi beri ruang aman.
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

CORS(app, resources={r"/*": {"origins": "*"}})

try:
    init_db()
except Exception as e:
    print("[DB] init_db gagal:", repr(e))

# Didaftarkan dua kali: tanpa prefix dan dengan /api
app.register_blueprint(auth, name="auth_root")
app.register_blueprint(auth, url_prefix="/api", name="auth_api")


# ==================================================
# KONFIGURASI CHAT
# ==================================================

# Jumlah pesan terakhir yang dikirim ke AI sebagai konteks
MAKS_PESAN_KONTEKS = 20


def buat_judul(pesan):
    judul = " ".join(str(pesan or "").split())[:80]
    return judul or "Percakapan baru"


# ==================================================
# HEALTH CHECK
# ==================================================

@app.route("/", methods=["GET"])
@app.route("/api", methods=["GET"])
def home():
    return jsonify({"success": True, "message": "AI.Ind backend aktif."})


# ==================================================
# CHAT
# ==================================================

@app.route("/chat", methods=["POST"])
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    pesan = str(data.get("message") or "").strip()
    image = data.get("image") or None

    # ---------- user_id ----------
    try:
        user_id = int(data.get("user_id"))
    except (TypeError, ValueError):
        user_id = 0

    if user_id <= 0:
        return jsonify({
            "success": False,
            "error": "user_id tidak valid. Silakan login ulang."
        }), 400

    if not pesan and not image:
        return jsonify({
            "success": False,
            "error": "Pesan kosong. Tulis pertanyaan atau kirim gambar."
        }), 400

    # ---------- chat_id ----------
    try:
        chat_id = int(data.get("chat_id")) if data.get("chat_id") else None
    except (TypeError, ValueError):
        chat_id = None

    # ---------- 1. siapkan chat + ambil riwayat ----------
    history = []

    try:
        conn = get_connection()

        try:
            cursor = conn.cursor()

            if chat_id:
                cursor.execute(
                    "SELECT id FROM chats WHERE id=? AND user_id=?",
                    (chat_id, user_id),
                )

                if not cursor.fetchone():
                    # Chat sudah dihapus / bukan milik user: mulai chat baru
                    chat_id = None

            if not chat_id:
                cursor.execute(
                    "INSERT INTO chats(user_id, title) VALUES(?,?)",
                    (user_id, buat_judul(pesan or "Analisis gambar")),
                )
                conn.commit()
                chat_id = cursor.lastrowid
            else:
                cursor.execute(
                    """
                    SELECT role, content
                    FROM messages
                    WHERE chat_id=?
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (chat_id, MAKS_PESAN_KONTEKS),
                )

                baris = cursor.fetchall()

                history = [
                    {"role": r["role"], "content": r["content"]}
                    for r in reversed(baris)
                ]
        finally:
            conn.close()

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Gagal mengakses database: {e}"
        }), 500

    # ---------- 2. panggil AI (di luar koneksi DB) ----------
    try:
        jawaban = balas(pesan, history, image, user_id)
    except Exception as e:
        traceback.print_exc()
        jawaban = (
            "Terjadi kesalahan di server saat memproses pesanmu. "
            "Coba kirim ulang."
        )

    if not jawaban:
        jawaban = "AI tidak memberikan jawaban. Coba kirim ulang."

    # ---------- 3. simpan pesan ----------
    try:
        conn = get_connection()

        try:
            cursor = conn.cursor()

            teks_user = pesan or "Tolong analisis gambar ini."

            cursor.execute(
                "INSERT INTO messages(chat_id, role, content) VALUES(?,?,?)",
                (chat_id, "user", teks_user),
            )

            cursor.execute(
                "INSERT INTO messages(chat_id, role, content) VALUES(?,?,?)",
                (chat_id, "assistant", jawaban),
            )

            conn.commit()
        finally:
            conn.close()

    except Exception:
        # Gagal menyimpan tidak boleh menggagalkan jawaban
        traceback.print_exc()

    return jsonify({
        "success": True,
        "reply": jawaban,
        "chat_id": chat_id,
    })


# ==================================================
# ERROR HANDLER
# ==================================================

@app.errorhandler(413)
def terlalu_besar(e):
    return jsonify({
        "success": False,
        "error": "Ukuran data terlalu besar. Coba gambar yang lebih kecil."
    }), 413


# ==================================================
# JALANKAN LANGSUNG (python main.py)
# ==================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
