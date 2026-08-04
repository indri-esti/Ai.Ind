from flask import Flask, request, jsonify
from flask_cors import CORS

from ai import balas
from memory import load_memory, save_memory

app = Flask(__name__)
CORS(app)

memory = load_memory()


@app.route("/")
def home():
    return {
        "status": "AI.Ind Backend Running"
    }


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    pesan = data.get("message", "").strip()

    if pesan == "":
        return jsonify({
            "reply": "Pesan tidak boleh kosong."
        }), 400

    jawaban = balas(pesan)

    memory.append({
        "kamu": pesan,
        "ai": jawaban
    })

    save_memory(memory)

    return jsonify({
        "reply": jawaban
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )