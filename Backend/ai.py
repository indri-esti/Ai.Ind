import requests
import re
import time


from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


# ==================================================
# MODEL VISION
# ==================================================

VISION_MODEL = (
    "meta-llama/llama-4-scout-17b-16e-instruct"
)


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def bersihkan_jawaban(teks):

    if not teks:
        return ""

    teks = str(teks)

    # ==================================================
    # HAPUS THINK / REASONING
    # ==================================================

    teks = re.sub(
        r"<think>.*?</think>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"<think>.*$",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"</think>",
        "",
        teks,
        flags=re.IGNORECASE
    )

    # ==================================================
    # HAPUS HEADING MARKDOWN
    # ==================================================

    teks = re.sub(
        r"^\s*#{1,6}\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # ==================================================
    # HAPUS BLOCKQUOTE
    # ==================================================

    teks = re.sub(
        r"^\s*>\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # ==================================================
    # HAPUS BOLD
    # ==================================================

    teks = teks.replace(
        "**",
        ""
    )

    # ==================================================
    # HAPUS ITALIC PADA BULLET
    # ==================================================

    teks = re.sub(
        r"^\s*\*\s+",
        "",
        teks,
        flags=re.MULTILINE
    )

    # ==================================================
    # HAPUS INFORMASI SAFETY
    # ==================================================

    teks = teks.replace(
        "User Safety: safe",
        ""
    )

    teks = teks.replace(
        "Response Safety: safe",
        ""
    )

    # ==================================================
    # HAPUS PHRASE THINKING
    # ==================================================

    teks = re.sub(
        r"^\s*(Heres a thinking process:|Here's a thinking process:).*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # ==================================================
    # HAPUS PHRASE THINKING LAIN
    # ==================================================

    teks = re.sub(
        r"^\s*(Here is a thinking process:|Here is my thinking process:).*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # ==================================================
    # RAPikan BARIS KOSONG
    # ==================================================

    teks = re.sub(
        r"\n{3,}",
        "\n\n",
        teks
    )

    return teks.strip()


# ==================================================
# VALIDASI GAMBAR
# ==================================================

def validasi_gambar(image):

    if not image:
        return None

    if not isinstance(image, str):
        return None

    image = image.strip()

    # Groq menerima data URL seperti:
    # data:image/jpeg;base64,xxxxx

    if not image.startswith(
        "data:image/"
    ):
        return None

    if ";base64," not in image:
        return None

    # Batas aman untuk Base64.
    # Groq mendokumentasikan batas sekitar 4 MB
    # untuk base64 image.

    if len(image) > 5_500_000:

        raise ValueError(
            "Ukuran gambar terlalu besar. "
            "Kompres gambar terlebih dahulu."
        )

    return image


# ==================================================
# BALAS AI
# ==================================================

def balas(
    pesan,
    history=None,
    image=None
):

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

    if not isinstance(
        history,
        list
    ):

        history = []

    # ==================================================
    # VALIDASI GAMBAR
    # ==================================================

    try:

        image = validasi_gambar(
            image
        )

    except ValueError as e:

        return str(e)

    # ==================================================
    # SYSTEM PROMPT
    # ==================================================

    messages = [

        {
            "role":
                "system",

            "content":
                str(
                    SYSTEM_PROMPT
                )
        }

    ]

    # ==================================================
    # HISTORY CHAT
    # ==================================================

    # Hanya kirim 6 pesan terakhir ke model.
    # Riwayat lengkap tetap tersimpan di database.
    # Ini mencegah penggunaan token membengkak.
    history_terbaru = history[-6:]

    for item in history_terbaru:

        if not isinstance(
            item,
            dict
        ):

            continue

        role = item.get(
            "role"
        )

        content = item.get(
            "content"
        )

        if role not in [
            "user",
            "assistant"
        ]:

            continue

        if not content:

            continue

        messages.append({

            "role":
                role,

            "content":
                str(content)

        })

    # ==================================================
    # PESAN TERBARU
    # ==================================================

    if image:

        user_content = [

            {
                "type":
                    "text",

                "text":
                    (
                        str(
                            pesan
                        ).strip()

                        if pesan
                        and str(
                            pesan
                        ).strip()

                        else

                        "Analisis gambar ini. "
                        "Jelaskan secara singkat "
                        "apa yang terlihat pada gambar."
                    )
            },

            {
                "type":
                    "image_url",

                "image_url":
                    {
                        "url":
                            image
                    }
            }

        ]

    else:

        user_content = (
            str(pesan).strip()
        )

    messages.append({

        "role":
            "user",

        "content":
            user_content

    })

    # ==================================================
    # PILIH MODEL
    # ==================================================

    if image:

        request_model = (
            VISION_MODEL
        )

    else:

        request_model = MODEL

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
            request_model,

        "messages":
            messages,

        "max_tokens":
            500,

        "temperature":
            0.4
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
        # RATE LIMIT 429
        # ==================================================

        if response.status_code == 429:

            print(
                "========== GROQ RATE LIMIT =========="
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
                "======================================"
            )

            # Coba membaca waktu tunggu dari
            # response Groq.
            retry_seconds = 5

            match = re.search(
                r"try again in\s+([\d.]+)s",
                response.text,
                flags=re.IGNORECASE
            )

            if match:

                try:

                    retry_seconds = float(
                        match.group(1)
                    )

                except ValueError:

                    retry_seconds = 5

            # Jangan menunggu terlalu lama.
            retry_seconds = min(
                max(
                    retry_seconds,
                    1
                ),
                10
            )

            print(
                f"Groq rate limit. "
                f"Menunggu {retry_seconds:.1f} detik..."
            )

            time.sleep(
                retry_seconds
            )

            # Coba sekali lagi.
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

            if response.status_code == 429:

                return (
                    "Groq sedang mencapai batas "
                    "penggunaan token. Tunggu beberapa "
                    "detik lalu coba lagi."
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
            or not str(
                jawaban
            ).strip()
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