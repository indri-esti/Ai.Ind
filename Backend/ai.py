import base64
import io
import os
import re
import time
import traceback
from datetime import datetime, timedelta, timezone

import requests

from config import (
    API_KEY,
    BASE_URL,
    MODEL,
    VISION_MODEL,
)

from prompt import SYSTEM_PROMPT

try:
    from memory import get_memory_context, deteksi_memory_penting
except Exception as e:
    print("[AI.Ind] memory.py tidak dimuat:", repr(e))
    get_memory_context = None
    deteksi_memory_penting = None

try:
    from PIL import Image, ImageOps
except Exception:
    Image = None
    ImageOps = None


# Penanda versi: kalau tulisan ini tidak muncul di log hosting,
# berarti server masih menjalankan ai.py yang lama.
VERSI = "2026-10-31-v5"
print(f"[AI.Ind] ai.py {VERSI} dimuat")


# ==================================================
# KONFIGURASI
# ==================================================

# Batas token per menit Groq (gratis) cukup kecil (8K untuk gpt-oss),
# jadi riwayat dan output dijaga supaya satu request tidak terlalu besar.
MAX_HISTORY_CHARS = 8000
MAX_MESSAGE_CHARS = 4000
MAX_OUTPUT_TOKENS = 3000
MAX_RETRIES = 2
MAX_RETRY_WAIT = 12
REQUEST_TIMEOUT = 90
MAX_MEMORY_CONTEXT_CHARS = 3000

# Batas Groq untuk gambar base64 = 4MB. Sisakan margin.
MAX_IMAGE_B64_CHARS = 3_900_000
MAX_IMAGE_SIDE = 2000

# Isi AI_PLAIN_TEXT=1 di .env bila tampilan chat-mu TIDAK bisa
# menampilkan Markdown (**tebal**, # judul). Blok kode tidak diubah.
PLAIN_TEXT = (os.getenv("AI_PLAIN_TEXT") or "").strip().lower() in (
    "1", "true", "ya", "yes"
)

# Satu provider (Groq), tapi beberapa model. Tiap model punya limit
# sendiri, jadi kalau satu penuh/error otomatis pindah ke berikutnya.
# Catatan: llama-3.3-70b-versatile & llama-3.1-8b-instant sudah dimatikan
# Groq (16 Agu 2026), jadi diganti qwen/qwen3.8-27b.
FALLBACK_TEXT_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]

# Catatan: llama-4-scout (17 Jul 2026), llama-4-maverick (9 Mar 2026) dan
# qwen3.6-27b (14 Sep 2026) sudah dimatikan Groq untuk akun gratis.
# Model vision yang masih aktif: qwen/qwen3.8-27b.
FALLBACK_VISION_MODELS = [
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
]

WIB = timezone(timedelta(hours=7))

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
    "Agustus", "September", "Oktober", "November", "Desember",
]

INSTRUKSI_TAMBAHAN = """
ATURAN KERJA (ikuti selalu):
UMUM
- Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia) dengan gaya ngobrol santai seperti teman, bukan kaku atau formal. Untuk obrolan dan curhat, jangan memberi daftar solusi kecuali diminta.
- Jawab dengan benar dan teliti. Jika tidak yakin, katakan bagian mana yang belum pasti. Jangan mengarang fakta, sumber, atau hasil. Kamu tidak bisa membuka internet.
- Jika informasi kurang, tanyakan satu hal saja dengan santai, jangan membuat daftar pertanyaan.
- Untuk permainan, kuis, latihan, atau tanya jawab interaktif: ajukan pertanyaan, tunggu jawaban pengguna, nilai jawabannya, lalu lanjutkan ke langkah berikutnya. Ingat alur percakapan sebelumnya.
- Jika pengguna menyebut namanya atau info pribadi yang ada di bagian MEMORY, pakai itu secara wajar (sapa dengan nama, jawab langsung bila ditanya "siapa namaku"). Jangan menyebut kata "memory" atau sistem internal.
- Jangan menulis ulang lirik lagu utuh atau teks berhak cipta yang panjang. Untuk permainan lirik, beri petunjuk atau minta pengguna yang menulis, lalu tanggapi.
- Jangan pernah menulis proses berpikir internal. Jangan pernah menjawab hanya dengan "AI tidak merespon".

GAMBAR / FOTO
- Jika ada gambar, analisis isinya secara nyata: objek, teks (baca semua teks/OCR, termasuk tulisan tangan), angka, tabel, grafik, soal, kode, pesan error, dokumen.
- Jawab pertanyaan pengguna berdasarkan gambar. Jika ada bagian buram atau tidak terbaca, sebutkan bagian itu, jangan menebak.
- Jika gambar berisi soal, kerjakan langkah demi langkah dan beri jawaban akhir yang jelas. Jika gambar berisi jawaban siswa, periksa satu per satu: tandai benar/salah dan beri nilai yang benar beserta alasannya.

CODING
- Kamu bisa membantu semua bahasa pemrograman: tulis, jelaskan, debug, refactor, review, buat test, SQL, shell, dan arsitektur aplikasi.
- Tulis kode LENGKAP dan siap jalan, bukan potongan dengan "..." atau "sisanya sama". Taruh di blok kode dengan nama bahasa, misalnya ```python.
- Untuk debugging, cari akar masalahnya. Jika pesan error/traceback belum ada, minta dulu. Setelah kode, sebutkan singkat cara menjalankan, dependensi, dan hal yang perlu dicek.
- Jangan pernah menaruh API key atau password asli ke dalam kode contoh; pakai variabel lingkungan.

MATEMATIKA & SAINS
- Kerjakan bertahap, tulis rumus yang dipakai, lalu cek ulang hasil akhirnya.
"""


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def hapus_markdown_ringan(teks):
    """Hapus **tebal**, # judul, > kutipan di luar blok kode."""
    bagian = re.split(r"(```.*?```)", teks, flags=re.DOTALL)
    hasil = []

    for b in bagian:
        if b.startswith("```"):
            hasil.append(b)
            continue

        b = re.sub(r"^\s*#{1,6}\s*", "", b, flags=re.MULTILINE)
        b = re.sub(r"\*\*(.+?)\*\*", r"\1", b)
        b = re.sub(r"^\s*>\s?", "", b, flags=re.MULTILINE)
        hasil.append(b)

    return "".join(hasil)


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

    if PLAIN_TEXT:
        teks = hapus_markdown_ringan(teks)

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

        if len(data) * 4 / 3 <= MAX_IMAGE_B64_CHARS:
            return data, "image/jpeg"

        if kualitas > 50:
            kualitas -= 12
        else:
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
            "Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF."
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
        raise ValueError("Data gambar tidak valid.")

    perlu_kompres = mime == "image/gif" or len(encoded) > 1_500_000

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
            "Ukuran gambar terlalu besar. Kecilkan gambar dulu "
            "(maksimal sekitar 3 MB) lalu kirim lagi."
        )

    return f"data:{mime};base64,{encoded}"


def ambil_gambar_history(history, maks_pesan=4):
    """Kalau history masih memuat gambar yang baru dikirim, pakai lagi
    supaya pertanyaan lanjutan tentang foto tetap bisa dijawab."""
    if not isinstance(history, list):
        return None

    for item in reversed(history[-maks_pesan:]):
        if not isinstance(item, dict) or item.get("role") != "user":
            continue

        kandidat = []

        content = item.get("content")
        if isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    iu = part.get("image_url")
                    kandidat.append(iu.get("url") if isinstance(iu, dict) else iu)

        kandidat.append(item.get("image"))

        for url in kandidat:
            if isinstance(url, str) and url.lower().startswith("data:image/"):
                try:
                    return validasi_gambar(url)
                except ValueError:
                    return None

    return None


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

def simpan_memory_dari_pesan(pesan_text, user_id):
    if not user_id or deteksi_memory_penting is None or not pesan_text:
        return

    try:
        deteksi_memory_penting(pesan_text, user_id)
    except Exception as e:
        print("[Memory] Gagal menyimpan:", repr(e))


def siapkan_memory_context(user_id=None):
    if not user_id or get_memory_context is None:
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
    """Detik yang disarankan sebelum mencoba lagi (bisa lebih besar dari batas)."""
    if response is None:
        return 3

    try:
        retry_after = response.headers.get("Retry-After")
    except Exception:
        retry_after = None

    if retry_after:
        try:
            return float(retry_after) + 1
        except (ValueError, TypeError):
            pass

    try:
        text = response.text or ""
    except Exception:
        text = ""

    match = re.search(
        r"try again in\s+(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:([\d.]+)s)?",
        text,
        flags=re.IGNORECASE,
    )

    if match and any(match.groups()):
        jam = float(match.group(1) or 0)
        menit = float(match.group(2) or 0)
        detik = float(match.group(3) or 0)
        return jam * 3600 + menit * 60 + detik + 1

    return 3


# ==================================================
# REQUEST GROQ
# ==================================================

def request_groq(headers, data):
    last_response = None

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                BASE_URL,
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

                tunggu = ambil_waktu_retry(response)

                # Tunggu lama (mis. limit harian) -> langsung ganti model.
                if tunggu > MAX_RETRY_WAIT:
                    return response

                time.sleep(max(tunggu, 2))
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

    return last_response


# ==================================================
# PARSE RESPON
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

    # Hanya content final. Field "reasoning" sengaja tidak dipakai
    # supaya proses berpikir model tidak bocor ke pengguna.
    for key in ("content", "text", "output_text"):
        answer = ekstrak_teks_content(message.get(key))
        if answer:
            return answer

    return ""


# ==================================================
# SYSTEM PROMPT
# ==================================================

def waktu_sekarang():
    n = datetime.now(WIB)
    return f"{HARI[n.weekday()]}, {n.day} {BULAN[n.month - 1]} {n.year}, {n:%H:%M} WIB"


def buat_system_prompt(user_id=None):
    system_prompt = str(SYSTEM_PROMPT).strip()

    system_prompt += "\n\n" + INSTRUKSI_TAMBAHAN.strip()
    system_prompt += f"\n\nWaktu sekarang: {waktu_sekarang()}."

    memory_context = siapkan_memory_context(user_id)

    if memory_context:
        system_prompt += (
            "\n\n"
            "==================================================\n"
            "MEMORY TENTANG PENGGUNA (dari percakapan sebelumnya)\n"
            "==================================================\n"
            + memory_context
            + "\n\nPakai informasi ini hanya bila relevan. "
            "Jangan menyebut kata memory atau sistem internal."
        )

    return system_prompt


def buat_user_content(pesan_text, image):
    if not image:
        return pesan_text

    return [
        {"type": "text", "text": pesan_text},
        {"type": "image_url", "image_url": {"url": image}},
    ]


def daftar_model(utama, cadangan):
    hasil = []

    for m in [utama] + list(cadangan):
        if isinstance(m, str) and m.strip() and m.strip() not in hasil:
            hasil.append(m.strip())

    return hasil


# ==================================================
# PANGGIL MODEL (DENGAN FALLBACK)
# ==================================================

def panggil_model(messages, models):
    """Coba model satu per satu. Return (jawaban, kode_error)."""

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    kode_error = "unknown"

    for model in models:
        ada_gambar = isinstance(messages[-1].get("content"), list)

        data = {
            "model": model,
            "messages": messages,
            "temperature": 0.4 if ada_gambar else 0.85,
            "max_completion_tokens": MAX_OUTPUT_TOKENS,
        }

        if model.startswith("openai/gpt-oss"):
            data["reasoning_effort"] = "medium"

        # Qwen 3.8: sembunyikan proses berpikir supaya content berisi
        # jawaban akhir, dan batasi usaha berpikir agar tidak menghabiskan token.
        if model.startswith("qwen/qwen3.8"):
            data["reasoning_effort"] = "medium" if ada_gambar else "low"
            data["reasoning_format"] = "hidden"

        response = request_groq(headers, data)

        if response is None:
            kode_error = "network"
            continue

        status = response.status_code

        # Kalau parameter reasoning ditolak, coba lagi tanpa parameter itu.
        if status in (400, 422) and "reasoning_format" in data:
            print(f"[Groq] {model} menolak parameter reasoning, coba tanpa itu")
            data.pop("reasoning_format", None)
            data.pop("reasoning_effort", None)

            response = request_groq(headers, data)

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
                print(f"[Groq] OK dengan {model}")
                return jawaban, None

            print(f"[Groq] Jawaban kosong dari {model}, coba model lain")
            kode_error = "empty"
            continue

        pesan_error = ambil_error_api(response)
        print(f"[Groq] {model} -> {status}: {pesan_error[:300]}")

        if status in (401, 403):
            kode_error = "auth"
            # Key salah berlaku untuk semua model, tidak perlu lanjut.
            return "", kode_error

        if status == 429:
            kode_error = "rate_limit"
            continue

        if status == 413:
            kode_error = "too_large"
            continue

        if status in (400, 404, 422):
            kode_error = "bad_request"
            continue

        kode_error = "server"

    return "", kode_error


def pesan_error_pengguna(kode, ada_gambar):
    if kode == "auth":
        return (
            "API Key Groq tidak valid atau sudah dicabut. "
            "Buat key baru di console.groq.com lalu isi di GROQ_API_KEY."
        )

    if kode == "rate_limit":
        return (
            "Batas pemakaian AI sedang penuh. Tunggu sekitar 1 menit lalu "
            "kirim ulang pesanmu."
        )

    if kode == "network":
        return "Koneksi ke server AI terputus. Coba kirim lagi sebentar lagi."

    if kode == "too_large":
        return (
            "Pesan atau percakapan ini terlalu panjang untuk diproses. "
            "Coba mulai chat baru atau kirim pesan yang lebih pendek."
        )

    if ada_gambar and kode in ("bad_request", "empty"):
        return (
            "Gambar belum bisa dibaca. Coba kirim ulang dengan gambar yang lebih "
            "kecil atau lebih jelas (JPG/PNG), dan tulis pertanyaanmu tentang gambar itu."
        )

    return "Server AI sedang bermasalah. Coba kirim ulang pesanmu sebentar lagi."


# ==================================================
# BALAS AI
# ==================================================

def balas(pesan, history=None, image=None, user_id=None):
    """Tidak pernah melempar error: selalu mengembalikan teks."""
    try:
        return _balas(pesan, history, image, user_id)
    except Exception:
        traceback.print_exc()
        return (
            "Terjadi kesalahan di server saat memproses pesanmu. "
            "Coba kirim ulang. Jika terus berulang, cek log server."
        )


def _balas(pesan, history, image, user_id):

    if not API_KEY:
        return (
            "API Key Groq belum tersedia. Isi GROQ_API_KEY di Environment "
            "Variables hosting atau di file .env."
        )

    if not isinstance(history, list):
        history = []

    # ---------------- GAMBAR ----------------
    try:
        image = validasi_gambar(image)
    except ValueError as e:
        print("[AI.Ind] Validasi gambar:", str(e))
        return str(e)

    if image is None:
        image = ambil_gambar_history(history)

    # ---------------- PESAN ----------------
    pesan_text = "" if pesan is None else str(pesan).strip()

    if len(pesan_text) > MAX_MESSAGE_CHARS:
        pesan_text = pesan_text[:MAX_MESSAGE_CHARS] + "\n[Pesan dipersingkat]"

    if not pesan_text and image:
        pesan_text = (
            "Analisis gambar ini secara teliti. Jelaskan apa yang terlihat, "
            "baca semua teks atau angka penting, dan jika ada soal atau "
            "pertanyaan di dalamnya, jawab. Jangan mengarang bagian yang "
            "tidak terlihat. Di akhir, tanyakan apa yang ingin diketahui lebih lanjut."
        )

    if not pesan_text and not image:
        return "Pesanmu kosong. Tulis pertanyaan atau kirim gambar ya."

    # ---------------- MEMORY ----------------
    # Simpan dulu agar info di pesan ini (mis. nama) langsung terpakai.
    simpan_memory_dari_pesan(pesan_text, user_id)

    # ---------------- HISTORY ----------------
    hist = siapkan_history(history)

    # Hindari pesan ganda bila frontend sudah memasukkan pesan terbaru ke history.
    if hist and hist[-1]["role"] == "user" and hist[-1]["content"].strip() == pesan_text:
        hist = hist[:-1]

    messages = [{"role": "system", "content": buat_system_prompt(user_id)}]
    messages.extend(hist)
    messages.append({"role": "user", "content": buat_user_content(pesan_text, image)})

    # ---------------- MODEL ----------------
    if image:
        models = daftar_model(VISION_MODEL, FALLBACK_VISION_MODELS)
    else:
        models = daftar_model(MODEL, FALLBACK_TEXT_MODELS)

    jawaban, kode_error = panggil_model(messages, models)

    if jawaban:
        return jawaban

    return pesan_error_pengguna(kode_error, bool(image)) 