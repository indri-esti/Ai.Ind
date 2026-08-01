import requests

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


def balas(pesan):

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost",
        "X-Title": "AI.Ind"
    }

    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": pesan
            }
        ]
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

        return hasil["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        return "Waktu koneksi habis. Coba lagi beberapa saat."

    except requests.exceptions.ConnectionError:
        return "Tidak dapat terhubung ke internet."

    except Exception as e:
        return f"Terjadi kesalahan:\n{e}"