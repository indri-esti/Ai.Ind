import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from ai import balas
from auth import auth
from database import init_db


app = Flask(__name__)

CORS(app)


try:
    init_db()
    print("Database berhasil diinisialisasi")
except Exception as e:
    print("Database error:", e)


# Register Auth
app.register_blueprint(auth)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "AI.Ind Backend Running",
        "message": "Backend siap digunakan"
    })


@app.route("/chat", methods=["POST"])
def chat():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body kosong"
            }), 400

        pesan = data.get("message")

        if not pesan or pesan.strip() == "":
            return jsonify({
                "error": "Pesan tidak boleh kosong"
            }), 400

        jawaban = balas(pesan.strip())

        return jsonify({
            "reply": jawaban
        })

    except Exception as e:

        print("Chat Error:", e)

        return jsonify({
            "error": "Terjadi kesalahan server"
        }), 500


@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "Endpoint tidak ditemukan"
    }), 404


if __name__ == "__main__":

    print("🚀 AI.Ind Backend berjalan...")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )