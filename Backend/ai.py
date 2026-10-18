import base64
import io
import os
import re
import time
from datetime import datetime, timedelta, timezone

import requests

from config import (
    API_KEY,
    BASE_URL,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    MODEL,
    VISION_MODEL,
)

from prompt import SYSTEM_PROMPT

try:
    from memory import get_memory_context
except Exception:
    get_memory_context = None

try:
    from PIL import Image, ImageOps
except Exception:
    Image = None
    ImageOps = None


# ==================================================
# KONFIGURASI
# ==================================================

MAX_HISTORY_CHARS = 20000
MAX_MESSAGE_CHARS = 6000
MAX_OUTPUT_TOKENS = 4096
MAX_RETRIES = 2
MAX_RETRY_WAIT = 20
REQUEST_TIMEOUT = 120
MAX_MEMORY_CONTEXT_CHARS = 8000

# Batas Groq untuk gambar base64 = 4MB. Sisakan margin.
MAX_IMAGE_B64_CHARS = 3_900_000
MAX_IMAGE_SIDE = 1600

# Model cadangan. Tiap model punya limit sendiri, jadi kalau
# satu kena limit / error, otomatis pindah ke berikutnya.
FALLBACK_TEXT_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
]

FALLBACK_VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
]

WIB = timezone(timedelta(hours=7))

INSTRUKSI_TAMBAHAN = """
ATURAN KERJA TAMBAHAN:
- Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia).
- Jawab dengan benar dan teliti. Jika tidak yakin, katakan apa yang belum pasti, jangan mengarang.
- Jika pengguna mengirim gambar, analisis isi gambar secara nyata: objek, teks (baca/OCR), angka, tabel, grafik, soal, kode, error, dokumen. Jawab pertanyaan berdasarkan gambar. Jika ada bagian yang buram atau tidak terbaca, sebutkan bagian itu.
- Jika soal ada di gambar, kerjakan soalnya langkah demi langkah dan beri jawaban akhir yang jelas.
- Jika informasi kurang, ajukan satu atau dua pertanyaan balik yang spesifik sebelum menjawab panjang.
- Untuk permainan, kuis, latihan, atau tanya jawab interaktif: ajukan pertanyaan ke pengguna, tunggu jawabannya, nilai jawabannya, lalu lanjutkan ke langkah berikutnya sesuai alur percakapan. Ingat konteks sebelumnya.
- Jangan menulis ulang lirik lagu utuh atau teks berhak cipta panjang. Untuk permainan lirik, beri petunjuk, tebak-tebakan, atau minta pengguna yang menulis, lalu tanggapi.
- Jangan pernah menjawab dengan kalimat kosong seperti "AI tidak merespon". Selalu beri jawaban berguna.
"""


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def bersihkan_jawaban(teks):
    if teks is None:
        return ""

    if not isinstance(teks, str):
        teks = str(teks)

    teks = re.sub(r"<think>.*?</think>", "", teks, flags=re.DOTALL | re.IGNORECASE)
    teks = re.sub(r"<think>.*$", "", teks, flags=re.DOTALL | re.IGNORECASE)
    teks = re.sub(r"</think>", "", teks, flags=re.IGNORECASE)

    teks = re.sub(r"<analysis>.*?</analysis>", "", teks, flags=re.DOTALL | re.IGNORECASE)
    teks = re.sub(r"<reasoning>.*?</reasoning>", "", teks, flags=re.DOTALL | re.IGNORECASE)

    teks = re.sub(
        r"^\s*(thinking process|chain of thought|internal reasoning|internal analysis)\s*:?.*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE,
    )

    teks = re.sub(
        r"^\s*(User Safety|Response Safety)\s*:\s*safe\s*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE,
    )

    teks = re.sub(r"\n{3,}", "\n\n", teks)

    return teks.strip()


# ==================================================
# EKSTRAK CONTENT
# ==================================================

def ekstrak_teks_content(content):
    if content is None:
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        bagian = []

        for part in content:
            if isinstance(part, str):
                bagian.append(part)
                continue

            if not isinstance(part, dict):
                continue

            part_type = part.get("type") or ""

            if part_type in ("text", "output_text"):
                value = part.get("text") or ""
                if value:
                    bagian.append(str(value))

            elif part_type == "image_url":
                bagian.append("[Pengguna mengirim sebuah gambar]")

        return "\n".join(bagian).strip()

    return ""


# ==================================================
# GAMBAR
# ==================================================

DATA_URL_RE = re.compile(
    r"^data:(image/(?:jpeg|jpg|png|webp|gif));base64,(.*)$",
    re.IGNORECASE | re.DOTALL,
)


def kompres_gambar(raw):
    """Kecilkan & ubah ke JPEG agar aman dikirim ke API. Return (bytes, mime)."""
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img)

    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        latar = Image.new("RGB", img.size, (255, 255, 255))
        latar.paste(img, mask=img.split()[-1])
        img = latar
    else:
        img = img.convert("RGB")

    img.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))

    kualitas = 88
    while True:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=kualitas, optimize=True)
        data = buf.getvalue()

        if len(data) * 4 / 3 <= MAX_IMAGE_B64_CHARS or kualitas <= 40:
            return data, "image/jpeg"

        kualitas -= 12
        if kualitas < 40:
            kualitas = 40
            w, h = img.size
            img = img.resize((int(w * 0.8), int(h * 0.8)))


def validasi_gambar(image):
    if image is None:
        return None

    if not isinstance(image, str):
        raise ValueError("Format gambar tidak valid.")

    image = image.strip()

    if not image:
        return None

    match = DATA_URL_RE.match(image)

    if not match:
        raise ValueError(
            "Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF "
            "dalam format data:image/...;base64,..."
        )

    mime = match.group(1).lower()
    if mime == "image/jpg":
        mime = "image/jpeg"

    encoded = re.sub(r"\s+", "", match.group(2))

    if not encoded:
        raise ValueError("Data gambar kosong.")

    try:
        raw = base64.b64decode(encoded, validate=True)
    except Exception:
        raise ValueError("Data Base64 gambar tidak valid.")

    # Kompres bila ada Pillow (selalu untuk GIF, atau bila terlalu besar).
    perlu_kompres = (
        mime == "image/gif"
        or len(encoded) > 1_500_000
    )

    if Image is not None:
        try:
            if not perlu_kompres:
                tmp = Image.open(io.BytesIO(raw))
                if max(tmp.size) > 2400:
                    perlu_kompres = True

            if perlu_kompres:
                raw, mime = kompres_gambar(raw)
                encoded = base64.b64encode(raw).decode("ascii")
        except Exception as e:
            print("[Image] Kompres gagal:", repr(e))

    if len(encoded) > MAX_IMAGE_B64_CHARS:
        raise ValueError(
            "Ukuran gambar terlalu besar. Kompres atau potong gambar "
            "terlebih dahulu (maksimal sekitar 3 MB)."
        )

    return f"data:{mime};base64,{encoded}"


# ==================================================
# HISTORY
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

        if role not in ("user", "assistant"):
            continue

        if content is None:
            continue

        if isinstance(content, list):
            content = ekstrak_teks_content(content)
        else:
            content = str(content)

        content = content.strip()

        if not content:
            continue

        if len(content) > MAX_MESSAGE_CHARS:
            content = content[:MAX_MESSAGE_CHARS] + "\n[Pesan dipersingkat]"

        if total_chars + len(content) > MAX_HISTORY_CHARS:
            sisa = MAX_HISTORY_CHARS - total_chars

            if sisa > 200:
                hasil.append({
                    "role": role,
                    "content": content[:sisa] + "\n[History dipersingkat]",
                })

            break

        hasil.append({"role": role, "content": content})
        total_chars += len(content)

    hasil.reverse()

    return hasil


# ==================================================
# MEMORY
# ==================================================

def siapkan_memory_context(user_id=None):
    if user_id is None or get_memory_context is None:
        return ""

    try:
        memory = get_memory_context(user_id)
    except Exception as e:
        print("[Memory] Error:", repr(e))
        return ""

    if not memory:
        return ""

    memory = str(memory).strip()

    if len(memory) > MAX_MEMORY_CONTEXT_CHARS:
        memory = memory[:MAX_MEMORY_CONTEXT_CHARS] + "\n[Memory dipersingkat]"

    return memory


# ==================================================
# RETRY TIME
# ==================================================

def ambil_waktu_retry(response):
    if response is None:
        return 3

    try:
        retry_after = response.headers.get("Retry-After")
    except Exception:
        retry_after = None

    if retry_after:
        try:
            return min(max(float(retry_after) + 1, 2), MAX_RETRY_WAIT)
        except (ValueError, TypeError):
            pass

    try:
        text = response.text or ""
    except Exception:
        text = ""

    for pattern in (
        r"try again in\s+([\d.]+)s",
        r"retry after\s+([\d.]+)s",
        r"retry-after[:\s]+([\d.]+)",
        r"wait\s+([\d.]+)s",
    ):
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if match:
            try:
                return min(max(float(match.group(1)) + 1, 2), MAX_RETRY_WAIT)
            except (ValueError, TypeError):
                pass

    return 3


# ==================================================
# REQUEST GROQ
# ==================================================

def request_groq(headers, data, url=None):
    last_response = None

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                url or BASE_URL,
                headers=headers,
                json=data,
                timeout=REQUEST_TIMEOUT,
            )

            last_response = response

            if response.status_code == 200:
                return response

            if response.status_code == 429:
                print(f"[Groq] 429 {attempt + 1}/{MAX_RETRIES} ({data.get('model')})")

                if attempt >= MAX_RETRIES - 1:
                    return response

                time.sleep(ambil_waktu_retry(response))
                continue

            if response.status_code >= 500:
                print(f"[Groq] Server error {response.status_code}")

                if attempt >= MAX_RETRIES - 1:
                    return response

                time.sleep(min(2 ** attempt, 8))
                continue

            return response

        except requests.exceptions.Timeout:
            print("[Groq] Timeout")
            if attempt >= MAX_RETRIES - 1:
                return None
            time.sleep(2 ** attempt)

        except requests.exceptions.ConnectionError:
            print("[Groq] Connection error")
            if attempt >= MAX_RETRIES - 1:
                return None
            time.sleep(2 ** attempt)

        except requests.exceptions.RequestException as e:
            print("[Groq] Request exception:", repr(e))
            return None

        except Exception as e:
            print("[Groq] Unexpected request error:", repr(e))
            return None

    return last_response


# ==================================================
# PARSE ERROR API
# ==================================================

def ambil_error_api(response):
    if response is None:
        return ""

    try:
        data = response.json()
    except Exception:
        return response.text or ""

    if not isinstance(data, dict):
        return ""

    error = data.get("error")

    if isinstance(error, dict):
        return str(error.get("message", ""))

    if error:
        return str(error)

    return ""


# ==================================================
# EKSTRAK JAWABAN GROQ
# ==================================================

def ekstrak_jawaban_groq(data):
    if not isinstance(data, dict):
        return ""

    choices = data.get("choices")

    if not isinstance(choices, list) or not choices:
        return ""

    first = choices[0]

    if not isinstance(first, dict):
        return ""

    message = first.get("message")

    if not isinstance(message, dict):
        return ""

    # Hanya ambil content final. "reasoning" sengaja TIDAK dipakai
    # supaya proses berpikir model tidak bocor ke pengguna.
    for key in ("content", "text", "output_text"):
        answer = ekstrak_teks_content(message.get(key))
        if answer:
            return answer

    return ""


# ==================================================
# SYSTEM PROMPT
# ==================================================

def buat_system_prompt(user_id=None):
    system_prompt = str(SYSTEM_PROMPT).strip()

    sekarang = datetime.now(WIB).strftime("%A, %d %B %Y, %H:%M WIB")

    system_prompt += "\n\n" + INSTRUKSI_TAMBAHAN.strip()
    system_prompt += f"\n\nWaktu sekarang: {sekarang}."

    memory_context = siapkan_memory_context(user_id)

    if memory_context:
        system_prompt += (
            "\n\n"
            "==================================================\n"
            "MEMORY RELEVAN PENGGUNA\n"
            "==================================================\n"
            + memory_context
            + "\n\nGunakan memory hanya jika relevan. "
            "Jangan menyebut sistem memory internal kepada pengguna."
        )

    return system_prompt


# ==================================================
# USER CONTENT
# ==================================================

def buat_user_content(pesan_text, image):
    if not image:
        return pesan_text

    return [
        {"type": "text", "text": pesan_text},
        {"type": "image_url", "image_url": {"url": image}},
    ]


# ==================================================
# DAFTAR MODEL
# ==================================================

def daftar_model(utama, cadangan):
    hasil = []

    for m in [utama] + list(cadangan):
        if isinstance(m, str) and m.strip() and m.strip() not in hasil:
            hasil.append(m.strip())

    return hasil


# ==================================================
# PANGGIL MODEL (DENGAN FALLBACK)
# ==================================================

GEMINI_OPENAI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
)

# Urutan provider, bisa diubah lewat .env: AI_PROVIDER_ORDER=groq,gemini
URUTAN_PROVIDER = [
    p.strip().lower()
    for p in (os.getenv("AI_PROVIDER_ORDER") or "gemini,groq").split(",")
    if p.strip()
]


def buat_targets(ada_gambar):
    """Daftar (provider, model) yang dicoba berurutan sampai ada yang berhasil."""
    targets = []

    for provider in URUTAN_PROVIDER:
        if provider == "gemini" and GEMINI_API_KEY:
            targets.append({
                "url": GEMINI_OPENAI_URL,
                "key": GEMINI_API_KEY,
                "model": GEMINI_MODEL,
            })

        elif provider == "groq" and API_KEY:
            if ada_gambar:
                models = daftar_model(VISION_MODEL, FALLBACK_VISION_MODELS)
            else:
                models = daftar_model(MODEL, FALLBACK_TEXT_MODELS)

            for m in models:
                targets.append({"url": BASE_URL, "key": API_KEY, "model": m})

    return targets


def panggil_model(messages, targets):
    """Coba target satu per satu. Return (jawaban, kode_error)."""

    kode_error = "unknown"

    for target in targets:
        model = target["model"]

        headers = {
            "Authorization": f"Bearer {target['key']}",
            "Content-Type": "application/json",
        }

        data = {
            "model": model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": MAX_OUTPUT_TOKENS,
        }

        response = request_groq(headers, data, target["url"])

        if response is None:
            kode_error = "network"
            continue

        status = response.status_code

        if status == 200:
            try:
                jawaban = bersihkan_jawaban(ekstrak_jawaban_groq(response.json()))
            except Exception as e:
                print("[Groq] Parse error:", repr(e))
                jawaban = ""

            if jawaban:
                return jawaban, None

            print(f"[Groq] Jawaban kosong dari {model}, coba model lain")
            kode_error = "empty"
            continue

        pesan_error = ambil_error_api(response)
        print(f"[Groq] {model} -> {status}: {pesan_error[:300]}")

        if status in (401, 403):
            kode_error = "auth"
            continue

        if status == 429:
            kode_error = "rate_limit"
            continue

        if status in (400, 404, 413, 422):
            kode_error = "bad_request"
            continue

        kode_error = "server"

    return "", kode_error


def pesan_error_pengguna(kode, ada_gambar):
    if kode == "auth":
        return "API Key tidak valid atau sudah dicabut. Buat key baru lalu isi di file .env."

    if kode == "rate_limit":
        return "Batas pemakaian AI sedang penuh. Tunggu sekitar 1 menit lalu kirim ulang pesanmu."

    if kode == "network":
        return "Koneksi ke server AI terputus. Periksa internet lalu coba kirim lagi."

    if ada_gambar and kode in ("bad_request", "empty"):
        return (
            "Gambar belum bisa dibaca. Coba kirim ulang dengan gambar yang lebih kecil "
            "(JPG/PNG, di bawah 3 MB), dan tulis pertanyaanmu tentang gambar itu."
        )

    return "Server AI sedang bermasalah. Coba kirim ulang pesanmu sebentar lagi."


# ==================================================
# BALAS AI
# ==================================================

def balas(pesan, history=None, image=None, user_id=None):

    if not API_KEY and not GEMINI_API_KEY:
        return (
            "API Key belum tersedia. Isi GROQ_API_KEY dan/atau "
            "GEMINI_API_KEY di file .env."
        )

    if not isinstance(history, list):
        history = []

    # ---------------- GAMBAR ----------------
    try:
        image = validasi_gambar(image)
    except ValueError as e:
        print("[AI.Ind] Image validation:", str(e))
        return str(e)

    # ---------------- PESAN ----------------
    pesan_text = "" if pesan is None else str(pesan).strip()

    if len(pesan_text) > MAX_MESSAGE_CHARS * 2:
        pesan_text = pesan_text[: MAX_MESSAGE_CHARS * 2] + "\n[Pesan dipersingkat]"

    if not pesan_text and image:
        pesan_text = (
            "Analisis gambar ini secara teliti. Jelaskan apa yang terlihat, "
            "baca semua teks atau angka penting, dan jika ada soal atau "
            "pertanyaan di dalamnya, jawab. Jangan mengarang bagian yang "
            "tidak terlihat. Di akhir, tanyakan apa yang ingin kuketahui lebih lanjut."
        )

    if not pesan_text and not image:
        return "Pesanmu kosong. Tulis pertanyaan atau kirim gambar ya."

    # ---------------- HISTORY ----------------
    hist = siapkan_history(history)

    # Hindari pesan ganda bila frontend sudah memasukkan pesan terbaru ke history.
    if hist and hist[-1]["role"] == "user" and hist[-1]["content"].strip() == pesan_text:
        hist = hist[:-1]

    messages = [{"role": "system", "content": buat_system_prompt(user_id)}]
    messages.extend(hist)
    messages.append({"role": "user", "content": buat_user_content(pesan_text, image)})

    # ---------------- PILIH MODEL ----------------
    targets = buat_targets(bool(image))

    jawaban, kode_error = panggil_model(messages, targets)

    if jawaban:
        return jawaban

    return pesan_error_pengguna(kode_error, bool(image))
