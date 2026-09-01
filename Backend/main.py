import requests
import re
import time
import base64

from config import API_KEY, BASE_URL, MODEL
from prompt import SYSTEM_PROMPT


# ==================================================
# MODEL VISION
# ==================================================
VISION_MODEL = "qwen/qwen3.6-27b"


# ==================================================
# PENGATURAN
# ==================================================
# History yang dikirim ke Groq.
# Tidak menghapus history di frontend/database.
MAX_HISTORY_CHARS = 12000

# Maksimal karakter satu pesan history.
MAX_MESSAGE_CHARS = 4000

# Maksimal token jawaban.
MAX_OUTPUT_TOKENS = 1200

# Maksimal percobaan request.
MAX_RETRIES = 3

# Jangan menunggu terlalu lama.
MAX_RETRY_WAIT = 65

# Maksimal ukuran data URL gambar.
# Sedikit di bawah batas request main.py agar aman.
MAX_IMAGE_CHARS = 5_500_000


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
    teks = teks.replace(
        "User Safety: safe",
        ""
    )

    teks = teks.replace(
        "Response Safety: safe",
        ""
    )

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
        raise ValueError(
            "Format gambar tidak valid."
        )

    image = image.strip()

    # Harus berupa Data URL gambar
    if not image.lower().startswith("data:image/"):
        raise ValueError(
            "Format gambar tidak valid. "
            "Gambar harus dikirim sebagai data URL."
        )

    # Harus mempunyai base64
    if ";base64," not in image.lower():
        raise ValueError(
            "Data gambar tidak menggunakan format Base64 yang valid."
        )

    # Pisahkan header dan data
    try:
        header, encoded = image.split(
            ",",
            1
        )
    except ValueError:
        raise ValueError(
            "Data gambar tidak valid."
        )

    # Validasi MIME type
    header_lower = header.lower()

    tipe_yang_didukung = (
        "data:image/jpeg;base64",
        "data:image/jpg;base64",
        "data:image/png;base64",
        "data:image/webp;base64",
        "data:image/gif;base64"
    )

    if not header_lower.startswith(
        tipe_yang_didukung
    ):
        raise ValueError(
            "Format gambar tidak didukung. "
            "Gunakan JPG, PNG, WEBP, atau GIF."
        )

    # Data Base64 tidak boleh kosong
    encoded = encoded.strip()

    if not encoded:
        raise ValueError(
            "Data gambar kosong."
        )

    # Validasi Base64
    try:
        base64.b64decode(
            encoded,
            validate=True
        )
    except Exception:
        raise ValueError(
            "Data gambar Base64 tidak valid."
        )

    # Batasi ukuran data URL
    if len(image) > MAX_IMAGE_CHARS:
        raise ValueError(
            "Ukuran gambar terlalu besar. "
            "Gunakan gambar maksimal sekitar 4 MB."
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

        if role not in [
            "user",
            "assistant"
        ]:
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

                    text_part = part.get(
                        "text",
                        ""
                    )

                    if text_part:
                        teks_parts.append(
                            str(text_part)
                        )

            content = "\n".join(
                teks_parts
            )

        content = str(
            content
        ).strip()

        if not content:
            continue

        # Batasi panjang pesan.
        if len(content) > MAX_MESSAGE_CHARS:

            content = (
                content[:MAX_MESSAGE_CHARS]
                + "\n[Pesan dipersingkat untuk konteks AI]"
            )

        tambahan = len(content)

        if (
            total_chars + tambahan
            > MAX_HISTORY_CHARS
        ):

            sisa = (
                MAX_HISTORY_CHARS
                - total_chars
            )

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
    retry_after = response.headers.get(
        "Retry-After"
    )

    if retry_after:

        try:

            waktu = float(
                retry_after
            )

            return min(
                max(waktu + 1, 2),
                MAX_RETRY_WAIT
            )

        except (
            ValueError,
            TypeError
        ):
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

                waktu = float(
                    match.group(1)
                )

                return min(
                    max(waktu + 1, 2),
                    MAX_RETRY_WAIT
                )

            except (
                ValueError,
                TypeError
            ):
                pass

    # Default
    return 5


# ==================================================
# REQUEST KE GROQ
# ==================================================
def request_groq(headers, data):

    for attempt in range(
        MAX_RETRIES
    ):

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

                if attempt < MAX_RETRIES - 1:

                    retry_seconds = (
                        ambil_waktu_retry(
                            response
                        )
                    )

                    print(
                        f"[Groq] Menunggu "
                        f"{retry_seconds:.1f} detik..."
                    )

                    time.sleep(
                        retry_seconds
                    )

                    continue

                return response

            # ==================================================
            # ERROR LAIN
            # ==================================================
            return response

        except requests.exceptions.Timeout:

            print(
                "[Groq] Timeout"
            )

            if attempt < MAX_RETRIES - 1:

                time.sleep(2)
                continue

            return None

        except requests.exceptions.ConnectionError:

            print(
                "[Groq] Connection Error"
            )

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

        print(
            "[Gambar] Validasi gagal:",
            str(e)
        )

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
    history_terbaru = (
        siapkan_history(
            history
        )
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
    if (
        not pesan_text
        and image
    ):

        pesan_text = (
            "Analisis gambar ini dan jelaskan "
            "apa yang terlihat dengan jelas."
        )

    # Kalau benar-benar kosong.
    if (
        not pesan_text
        and not image
    ):

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

    print(
        "[Groq] Model:",
        request_model
    )

    if image:

        print(
            "[Groq] Vision image: aktif"
        )

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
        "max_completion_tokens":
            MAX_OUTPUT_TOKENS,
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

            # Berikan pesan khusus untuk error gambar
            # supaya penyebab lebih mudah diketahui.
            if image and response.status_code == 400:

                return (
                    "Gambar tidak dapat diproses oleh "
                    "model AI. Pastikan gambar berupa "
                    "JPG, PNG, WEBP, atau GIF lalu coba lagi."
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
        if isinstance(
            hasil,
            dict
        ):

            if hasil.get("error"):

                print(
                    "========== GROQ API ERROR =========="
                )

                print(
                    hasil["error"]
                )

                print(
                    "===================================="
                )

                error_data = hasil.get(
                    "error"
                )

                if isinstance(
                    error_data,
                    dict
                ):

                    error_message = str(
                        error_data.get(
                            "message",
                            ""
                        )
                    ).lower()

                    # Error khusus model vision
                    if image and (
                        "image" in error_message
                        or "vision" in error_message
                        or "model" in error_message
                    ):

                        return (
                            "Model AI tidak dapat memproses "
                            "gambar tersebut. Coba gunakan "
                            "gambar JPG atau PNG yang lebih kecil."
                        )

                return (
                    "AI sedang mengalami kendala. "
                    "Silakan coba lagi."
                )

        # ==================================================
        # CHOICES
        # ==================================================
        choices = hasil.get(
            "choices"
        )

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

        if not isinstance(
            message,
            dict
        ):

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

        # ==================================================
        # JIKA CONTENT KOSONG
        # ==================================================
        if not jawaban:

            print(
                "========== GROQ CONTENT KOSONG =========="
            )

            print(
                "Message lengkap dari Groq:",
                message
            )

            print(
                "Full response:",
                hasil
            )

            print(
                "=========================================="
            )

            return (
                "Maaf, AI belum mendapatkan jawaban. "
                "Coba kirim lagi ya."
            )

        # ==================================================
        # CONTENT BISA BERUPA LIST
        # ==================================================
        if isinstance(
            jawaban,
            list
        ):

            teks_parts = []

            for part in jawaban:

                if isinstance(
                    part,
                    dict
                ):

                    if part.get("type") == "text":

                        text = part.get(
                            "text",
                            ""
                        )

                        if text:
                            teks_parts.append(
                                str(text)
                            )

                    elif part.get("text"):

                        teks_parts.append(
                            str(
                                part.get(
                                    "text"
                                )
                            )
                        )

                elif isinstance(
                    part,
                    str
                ):

                    teks_parts.append(
                        part
                    )

            jawaban = "\n".join(
                teks_parts
            )

        # Jangan menggunakan reasoning sebagai jawaban.
        jawaban = str(
            jawaban
        ).strip()

        # ==================================================
        # BERSIHKAN
        # ==================================================
        jawaban = (
            bersihkan_jawaban(
                jawaban
            )
        )

        # ==================================================
        # CEK HASIL AKHIR
        # ==================================================
        if not jawaban:

            print(
                "Jawaban kosong setelah dibersihkan."
            )

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
            "Terjadi kesalahan saat menghubungi AI. "
            "Silakan coba lagi."
        )

    # ==================================================
    # ERROR UMUM
    # ==================================================
    except Exception as e:

        print(
            "Groq Unexpected Error:",
            repr(e)
        )

        return (
            "Terjadi kesalahan saat memproses "
            "permintaan AI. Silakan coba lagi."
        )

