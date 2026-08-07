import requests

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT
from memory import load_memory, add_message


def balas(pesan):

    if not API_KEY:
        return "API Key belum ditemukan."

    memory = load_memory()

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    messages.extend(memory)

    messages.append({
        "role": "user",
        "content": pesan
    })

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost",
        "X-Title": "AI.Ind"
    }

    data = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.7
    }

    try:

        response = requests.post(
            BASE_URL,
            headers=headers,
            json=data,
            timeout=60
        )

        if response.status_code != 200:
            return f"Error {response.status_code}\n{response.text}"

        hasil = response.json()

        # Cek apakah response AI memiliki jawaban
        if "choices" not in hasil:
            return f"Response AI tidak sesuai:\n{hasil}"

        jawaban = hasil["choices"][0]["message"]["content"]

        add_message("user", pesan)
        add_message("assistant", jawaban)

        return jawaban

    except requests.exceptions.Timeout:
        return "Waktu koneksi habis. Coba lagi beberapa saat."

    except requests.exceptions.ConnectionError:
        return "Tidak dapat terhubung ke internet."

    except Exception as e:
        return f"Terjadi kesalahan:\n{e}"