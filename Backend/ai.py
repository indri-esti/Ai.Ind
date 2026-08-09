import requests
import re

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def bersihkan_jawaban(teks):

    if not teks:
        return ""

    teks = str(teks)

    # Hilangkan heading Markdown
    teks = re.sub(
        r"^\s*#{1,6}\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hilangkan blockquote
    teks = re.sub(
        r"^\s*>\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hilangkan bold
    teks = teks.replace(
        "**",
        ""
    )

    # Hilangkan italic pada bullet
    teks = re.sub(
        r"^\s*\*\s+",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hilangkan informasi safety
    teks = teks.replace(
        "User Safety: safe",
        ""
    )

    teks = teks.replace(
        "Response Safety: safe",
        ""
    )

    # Rapikan baris kosong
    teks = re.sub(
        r"\n{3,}",
        "\n\n",
        teks
    )

    return teks.strip()


# ==================================================
# BALAS AI
# ==================================================

def balas(pesan, history=None):

    # ==================================================
    # CEK API KEY
    # ==================================================

    if not API_KEY:

        return (
            "API Key Groq belum ditemukan. "
            "Pastikan GROQ_API_KEY sudah ada "
            "di file Backend/.env."
        )


    # ==================================================
    # HISTORY
    # ==================================================

    if not isinstance(history, list):

        history = []


    # ==================================================
    # SYSTEM PROMPT
    # ==================================================

    messages = [
        {
            "role": "system",
            "content": str(SYSTEM_PROMPT)
        }
    ]


    # ==================================================
    # HISTORY CHAT
    # ==================================================

    for item in history:

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")


        if role not in [
            "user",
            "assistant"
        ]:
            continue


        if not content:
            continue


        messages.append({
            "role": role,
            "content": str(content)
        })


    # ==================================================
    # PESAN TERBARU
    # ==================================================

    messages.append({
        "role": "user",
        "content": str(pesan)
    })


    # ==================================================
    # HEADER GROQ
    # ==================================================

    headers = {

        "Authorization":
            f"Bearer {API_KEY}",

        "Content-Type":
            "application/json"
    }


    # ==================================================
    # REQUEST DATA
    # ==================================================

    data = {

        "model":
            MODEL,

        "messages":
            messages,

        "max_tokens":
            1200,

        "temperature":
            0.7
    }


    # ==================================================
    # REQUEST KE GROQ
    # ==================================================

    try:

        response = requests.post(

            BASE_URL,

            headers=headers,

            json=data,

            timeout=90
        )


        # ==================================================
        # CEK STATUS
        # ==================================================

        if response.status_code != 200:

            print(
                "========== GROQ ERROR =========="
            )

            print(
                "STATUS:",
                response.status_code
            )

            print(
                "RESPONSE:",
                response.text
            )

            print(
                "================================"
            )

            return (
                f"Groq error HTTP "
                f"{response.status_code}: "
                f"{response.text[:500]}"
            )


        # ==================================================
        # PARSE RESPONSE
        # ==================================================

        try:

            hasil = response.json()

        except ValueError:

            print(
                "Response Groq bukan JSON:",
                response.text
            )

            return (
                "Response dari AI tidak valid."
            )


        # ==================================================
        # CHOICES
        # ==================================================

        choices = hasil.get(
            "choices"
        )


        if not choices:

            print(
                "Response AI tidak memiliki "
                "choices:",
                hasil
            )

            return (
                "AI tidak memberikan jawaban. "
                "Coba kirim pesan lagi."
            )


        # ==================================================
        # MESSAGE
        # ==================================================

        message = choices[0].get(
            "message"
        )


        if not message:

            print(
                "Response AI tidak memiliki "
                "message:",
                hasil
            )

            return (
                "AI tidak memberikan jawaban "
                "yang valid."
            )


        # ==================================================
        # CONTENT
        # ==================================================

        jawaban = message.get(
            "content"
        )


        if (
            not jawaban
            or not str(jawaban).strip()
        ):

            return (
                "Maaf, aku belum mendapatkan "
                "jawaban. Coba kirim pertanyaan lagi."
            )


        jawaban = str(
            jawaban
        ).strip()


        # ==================================================
        # BERSIHKAN JAWABAN
        # ==================================================

        jawaban = bersihkan_jawaban(
            jawaban
        )


        if not jawaban:

            return (
                "Maaf, aku belum mendapatkan "
                "jawaban. Coba kirim lagi ya."
            )


        return jawaban


    # ==================================================
    # TIMEOUT
    # ==================================================

    except requests.exceptions.Timeout:

        print(
            "Groq request timeout"
        )

        return (
            "Waktu respons AI terlalu lama. "
            "Coba kirim pertanyaan lagi."
        )


    # ==================================================
    # CONNECTION ERROR
    # ==================================================

    except requests.exceptions.ConnectionError:

        print(
            "Groq Connection Error"
        )

        return (
            "Tidak dapat terhubung ke "
            "server Groq. Periksa koneksi "
            "internet atau backend."
        )


    # ==================================================
    # ERROR LAIN
    # ==================================================

    except Exception as e:

        print(
            "AI Error:",
            repr(e)
        )

        return (
            "Terjadi kesalahan saat "
            "memproses pesan."
        )