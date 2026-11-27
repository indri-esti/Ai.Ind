import base64
import io
import os
import re
import threading
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
VERSI = "2026-11-27-v11"
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

# Jawaban yang terpotong karena batas token (finish_reason == "length")
# otomatis disambung lagi, maksimal sebanyak ini.
MAX_LANJUTAN = 3
# Bagian akhir jawaban yang dikirim ulang sebagai konteks saat menyambung.
MAX_KONTEKS_LANJUT_CHARS = 6000
# Saat menyambung, kuota token per menit biasanya baru terpakai oleh
# request pertama, jadi boleh menunggu lebih lama dari biasanya.
MAX_TUNGGU_LANJUT = 30
# Perkiraan batas token per menit (prompt + jatah jawaban).
BATAS_TOKEN_PERKIRAAN = 8000

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
# qwen3.6-27b dibuang dari daftar ini: model yang sudah mati selalu gagal
# (404) dan error-nya menimpa penyebab gagal yang sebenarnya.
FALLBACK_VISION_MODELS = [
    "qwen/qwen3.8-27b",
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

TEBAKAN vs NGOBROL (baca pesan dengan teliti, pahami maksudnya dulu)
- Bedakan tiga jenis pesan: (a) TEBAKAN/teka-teki yang minta kamu menebak, (b) pertanyaan pengetahuan biasa, (c) ngobrol santai.
- Anggap pesan sebagai TEBAKAN bila ada kata seperti "tebak", "tebakan", "teka-teki", "hayo", "hayyo", "ayo", "coba jawab", "bisa nebak nggak", atau nada menantang di akhir kalimat, atau pola teka-teki (mis. "binatang apa yang ...?", "benda apa yang ...?" disertai nada main-main/menantang). Juga bila pengguna bilang mau memberi tebakan.
- Kalau TEBAKAN: perlakukan sebagai permainan. Pikirkan dulu jawaban yang paling pas dengan petunjuknya, lalu tebak SATU jawaban saja dengan gaya santai dan bercanda, lalu tanya apakah benar. JANGAN memberi daftar banyak jawaban dan JANGAN menjelaskan panjang lebar seperti ensiklopedia. Contoh: "buah apa yang manis? hayyo?" dijawab seperti "Hmm... mangga! Bener nggak? 😄".
- Kalau tebakanmu salah dan pengguna memberi petunjuk atau jawaban, tanggapi: akui, puji bila jawabannya lucu atau cerdas, dan tebak lagi bila diminta. Kalau kamu menyerah, bilang menyerah dan minta jawabannya.
- Kalau pengguna minta KAMU yang memberi tebakan: beri satu tebakan saja, jangan bocorkan jawabannya, tunggu pengguna menjawab, lalu nilai jawabannya.
- Kalau pengguna menjawab tebakan yang kamu berikan, nilai benar/salah dengan jelas dan ramah.
- Kalau pesan jelas pertanyaan pengetahuan tanpa nada menantang (mis. "sebutkan buah-buahan yang kaya vitamin C"), jawab seperti biasa. Kalau ragu antara tebakan dan pertanyaan biasa, ikuti nada pengguna: nada main-main atau menantang berarti tebakan.
- Kalau ngobrol santai, balas natural seperti teman, singkat, tanpa daftar.

MARAH, KECEWA, & CURHAT (pahami KE SIAPA kalimat itu ditujukan)
- Perhatikan kata "kamu". Kalau pengguna marah atau kecewa KEPADAMU (mis. "kamu sama aja kayak orang lain", "kamu nggak ngerti aku", "kamu nyalahin aku"), itu keluhan tentang jawabanmu, BUKAN curhat tentang orang lain. Tanggapi langsung: akui dengan tulus bahwa tadi kamu salah menangkap atau terdengar menyalahkan, minta maaf singkat, lalu tunjukkan bahwa kamu mau mendengarkan. Jangan mengalihkan ke topik lain dan jangan membela diri.
- Saat pengguna curhat atau kesal, dengarkan dulu. Jangan membela pihak yang diceritakan, jangan menghakimi pengguna, dan jangan menyuruh pengguna menemui atau bertanya ke orang itu kecuali diminta. Jangan memberi saran atau daftar langkah kalau tidak diminta.
- Validasi perasaannya (capek, sakit hati, merasa tidak dimengerti), tapi jangan membenarkan klaim yang terlalu mutlak seperti "semua orang memang tidak suka kamu". Bilang lembut bahwa kamu paham kenapa ia merasa begitu, tanpa menyetujui bahwa itu pasti benar.
- Akhiri dengan SATU pertanyaan lembut yang mengajak ia bercerita, atau cukup temani tanpa bertanya. Balasan pendek dan hangat, bukan ceramah.
- Kalau ada tanda pengguna ingin menyakiti diri sendiri atau merasa tidak ingin hidup, tanggapi dengan peduli dan serius, tanyakan keadaannya dengan lembut, dan sarankan menghubungi orang tepercaya atau tenaga profesional.

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


def bersihkan_jawaban(teks, rapi=True):
    """rapi=False dipakai untuk sambungan jawaban: spasi di awal baris
    (indentasi kode) dipertahankan."""
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

    if not rapi:
        return teks.strip("\n")

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

def request_groq(headers, data, maks_tunggu=MAX_RETRY_WAIT):
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
                if tunggu > maks_tunggu:
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
# BACA JAWABAN + ALASAN BERHENTI
# ==================================================

def ambil_jawaban_dan_alasan(response, rapi=True):
    """Return (jawaban_bersih, finish_reason)."""
    try:
        isi = response.json()
    except Exception as e:
        print("[Groq] Parse error:", repr(e))
        return "", None

    try:
        jawaban = bersihkan_jawaban(ekstrak_jawaban_groq(isi), rapi=rapi)
    except Exception as e:
        print("[Groq] Parse error:", repr(e))
        jawaban = ""

    alasan = None

    try:
        alasan = isi["choices"][0].get("finish_reason")
    except Exception:
        alasan = None

    return jawaban, alasan


# ==================================================
# SAMBUNG JAWABAN YANG TERPOTONG
# Kalau model berhenti karena kehabisan token (finish_reason "length"),
# jawaban (terutama kode) berhenti di tengah baris. Di sini jawaban
# disambung otomatis sampai selesai, lalu blok kode ditutup rapi.
# ==================================================

INSTRUKSI_LANJUT = (
    "Jawabanmu di atas terpotong karena batas panjang. Lanjutkan LANGSUNG "
    "dari baris berikutnya, persis di titik berhenti. Jangan mengulang "
    "bagian yang sudah ditulis, jangan memberi pembuka, penutup, atau "
    "penjelasan baru. Kalau terpotong di dalam blok kode, teruskan kodenya "
    "TANPA membuka blok ``` baru dan tetap pakai indentasi yang sama. "
    "Tutup blok kode dengan ``` hanya setelah kodenya benar-benar selesai."
)

CATATAN_TERPOTONG = (
    "\n\n(Jawaban masih terpotong karena batas panjang. "
    "Ketik \"lanjut\" untuk meneruskan.)"
)

FENCE_RE = re.compile(r"^[ \t]*```", re.MULTILINE)
FENCE_BUKA_RE = re.compile(r"^[ \t]*```[\w+#.-]*[ \t]*$")


def di_dalam_blok_kode(teks):
    return len(FENCE_RE.findall(teks)) % 2 == 1


def potong_ke_baris_utuh(teks):
    """Buang baris terakhir yang kemungkinan setengah jadi."""
    i = teks.rfind("\n")

    if i < 0:
        return teks

    return teks[: i + 1]


def gabung_sambungan(awal, lanjutan):
    # Model kadang membuka blok ```bahasa baru padahal kodenya masih berjalan.
    if di_dalam_blok_kode(awal):
        baris = lanjutan.split("\n", 1)

        if FENCE_BUKA_RE.match(baris[0]):
            lanjutan = baris[1] if len(baris) > 1 else ""

    if awal and not awal.endswith("\n"):
        awal += "\n"

    return awal + lanjutan


# Status per thread: apakah jawaban terakhir terpotong di dalam blok kode.
_STATUS = threading.local()


def tutup_potongan(teks):
    """Pastikan blok kode tidak menggantung dan beri tahu pengguna."""
    teks = teks.rstrip()

    dalam_kode = di_dalam_blok_kode(teks)
    _STATUS.dalam_kode = dalam_kode

    if dalam_kode:
        teks += "\n```"

    return teks + CATATAN_TERPOTONG


def lengkapi_jawaban(headers, data, jawaban, alasan):
    """Kalau jawaban terpotong (alasan == "length"), sambung sampai selesai."""
    if alasan != "length" or not jawaban:
        return jawaban

    pesan_sistem = data["messages"][0]

    # Pertanyaan asli = pesan user terakhir yang bukan instruksi lanjut.
    # Isinya (termasuk gambar) dipertahankan supaya sambungan tidak
    # kehilangan soalnya.
    pertanyaan_penuh = ""

    for m in reversed(data["messages"]):
        if m.get("role") == "user" and m.get("content") != INSTRUKSI_LANJUT:
            pertanyaan_penuh = m.get("content")
            break

    hasil = jawaban

    for ke in range(1, MAX_LANJUTAN + 1):
        hasil = potong_ke_baris_utuh(hasil)

        konteks = hasil
        if len(konteks) > MAX_KONTEKS_LANJUT_CHARS:
            konteks = konteks[-MAX_KONTEKS_LANJUT_CHARS:]

        isi_tanya = pertanyaan_penuh

        pesan = [
            pesan_sistem,
            {"role": "user", "content": isi_tanya},
            {"role": "assistant", "content": konteks},
            {"role": "user", "content": INSTRUKSI_LANJUT},
        ]

        maks = min(MAX_OUTPUT_TOKENS, BATAS_TOKEN_PERKIRAAN - taksir_token(pesan) - 300)

        # Kuota token tidak cukup untuk gambar: sambung tanpa gambar.
        if maks < 500 and isinstance(isi_tanya, list):
            isi_tanya = ekstrak_teks_content(isi_tanya)
            pesan[1] = {"role": "user", "content": isi_tanya}
            maks = min(
                MAX_OUTPUT_TOKENS, BATAS_TOKEN_PERKIRAAN - taksir_token(pesan) - 300
            )

        if maks < 500:
            print("[Groq] Sambung dibatalkan: sisa kuota token terlalu kecil")
            break

        percobaan = dict(data)
        percobaan["messages"] = pesan
        percobaan["max_completion_tokens"] = maks

        if "reasoning_effort" in percobaan:
            percobaan["reasoning_effort"] = "low"

        print(f"[Groq] Jawaban terpotong, sambung {ke}/{MAX_LANJUTAN} ({maks} token)")

        response = request_groq(headers, percobaan, maks_tunggu=MAX_TUNGGU_LANJUT)

        if response is None or response.status_code != 200:
            kode = "tanpa respon" if response is None else response.status_code
            print(f"[Groq] Sambung gagal ({kode})")
            break

        lanjutan, alasan_baru = ambil_jawaban_dan_alasan(response, rapi=False)

        if not lanjutan:
            print("[Groq] Sambung kosong")
            break

        hasil = gabung_sambungan(hasil, lanjutan)

        if alasan_baru != "length":
            print("[Groq] Jawaban selesai setelah disambung")
            return hasil.strip()

    return tutup_potongan(hasil)


# ==================================================
# 413: PERMINTAAN MELEBIHI BATAS TOKEN PER MENIT
# Groq menghitung prompt + gambar (2048 token) + jatah jawaban
# (max_completion_tokens). Kalau jumlahnya melewati batas, hasilnya 413.
# Daripada langsung menyerah, kecilkan permintaan lalu coba lagi.
# ==================================================

TOKEN_PER_GAMBAR = 2048


def taksir_token(messages):
    total = 0

    for m in messages:
        content = m.get("content")

        if isinstance(content, str):
            total += len(content) // 3 + 4

        elif isinstance(content, list):
            for part in content:
                if not isinstance(part, dict):
                    continue

                if part.get("type") == "text":
                    total += len(str(part.get("text") or "")) // 3 + 4

                elif part.get("type") == "image_url":
                    total += TOKEN_PER_GAMBAR

    return total


def ulangi_lebih_kecil(headers, data, pesan_error):
    """Return jawaban (string) atau "" kalau tetap gagal."""

    cocok = re.search(
        r"Limit\s+(\d+)\D+?Requested\s+(\d+)",
        pesan_error or "",
        flags=re.IGNORECASE,
    )

    batas = int(cocok.group(1)) if cocok else None
    diminta = int(cocok.group(2)) if cocok else None

    maks_lama = int(data.get("max_completion_tokens") or MAX_OUTPUT_TOKENS)
    pesan_asli = data["messages"]
    terakhir = pesan_asli[-1]

    rencana = []

    # 1. Pesan sama, jatah jawaban dikecilkan sesuai batas dari Groq.
    if batas and diminta:
        sisa = batas - max(diminta - maks_lama, 0) - 150

        if sisa >= 500:
            rencana.append((pesan_asli, min(sisa, maks_lama)))

    # 2. Tanpa riwayat percakapan.
    tanpa_riwayat = [pesan_asli[0], terakhir]

    # 3. Prompt sistem ringkas (tanpa aturan tambahan dan memory).
    ringkas = [{"role": "system", "content": str(SYSTEM_PROMPT).strip()}, terakhir]

    for varian in (tanpa_riwayat, ringkas):
        if varian == pesan_asli:
            continue

        if batas:
            maks = min(maks_lama, batas - taksir_token(varian) - 150)
        else:
            maks = 1200

        if maks >= 400:
            rencana.append((varian, maks))

    for pesan, maks in rencana:
        percobaan = dict(data)
        percobaan["messages"] = pesan
        percobaan["max_completion_tokens"] = maks

        print(
            f"[Groq] 413 -> ulangi dengan jatah jawaban {maks} token "
            f"({len(pesan)} pesan)"
        )

        response = request_groq(headers, percobaan)

        if response is None:
            continue

        if response.status_code != 200:
            print(
                f"[Groq] Ulang 413 -> {response.status_code}: "
                f"{ambil_error_api(response)[:200]}"
            )
            continue

        jawaban, alasan = ambil_jawaban_dan_alasan(response)

        if jawaban:
            print("[Groq] OK setelah permintaan dikecilkan")
            return lengkapi_jawaban(headers, percobaan, jawaban, alasan)

    return ""


# Penyebab gagal yang informatif tidak boleh ditimpa oleh error
# umum dari model cadangan (mis. 404 model sudah mati).
ERROR_PENTING = ("empty", "too_long", "rate_limit")


def pilih_error(lama, baru):
    if lama in ERROR_PENTING and baru in ("bad_request", "server", "network"):
        return lama

    return baru


# ==================================================
# PANGGIL MODEL (DENGAN FALLBACK)
# ==================================================

def panggil_model(messages, models, max_tokens=None, reasoning=None, suhu=None):
    """Coba model satu per satu. Return (jawaban, kode_error).

    max_tokens, reasoning, suhu opsional: bila kosong, memakai nilai bawaan."""

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
            "temperature": suhu if suhu is not None else (0.4 if ada_gambar else 0.85),
            "max_completion_tokens": max_tokens or MAX_OUTPUT_TOKENS,
        }

        if model.startswith("openai/gpt-oss"):
            data["reasoning_effort"] = reasoning or "medium"

        # Qwen 3.8: sembunyikan proses berpikir supaya content berisi
        # jawaban akhir, dan batasi usaha berpikir agar tidak menghabiskan token.
        if model.startswith("qwen/qwen3.8"):
            data["reasoning_effort"] = reasoning or ("medium" if ada_gambar else "low")
            data["reasoning_format"] = "hidden"

        response = request_groq(headers, data)

        if response is None:
            kode_error = pilih_error(kode_error, "network")
            continue

        status = response.status_code

        # Kalau parameter reasoning ditolak, coba lagi tanpa parameter itu.
        if status in (400, 422) and "reasoning_format" in data:
            print(f"[Groq] {model} menolak parameter reasoning, coba tanpa itu")
            data.pop("reasoning_format", None)
            data.pop("reasoning_effort", None)

            response = request_groq(headers, data)

            if response is None:
                kode_error = pilih_error(kode_error, "network")
                continue

            status = response.status_code

        if status == 200:
            jawaban, alasan = ambil_jawaban_dan_alasan(response)

            # Jawaban kosong karena proses berpikir menghabiskan semua token:
            # ulangi sekali dengan usaha berpikir "low" supaya masih ada
            # token tersisa untuk jawaban.
            if (
                not jawaban
                and alasan == "length"
                and data.get("reasoning_effort") not in (None, "low")
            ):
                print(
                    f"[Groq] {model} kehabisan token saat berpikir, "
                    "ulangi dengan reasoning low"
                )

                data["reasoning_effort"] = "low"

                ulang = request_groq(headers, data)

                if ulang is not None and ulang.status_code == 200:
                    jawaban, alasan = ambil_jawaban_dan_alasan(ulang)

            if jawaban:
                print(f"[Groq] OK dengan {model} (finish_reason={alasan})")
                jawaban = lengkapi_jawaban(headers, data, jawaban, alasan)
                return jawaban, None

            print(
                f"[Groq] Jawaban kosong dari {model} "
                f"(finish_reason={alasan}), coba model lain"
            )
            kode_error = "too_long" if alasan == "length" else "empty"
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

            jawaban = ulangi_lebih_kecil(headers, data, pesan_error)

            if jawaban:
                return jawaban, None

            continue

        if status in (400, 404, 422):
            kode_error = pilih_error(kode_error, "bad_request")
            continue

        kode_error = pilih_error(kode_error, "server")

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
        if ada_gambar:
            return (
                "Gambar dan percakapan ini melebihi batas pemakaian AI per menit. "
                "Tunggu sekitar 1 menit lalu kirim ulang, atau mulai chat baru."
            )

        return (
            "Pesan atau percakapan ini terlalu panjang untuk diproses. "
            "Coba mulai chat baru atau kirim pesan yang lebih pendek."
        )

    if kode == "too_long":
        return (
            "Jawabannya terlalu panjang untuk diselesaikan sekaligus. Coba minta "
            "lebih ringkas atau per bagian, misalnya HTML-nya dulu, lalu CSS dan "
            "JS-nya."
        )

    if ada_gambar and kode in ("bad_request", "empty"):
        return (
            "Gambar belum bisa dibaca. Coba kirim ulang dengan gambar yang lebih "
            "kecil atau lebih jelas (JPG/PNG), dan tulis pertanyaanmu tentang gambar itu."
        )

    return "Server AI sedang bermasalah. Coba kirim ulang pesanmu sebentar lagi."


# ==================================================
# SESI PER PENGGUNA
# Frontend tidak mengirim ulang foto saat pengguna mengetik "lanjut",
# jadi foto, hasil bacaan soal, antrean nomor yang belum dikerjakan, dan
# jawaban yang terpotong disimpan di server (per user_id, dibuang setelah
# SESI_TTL detik). Tanpa user_id sesi tidak disimpan.
# ==================================================

SESI_TTL = 3 * 3600
SESI_MAKS = 30

_SESI = {}
_SESI_LOCK = threading.RLock()

# Batas waktu satu permintaan (detik). Banyak hosting gratis memutus
# permintaan yang lebih lama dari ini. Isi AI_BATAS_DETIK di .env bila perlu.
try:
    BATAS_DETIK = float(os.getenv("AI_BATAS_DETIK") or 50)
except ValueError:
    BATAS_DETIK = 50.0

# Kalau sisa waktu kurang dari ini, jangan mulai kelompok soal baru.
ESTIMASI_BATCH = 25

# Soal banyak dikerjakan per kelompok supaya tiap jawaban tidak terpotong.
SOAL_PER_BATCH = 5
CHAR_PER_BATCH = 1800
MAX_TOKEN_BATCH = 1800
MIN_SOAL_TAHAP = 2

PERLU_TAHAP = re.compile(
    r"jawab|kerja|selesai|soal|pertanyaan|nomor|tugas|\bpr\b|latihan|ujian|"
    r"\bisi|periksa|koreksi|\bcek|benar|salah|hitung|jelaskan|tentukan",
    re.IGNORECASE,
)

POLA_LANJUT = re.compile(
    r"^\s*(?:ok(?:e|ay)?\s*,?\s*)?(?:tolong\s+)?"
    r"(?:lanjut(?:kan|in)?|terus(?:kan)?|next|lagi|sisa(?:nya)?(?:\s+soal)?|"
    r"selanjutnya|berikutnya|udah\s+itu|udah|sudah(?:\s+itu)?|itu\s+aja|"
    r"dan\s+seterusnya|gas|yuk)"
    r"(?:\s*(?:aja|dong|ya|yah|nih|kak|deh|sih))*\s*[.!?]*\s*$",
    re.IGNORECASE,
)

KATA_FOTO = re.compile(
    r"\b(gambar|foto|tulisan|buram|blur|salah\s+baca|baca\s+ulang|lihat)\b",
    re.IGNORECASE,
)

POLA_NOMOR = re.compile(r"^\s*(\d{1,3})\s*[.)]\s*(.*)$")

PROMPT_OCR = (
    "Kamu mesin OCR. Salin SEMUA tulisan pada foto (cetak maupun tulisan "
    "tangan) persis apa adanya, urut dari atas ke bawah. Tulis satu soal "
    "per blok dengan nomornya di awal baris (contoh: \"1. ...\"). Jangan "
    "menjawab, menjelaskan, memperbaiki, atau menambah apa pun. Bagian yang "
    "tidak terbaca tulis [tidak terbaca], jangan menebak. Untuk gambar, "
    "diagram, grafik, atau tabel, tulis deskripsi singkat dalam kurung siku, "
    "mis. [gambar: segitiga siku-siku, sisi 3 dan 4]. Kalau tidak ada "
    "tulisan sama sekali, tulis persis: TIDAK ADA TEKS"
)

PROMPT_KERJA = (
    "Kamu AI.Ind, teman ngobrol dan asisten buatan Indonesia yang santai tapi teliti. "
    "Kerjakan soal-soal di bawah satu per satu.\n"
    "- Tulis nomor persis seperti di soal (\"1.\", \"2.\", dst), satu soal satu blok.\n"
    "- Beri jawaban akhir yang jelas, lalu alasan singkat satu atau dua kalimat. "
    "Untuk hitungan tulis langkah ringkas dan cek ulang hasilnya.\n"
    "- Pilihan ganda: sebut huruf dan isinya. Isian: langsung isinya.\n"
    "- Kalau soal hanya berupa kalimat tanpa perintah, ambil perintah yang paling "
    "masuk akal dari petunjuk atau pola soal lain, dan sebut asumsinya sekali saja.\n"
    "- Teks soal berasal dari pembacaan foto. Kalau ada [tidak terbaca] atau soalnya "
    "tidak masuk akal, tulis \"nomor X kurang jelas, tolong foto ulang\" untuk nomor "
    "itu. Jangan menebak angka atau tulisan.\n"
    "- Kerjakan hanya nomor yang diberikan. Tanpa pembuka dan penutup. Bahasa Indonesia "
    "santai, tanpa Markdown (tanpa **, #, tabel). Jangan menulis proses berpikir."
)


def kunci_sesi(user_id):
    if user_id is None:
        return None

    k = str(user_id).strip()

    return k[:100] or None


def ambil_sesi(kunci):
    """Return salinan sesi, atau None bila tidak ada / sudah kedaluwarsa."""
    if not kunci:
        return None

    with _SESI_LOCK:
        s = _SESI.get(kunci)

        if not s:
            return None

        if time.time() - s.get("waktu", 0) > SESI_TTL:
            _SESI.pop(kunci, None)
            return None

        return dict(s)


def simpan_sesi(kunci, ganti=False, **isi):
    """ganti=True: buang sesi lama (mis. ada foto baru)."""
    if not kunci:
        return

    with _SESI_LOCK:
        s = {} if ganti else (ambil_sesi(kunci) or {})
        s.update(isi)
        s["waktu"] = time.time()
        _SESI[kunci] = s

        while len(_SESI) > SESI_MAKS:
            tertua = min(_SESI, key=lambda k: _SESI[k].get("waktu", 0))
            _SESI.pop(tertua, None)


def pesan_lanjut(teks):
    teks = (teks or "").strip()
    return len(teks) <= 40 and bool(POLA_LANJUT.match(teks))


def nomor_terjawab(teks):
    return {
        int(m.group(1))
        for m in re.finditer(r"^\s*(\d{1,3})\s*[.)]", teks or "", flags=re.MULTILINE)
    }


def pecah_soal(transkrip):
    """Return (pembuka, [[nomor, teks], ...]). Nomor harus naik; baris
    bernomor yang tidak naik dianggap bagian dari soal sebelumnya."""
    pembuka = []
    item = []

    for baris in (transkrip or "").splitlines():
        m = POLA_NOMOR.match(baris)

        if m:
            n = int(m.group(1))

            if not item or 0 < n - item[-1][0] <= 5:
                item.append([n, m.group(2).strip()])
                continue

        if item:
            if baris.strip():
                item[-1][1] = (item[-1][1] + "\n" + baris.strip()).strip()
        elif baris.strip():
            pembuka.append(baris.strip())

    return "\n".join(pembuka), item


def ambil_batch(antrean, soal):
    batch = []
    total = 0

    for n in antrean:
        panjang = len(soal.get(n, ""))

        if batch and (len(batch) >= SOAL_PER_BATCH or total + panjang > CHAR_PER_BATCH):
            break

        batch.append(n)
        total += panjang

    return batch


def baca_soal_dari_gambar(image):
    """Salin teks di foto memakai model vision. Return string atau ""."""
    pesan = [
        {"role": "system", "content": PROMPT_OCR},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Salin semua tulisan pada foto ini."},
                {"type": "image_url", "image_url": {"url": image}},
            ],
        },
    ]

    jawaban, kode = panggil_model(
        pesan,
        daftar_model(VISION_MODEL, FALLBACK_VISION_MODELS),
        max_tokens=2500,
        reasoning="low",
        suhu=0.1,
    )

    if not jawaban:
        print("[Tahap] OCR gagal:", kode)
        return ""

    jawaban = jawaban.replace(CATATAN_TERPOTONG.strip(), "").strip()

    if "TIDAK ADA TEKS" in jawaban.upper() and len(jawaban) < 40:
        return ""

    return jawaban


def kerjakan_antrean(sesi, kunci, mulai, awal=False):
    """Kerjakan soal per kelompok sampai antrean habis atau waktu hampir
    habis. Sisanya disimpan di sesi untuk "lanjut"."""
    soal = {n: t for n, t in sesi.get("soal", [])}
    antrean = list(sesi.get("antrean", []))
    perintah = sesi.get("perintah") or ""
    pembuka = sesi.get("pembuka") or ""

    bagian = []
    kode_gagal = None

    while antrean:
        # Tanpa user_id sisa soal tidak bisa dilanjutkan, jadi tidak ada batas waktu.
        if bagian and kunci and time.time() - mulai > BATAS_DETIK - ESTIMASI_BATCH:
            break

        batch = ambil_batch(antrean, soal)
        isi_soal = "\n".join(f"{n}. {soal.get(n, '')}" for n in batch)

        teks_user = ""

        if perintah:
            teks_user += f"Perintah dari pengguna: {perintah}\n\n"

        if pembuka:
            teks_user += f"Petunjuk umum pada lembar soal:\n{pembuka}\n\n"

        teks_user += f"Soal yang dikerjakan sekarang:\n{isi_soal}"

        pesan = [
            {"role": "system", "content": PROMPT_KERJA},
            {"role": "user", "content": teks_user},
        ]

        jawaban, kode = panggil_model(
            pesan,
            daftar_model(MODEL, FALLBACK_TEXT_MODELS),
            max_tokens=MAX_TOKEN_BATCH,
            reasoning="low",
        )

        if not jawaban:
            kode_gagal = kode or "unknown"
            break

        akhir = CATATAN_TERPOTONG.strip()
        potong = jawaban.endswith(akhir)

        if potong:
            jawaban = jawaban[: -len(akhir)].rstrip()

        selesai = nomor_terjawab(jawaban)

        sisa_batch = []

        if potong:
            if selesai:
                selesai.discard(max(selesai))  # yang terakhir mungkin setengah jadi

            sisa_batch = [n for n in batch if n not in selesai]

            if len(sisa_batch) == len(batch):
                # Tidak ada kemajuan: lanjut ke soal berikutnya supaya tidak berputar.
                jawaban += f"\n\n{batch[0]}. (belum sempat terjawab, tanyakan nomor ini lagi ya)"
                sisa_batch = batch[1:]

        antrean = sisa_batch + antrean[len(batch):]
        bagian.append(jawaban)

        sesi["antrean"] = antrean
        sesi["jawaban_terkumpul"] = (
            (sesi.get("jawaban_terkumpul") or "") + "\n\n" + jawaban
        )[-3000:]

        simpan_sesi(
            kunci,
            antrean=antrean,
            jawaban_terkumpul=sesi["jawaban_terkumpul"],
            terpotong=False,
        )

    if not bagian:
        pesan_gagal = pesan_error_pengguna(kode_gagal or "unknown", False)

        if antrean and kunci:
            pesan_gagal += ' Soalnya sudah kubaca, jadi nanti tinggal ketik "lanjut".'

        return pesan_gagal

    teks = "\n\n".join(bagian)

    if awal:
        terbaca = "\n".join(f"{n}. {t}" for n, t in sesi.get("soal", []))
        teks = (
            f"Oke, aku kerjain {len(soal)} soalnya satu-satu ya. Ini yang kubaca "
            "dari fotonya (kalau ada yang salah baca, bilang nomornya):\n\n"
            f"{terbaca}\n\nJawabannya:\n\n" + teks
        )

    if antrean:
        terjawab = nomor_terjawab(teks)
        terakhir = max(terjawab) if terjawab else batch[-1]
        rentang = (
            f"nomor {antrean[0]}"
            if len(antrean) == 1
            else f"nomor {antrean[0]} sampai {antrean[-1]}"
        )

        if kode_gagal:
            teks += (
                f"\n\nBaru sampai nomor {terakhir}, soalnya kena batas pemakaian AI. "
                f'Tunggu sebentar lalu ketik "lanjut" buat {rentang}.'
            )
        else:
            teks += f'\n\nBaru sampai nomor {terakhir}. Ketik "lanjut" buat {rentang} ya.'

    return teks


def tahap_gambar(pesan_text, image, kunci):
    """Foto baru: baca soalnya dulu, lalu kerjakan per kelompok.
    Return jawaban, atau None bila harus memakai jalur biasa (foto langsung)."""
    mulai = time.time()

    simpan_sesi(
        kunci,
        ganti=True,
        image=image,
        perintah=pesan_text,
        soal_teks="",
        soal=[],
        pembuka="",
        antrean=[],
        jawaban_terkumpul="",
        terpotong=False,
    )

    if not PERLU_TAHAP.search(pesan_text):
        return None

    transkrip = baca_soal_dari_gambar(image)

    if not transkrip:
        return None

    pembuka, soal = pecah_soal(transkrip)

    sesi = {
        "perintah": pesan_text,
        "soal_teks": transkrip,
        "soal": soal,
        "pembuka": pembuka,
        "antrean": [n for n, _ in soal],
        "jawaban_terkumpul": "",
    }

    simpan_sesi(kunci, **sesi)

    print(f"[Tahap] {len(soal)} soal terbaca dari foto")

    if len(soal) < MIN_SOAL_TAHAP:
        return None

    return kerjakan_antrean(sesi, kunci, mulai, awal=True)


def lanjut_terpotong(sesi, kunci, user_id):
    """Sambung jawaban biasa yang terpotong batas panjang di pesan sebelumnya."""
    parsial = sesi.get("jawaban_parsial") or ""
    pertanyaan = sesi.get("pertanyaan_parsial") or ""

    if not parsial or not pertanyaan:
        return None

    dalam_kode = bool(sesi.get("dalam_kode"))

    if sesi.get("soal_teks"):
        pertanyaan += "\n\n[Isi foto yang dikirim pengguna]\n" + sesi["soal_teks"][:2500]

    ekor = potong_ke_baris_utuh(parsial[-MAX_KONTEKS_LANJUT_CHARS:])

    pesan = [
        {"role": "system", "content": buat_system_prompt(user_id)},
        {"role": "user", "content": pertanyaan},
        {"role": "assistant", "content": ekor},
        {"role": "user", "content": INSTRUKSI_LANJUT},
    ]

    _STATUS.dalam_kode = False

    lanjutan, kode = panggil_model(pesan, daftar_model(MODEL, FALLBACK_TEXT_MODELS))

    if not lanjutan:
        return pesan_error_pengguna(kode or "unknown", False)

    catat_jawaban(
        kunci,
        sesi.get("pertanyaan_parsial") or "",
        lanjutan,
        getattr(_STATUS, "dalam_kode", False),
        awalan=parsial,
    )

    if dalam_kode:
        baris = lanjutan.split("\n", 1)

        if FENCE_BUKA_RE.match(baris[0]):
            lanjutan = baris[1] if len(baris) > 1 else ""

        lanjutan = "```\n" + lanjutan

    return lanjutan


def lanjutkan_sesi(sesi, kunci, user_id):
    if sesi.get("antrean"):
        return kerjakan_antrean(sesi, kunci, time.time(), awal=False)

    if sesi.get("terpotong"):
        return lanjut_terpotong(sesi, kunci, user_id)

    return None


def catat_jawaban(kunci, pesan_text, jawaban, dalam_kode, awalan=""):
    """Simpan jawaban yang terpotong supaya "lanjut" bisa menyambungnya."""
    if not kunci or not jawaban:
        return

    akhir = CATATAN_TERPOTONG.strip()

    if not jawaban.endswith(akhir):
        simpan_sesi(kunci, terpotong=False)
        return

    isi = jawaban[: -len(akhir)].rstrip()

    if dalam_kode and isi.endswith("```"):
        isi = isi[:-3].rstrip()  # buang penutup yang ditambah otomatis

    simpan_sesi(
        kunci,
        terpotong=True,
        jawaban_parsial=(awalan + "\n" + isi) if awalan else isi,
        pertanyaan_parsial=pesan_text,
        dalam_kode=dalam_kode,
    )


def konteks_sesi(sesi):
    """Teks tambahan untuk system prompt: isi foto terakhir + jawaban sebelumnya."""
    if not sesi or not sesi.get("soal_teks"):
        return ""

    if time.time() - sesi.get("waktu", 0) > 3600:
        return ""

    teks = (
        "\n\nFOTO TERAKHIR YANG DIKIRIM PENGGUNA (hasil baca otomatis, bisa ada salah "
        "baca). Kalau pengguna bertanya soal \"soal tadi\", \"nomor sekian\", atau "
        "\"yang di foto\", rujuk ke sini:\n" + sesi["soal_teks"][:2500]
    )

    if sesi.get("jawaban_terkumpul"):
        teks += "\n\nJAWABAN YANG SUDAH KAMU BERIKAN UNTUK SOAL ITU:\n" + sesi["jawaban_terkumpul"][-1500:]

    return teks


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

    gambar_baru = image

    if image is None:
        image = ambil_gambar_history(history)

    kunci = kunci_sesi(user_id)

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

    # ---------------- SESI: FOTO BARU / "LANJUT" ----------------
    sesi = None

    if gambar_baru:
        hasil = tahap_gambar(pesan_text, gambar_baru, kunci)

        if hasil:
            return hasil
    else:
        sesi = ambil_sesi(kunci)

        if sesi and pesan_lanjut(pesan_text):
            hasil = lanjutkan_sesi(sesi, kunci, user_id)

            if hasil:
                return hasil

        # Pertanyaan tentang foto yang dikirim sebelumnya: pakai lagi fotonya.
        if image is None and sesi and sesi.get("image") and KATA_FOTO.search(pesan_text):
            image = sesi["image"]

    # ---------------- HISTORY ----------------
    hist = siapkan_history(history)

    # Hindari pesan ganda bila frontend sudah memasukkan pesan terbaru ke history.
    if hist and hist[-1]["role"] == "user" and hist[-1]["content"].strip() == pesan_text:
        hist = hist[:-1]

    messages = [
        {"role": "system", "content": buat_system_prompt(user_id) + konteks_sesi(sesi)}
    ]
    messages.extend(hist)
    messages.append({"role": "user", "content": buat_user_content(pesan_text, image)})

    # ---------------- MODEL ----------------
    if image:
        models = daftar_model(VISION_MODEL, FALLBACK_VISION_MODELS)
    else:
        models = daftar_model(MODEL, FALLBACK_TEXT_MODELS)

    _STATUS.dalam_kode = False

    jawaban, kode_error = panggil_model(messages, models)

    if jawaban:
        catat_jawaban(kunci, pesan_text, jawaban, getattr(_STATUS, "dalam_kode", False))
        return jawaban

    return pesan_error_pengguna(kode_error, bool(image))