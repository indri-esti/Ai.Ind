import requests
import re
import time

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


# ==================================================
# MODEL VISION
# ==================================================

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


# ==================================================
# PENGATURAN TOKEN & HISTORY
# ==================================================

# Maksimal karakter history yang dikirim ke model.
# Chat yang tersimpan di frontend/database TIDAK dihapus.
MAX_HISTORY_CHARS = 12000

# Maksimal karakter untuk satu pesan history.
MAX_MESSAGE_CHARS = 4000

# Maksimal token jawaban AI.
MAX_OUTPUT_TOKENS = 700

# Jumlah percobaan ketika terkena rate limit.
MAX_RETRIES = 3

# Batas maksimal waktu tunggu retry.
MAX_RETRY_WAIT = 65


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

    teks = teks.replace("**", "")

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

    teks = re.sub(
        r"^\s*(Here is a thinking process:|Here is my thinking process:).*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # ==================================================
    # HAPUS TAG REASONING LAIN
    # ==================================================

    teks = re.sub(
        r"<analysis>.*?</analysis>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"<reasoning>.*?</reasoning>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    # ==================================================
    # RAPIKAN BARIS KOSONG
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

    # Groq menerima data URL:
    # data:image/jpeg;base64,xxxxx

    if not image.startswith("data:image/"):
        return None

    if ";base64," not in image:
        return None

    # Batas aman base64
    if len(image) > 5_500_000:
        raise ValueError(
            "Ukuran gambar terlalu besar. "
            "Kompres gambar terlebih dahulu."
        )

    return image


# ==================================================
# POTONG HISTORY UNTUK REQUEST SAJA
# ==================================================

def siapkan_history(history):

    if not isinstance(history, list):
        return []

    hasil = []
    total_chars = 0

    # Mulai dari pesan terbaru.
    # Kita ambil sebanyak mungkin tanpa melewati batas karakter.
    for item in reversed(history):

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in ["user", "assistant"]:
            continue

        if not content:
            continue

        content = str(content).strip()

        if not content:
            continue

        # Batasi satu pesan.
        if len(content) > MAX_MESSAGE_CHARS:
            content = content[:MAX_MESSAGE_CHARS] + "\n[Pesan dipersingkat untuk konteks AI]"

        tambahan = len(content)

        # Jangan sampai history terlalu besar.
        if total_chars + tambahan > MAX_HISTORY_CHARS:

            sisa = MAX_HISTORY_CHARS - total_chars

            if sisa > 200:
                content = content[:sisa]

                if role == "user":
                    hasil.append({
                        "role": role,
                        "content": content
                    })

            break

        hasil.append({
            "role": role,
            "content": content
        })

        total_chars += tambahan

    # Karena tadi diambil dari belakang,
    # balikan lagi ke urutan normal.
    hasil.reverse()

    return hasil


# ==================================================
# AMBIL WAKTU RETRY DARI GROQ
# ==================================================

def ambil_waktu_retry(teks):

    if not teks:
        return 5

    pola = [
        r"try again in\s+([\d.]+)s",
        r"retry after\s+([\d.]+)s",
        r"retry-after[:\s]+([\d.]+)"
    ]

    for pattern in pola:

        match = re.search(
            pattern,
            teks,
            flags=re.IGNORECASE
        )

        if match:

            try:
                waktu = float(match.group(1))

                return min(
                    max(waktu + 1, 2),
                    MAX_RETRY_WAIT
                )

            except ValueError:
                pass

    return 5


# ==================================================
# REQUEST KE GROQ
# ==================================================

def request_groq(
    headers,
    data
):

    for attempt in range(MAX_RETRIES):

        try:

            response = requests.post(
                BASE_URL,
                headers=headers,
                json=data,
                timeout=90
            )

            # ==========================================
            # BERHASIL
            # ==========================================

            if response.status_code == 200:
                return response

            # ==========================================
            # RATE LIMIT
            # ==========================================

            if response.status_code == 429:

                print(
                    f"Groq rate limit "
                    f"(percobaan {attempt + 1}/{MAX_RETRIES})"
                )

                print(
                    "RESPONSE:",
                    response.text
                )

                # Kalau masih ada kesempatan retry.
                if attempt < MAX_RETRIES - 1:

                    retry_seconds = ambil_waktu_retry(
                        response.text
                    )

                    print(
                        f"Menunggu "
                        f"{retry_seconds:.1f} detik..."
                    )

                    time.sleep(retry_seconds)

                    continue

                # Sudah habis retry.
                return response

            # ==========================================
            # ERROR LAIN
            # ==========================================

            return response

        except requests.exceptions.Timeout:

            if attempt < MAX_RETRIES - 1:

                print(
                    "Groq timeout. "
                    "Mencoba kembali..."
                )

                time.sleep(2)

                continue

            raise

        except requests.exceptions.ConnectionError:

            if attempt < MAX_RETRIES - 1:

                print(
                    "Koneksi ke Groq gagal. "
                    "Mencoba kembali..."
                )

                time.sleep(2)

                continue

            raise

    return None


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

    if not isinstance(history, list):
        history = []

    # ==================================================
    # VALIDASI GAMBAR
    # ==================================================

    try:

        image = validasi_gambar(image)

    except ValueError as e:

        return str(e)

    # ==================================================
    # SYSTEM PROMPT
    # ==================================================

    system_prompt = str(
        SYSTEM_PROMPT
    ).strip()

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    # ==================================================
    # HISTORY CHAT
    # ==================================================

    history_terbaru = siapkan_history(
        history
    )

    for item in history_terbaru:

        messages.append(item)

    # ==================================================
    # PESAN TERBARU
    # ==================================================

    pesan_text = ""

    if pesan is not None:
        pesan_text = str(pesan).strip()

    # Kalau pesan kosong tetapi ada gambar.
    if not pesan_text and image:

        pesan_text = (
            "Analisis gambar ini. "
            "Jelaskan apa yang terlihat "
            "dan bantu saya memahami gambar tersebut."
        )

    # Kalau benar-benar kosong.
    if not pesan_text and not image:

        return (
            "Silakan tulis pertanyaan atau pesan "
            "yang ingin kamu tanyakan."
        )

    # ==================================================
    # KONTEN USER
    # ==================================================

    if image:

        user_content = [

            {
                "type": "text",
                "text": pesan_text
            },

            {
                "type": "image_url",
                "image_url": {
                    "url": image
                }
            }

        ]

    else:

        user_content = pesan_text

    messages.append(
        {
            "role": "user",
            "content": user_content
        }
    )

    # ==================================================
    # PILIH MODEL
    # ==================================================

    if image:

        request_model = VISION_MODEL

    else:

        request_model = MODEL

    # ==================================================
    # HEADER GROQ
    # ==================================================

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # ==================================================
    # REQUEST DATA
    # ==================================================

    data = {
        "model": request_model,
        "messages": messages,

        # Lebih hemat token.
        "max_tokens": MAX_OUTPUT_TOKENS,

        # Jawaban tetap natural.
        "temperature": 0.4
    }

    # ==================================================
    # REQUEST KE GROQ
    # ==================================================

    try:

        response = request_groq(
            headers,
            data
        )

        # Tidak mendapatkan response.
        if response is None:

            return (
                "AI sedang mengalami gangguan "
                "koneksi. Silakan coba lagi."
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

            # ------------------------------------------
            # RATE LIMIT
            # ------------------------------------------

            if response.status_code == 429:

                return (
                    "AI sedang terlalu banyak menerima "
                    "permintaan. Tunggu sekitar satu menit "
                    "lalu coba lagi."
                )

            # ------------------------------------------
            # ERROR SERVER
            # ------------------------------------------

            if response.status_code >= 500:

                return (
                    "Server AI sedang mengalami gangguan. "
                    "Silakan coba lagi sebentar."
                )

            # ------------------------------------------
            # ERROR LAIN
            # ------------------------------------------

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
                "Respons dari AI tidak valid. "
                "Silakan coba lagi."
            )

        # ==================================================
        # CEK ERROR DARI API
        # ==================================================

        if isinstance(hasil, dict) and hasil.get("error"):

            print(
                "Groq API ERROR:",
                hasil["error"]
            )

            return (
                "AI sedang mengalami kendala. "
                "Silakan coba lagi."
            )

        # ==================================================
        # CHOICES
        # ==================================================

        choices = hasil.get("choices")

        if not choices:

            print(
                "Response AI tidak memiliki choices:",
                hasil
            )

            return (
                "AI belum memberikan jawaban. "
                "Silakan coba kirim pesan lagi."
            )

        # ==================================================
        # MESSAGE
        # ==================================================

        message = choices[0].get(
            "message",
            {}
        )

        if not isinstance(message, dict):

            print(
                "Message AI tidak valid:",
                message
            )

            return (
                "AI belum memberikan jawaban yang valid."
            )

        # ==================================================
        # CONTENT
        # ==================================================

        jawaban = message.get("content")

        # Beberapa model bisa memberikan content kosong.
        # Cek juga kemungkinan reasoning sebagai fallback.
        if not jawaban:

            reasoning = message.get("reasoning")

            if reasoning:
                jawaban = reasoning

        # ==================================================
        # VALIDASI JAWABAN
        # ==================================================

        if not jawaban:

            print(
                "Message lengkap dari Groq:",
                message
            )

            return (
                "Maaf, AI belum mendapatkan jawaban. "
                "Coba kirim pertanyaan lagi."
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
                "Maaf, AI belum mendapatkan jawaban. "
                "Coba kirim lagi ya."
            )

        # ==================================================
        # SELESAI
        # ==================================================

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
            "Tidak dapat terhubung ke server AI. "
            "Periksa koneksi internet atau backend."
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
            "memproses pesan. Silakan coba lagi."
        )