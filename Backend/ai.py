limport requests
import re
import time

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


# ==================================================
# MODEL VISION
# ==================================================

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


# ==================================================
# PENGATURAN
# ==================================================

# History yang dikirim ke Groq.
# Tidak menghapus history di frontend/database.
MAX_HISTORY_CHARS = 12000

# Maksimal karakter satu pesan history.
MAX_MESSAGE_CHARS = 4000

# Sebelumnya 700 sehingga jawaban mudah terpotong.
MAX_OUTPUT_TOKENS = 1200

# Maksimal percobaan request.
MAX_RETRIES = 3

# Jangan menunggu terlalu lama.
MAX_RETRY_WAIT = 65


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def bersihkan_jawaban(teks):

    if not teks:
        return ""

    teks = str(teks)

    # Hapus think/reasoning tags
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

    # Hapus heading markdown
    teks = re.sub(
        r"^\s*#{1,6}\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hapus blockquote
    teks = re.sub(
        r"^\s*>\s?",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hapus bold
    teks = teks.replace("**", "")

    # Hapus italic markdown pada bullet
    teks = re.sub(
        r"^\s*\*\s+",
        "",
        teks,
        flags=re.MULTILINE
    )

    # Hapus informasi safety
    teks = teks.replace("User Safety: safe", "")
    teks = teks.replace("Response Safety: safe", "")

    # Hapus phrase thinking
    teks = re.sub(
        r"^\s*(Here's a thinking process:|Heres a thinking process:).*$",
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

    # Hapus reasoning tag
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

    # Rapikan baris kosong
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

    if not image.startswith("data:image/"):
        return None

    if ";base64," not in image:
        return None

    if len(image) > 5_500_000:
        raise ValueError(
            "Ukuran gambar terlalu besar. "
            "Kompres gambar terlebih dahulu."
        )

    return image


# ==================================================
# SIAPKAN HISTORY
# ==================================================

def siapkan_history(history):

    if not isinstance(history, list):
        return []

    hasil = []
    total_chars = 0

    for item in reversed(history):

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in ["user", "assistant"]:
            continue

        if not content:
            continue

        # History gambar tidak dikirim kembali sebagai gambar.
        # Hanya ambil teksnya.
        if isinstance(content, list):

            teks_parts = []

            for part in content:

                if not isinstance(part, dict):
                    continue

                if part.get("type") == "text":

                    text_part = part.get("text", "")

                    if text_part:
                        teks_parts.append(str(text_part))

            content = "\n".join(teks_parts)

        content = str(content).strip()

        if not content:
            continue

        # Batasi panjang pesan.
        if len(content) > MAX_MESSAGE_CHARS:

            content = (
                content[:MAX_MESSAGE_CHARS]
                + "\n[Pesan dipersingkat untuk konteks AI]"
            )

        tambahan = len(content)

        if total_chars + tambahan > MAX_HISTORY_CHARS:

            sisa = MAX_HISTORY_CHARS - total_chars

            if sisa > 200:

                content = content[:sisa]

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

    # Kembalikan ke urutan normal.
    hasil.reverse()

    return hasil


# ==================================================
# AMBIL WAKTU RETRY
# ==================================================

def ambil_waktu_retry(response):

    """
    Mengambil waktu tunggu dari header Retry-After
    atau pesan error Groq.
    """

    if response is None:
        return 5

    # --------------------------------------------------
    # COBA HEADER Retry-After
    # --------------------------------------------------

    retry_after = response.headers.get("Retry-After")

    if retry_after:

        try:

            waktu = float(retry_after)

            return min(
                max(waktu + 1, 2),
                MAX_RETRY_WAIT
            )

        except (ValueError, TypeError):
            pass

    # --------------------------------------------------
    # COBA RESPONSE TEXT
    # --------------------------------------------------

    teks = response.text or ""

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

            except (ValueError, TypeError):
                pass

    # Default
    return 5


# ==================================================
# REQUEST KE GROQ
# ==================================================

def request_groq(headers, data):

    for attempt in range(MAX_RETRIES):

        try:

            response = requests.post(
                BASE_URL,
                headers=headers,
                json=data,
                timeout=90
            )

            # ==================================================
            # BERHASIL
            # ==================================================

            if response.status_code == 200:

                return response

            # ==================================================
            # RATE LIMIT 429
            # ==================================================

            if response.status_code == 429:

                print(
                    f"[Groq] Rate limit "
                    f"percobaan {attempt + 1}/{MAX_RETRIES}"
                )

                print(
                    "[Groq] Response:",
                    response.text
                )

                # Kalau masih ada kesempatan.
                if attempt < MAX_RETRIES - 1:

                    retry_seconds = ambil_waktu_retry(
                        response
                    )

                    print(
                        f"[Groq] Menunggu "
                        f"{retry_seconds:.1f} detik..."
                    )

                    time.sleep(retry_seconds)

                    continue

                # Jangan retry lagi.
                return response

            # ==================================================
            # ERROR LAIN
            # ==================================================

            return response

        except requests.exceptions.Timeout:

            print("[Groq] Timeout")

            if attempt < MAX_RETRIES - 1:

                time.sleep(2)
                continue

            return None

        except requests.exceptions.ConnectionError:

            print("[Groq] Connection Error")

            if attempt < MAX_RETRIES - 1:

                time.sleep(2)
                continue

            return None

        except requests.exceptions.RequestException as e:

            print(
                "[Groq] Request Error:",
                repr(e)
            )

            return None

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
    # API KEY
    # ==================================================

    if not API_KEY:

        return (
            "API Key Groq belum ditemukan. "
            "Pastikan GROQ_API_KEY sudah tersedia "
            "di Backend/.env."
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
    # HISTORY
    # ==================================================

    history_terbaru = siapkan_history(
        history
    )

    messages.extend(
        history_terbaru
    )

    # ==================================================
    # PESAN
    # ==================================================

    pesan_text = ""

    if pesan is not None:

        pesan_text = str(
            pesan
        ).strip()

    # Kalau hanya gambar.
    if not pesan_text and image:

        pesan_text = (
            "Analisis gambar ini dan jelaskan "
            "apa yang terlihat dengan jelas."
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
    # MODEL
    # ==================================================

    if image:

        request_model = VISION_MODEL

    else:

        request_model = MODEL

    # ==================================================
    # HEADER
    # ==================================================

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # ==================================================
    # DATA REQUEST
    # ==================================================

    data = {
        "model": request_model,
        "messages": messages,

        # Naikkan supaya jawaban tidak mudah terpotong.
        "max_tokens": MAX_OUTPUT_TOKENS,

        # Jawaban natural.
        "temperature": 0.4
    }

    # ==================================================
    # REQUEST
    # ==================================================

    try:

        response = request_groq(
            headers,
            data
        )

        # ==================================================
        # TIDAK ADA RESPONSE
        # ==================================================

        if response is None:

            return (
                "AI sedang mengalami gangguan koneksi. "
                "Silakan coba lagi."
            )

        # ==================================================
        # RATE LIMIT
        # ==================================================

        if response.status_code == 429:

            print(
                "========== GROQ RATE LIMIT =========="
            )

            print(
                response.text
            )

            print(
                "====================================="
            )

            # PENTING:
            # Jangan lempar error 429 ke frontend.
            return (
                "AI sedang sibuk karena terlalu banyak "
                "permintaan. Tunggu sebentar lalu kirim "
                "pesan lagi ya."
            )

        # ==================================================
        # SERVER ERROR
        # ==================================================

        if response.status_code >= 500:

            print(
                "========== GROQ SERVER ERROR =========="
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
                "========================================"
            )

            return (
                "Server AI sedang mengalami gangguan. "
                "Silakan coba lagi sebentar."
            )

        # ==================================================
        # ERROR CLIENT LAIN
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
                "AI tidak dapat memproses permintaan "
                "saat ini. Silakan coba lagi."
            )

        # ==================================================
        # PARSE JSON
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
        # ERROR DARI API
        # ==================================================

        if isinstance(hasil, dict):

            if hasil.get("error"):

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

        jawaban = message.get(
            "content"
        )

        # Jangan menggunakan reasoning sebagai jawaban.
        # Reasoning bukan jawaban final untuk pengguna.

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
        # BERSIHKAN
        # ==================================================

        jawaban = bersihkan_jawaban(
            jawaban
        )

        # ==================================================
        # CEK HASIL AKHIR
        # ==================================================

        if not jawaban:

            return (
                "Maaf, AI belum mendapatkan jawaban. "
                "Coba kirim lagi ya."
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
            "Tidak dapat terhubung ke server AI. "
            "Periksa koneksi internet atau backend."
        )

    # ==================================================
    # REQUEST ERROR
    # ==================================================

    except requests.exceptions.RequestException as e:

        print(
            "Groq Request Exception:",
            repr(e)
        )

        return (
            "Koneksi ke server AI mengalami masalah. "
            "Silakan coba lagi."
        )

    # ==================================================
    # ERROR UMUM
    # ==================================================

    except Exception as e:

        print(
            "AI Error:",
            repr(e)
        )

        return (
            "Terjadi kesalahan saat memproses pesan. "
            "Silakan coba lagi."
        )