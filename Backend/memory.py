import json
import os
import re
import threading
from datetime import datetime, timezone


# ==================================================
# LOKASI DATA
# ==================================================
# Di hosting gratis, disk biasanya DIHAPUS setiap redeploy/restart.
# Arahkan DATA_DIR ke disk persisten (Persistent Disk / Volume) agar
# memory tidak hilang. Contoh: DATA_DIR=/var/data

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = (os.getenv("DATA_DIR") or "").strip() or os.path.join(BASE_DIR, "data")


# ==================================================
# LIMIT
# ==================================================

MAX_HISTORY = 30
MAX_LONG_TERM_MEMORY = 100
MAX_MEMORY_CHARS = 300
MAX_MEMORY_CONTEXT_CHARS = 3000
MAX_FAKTA_PER_PESAN = 5

_LOCK = threading.RLock()


# ==================================================
# FILE
# ==================================================

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def safe_user_id(user_id):
    if user_id is None:
        return "default"

    value = str(user_id).strip()

    if not value:
        return "default"

    value = re.sub(r"[^a-zA-Z0-9_.-]", "_", value)

    return value[:100]


def get_memory_file(user_id=None):
    ensure_data_dir()
    return os.path.join(DATA_DIR, f"memory_{safe_user_id(user_id)}.json")


def get_long_term_memory_file(user_id=None):
    ensure_data_dir()
    return os.path.join(DATA_DIR, f"long_memory_{safe_user_id(user_id)}.json")


def read_json(file, default):
    if not os.path.exists(file):
        return default

    try:
        with _LOCK:
            with open(file, "r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print("[Memory] JSON read error:", repr(e))
        return default


def write_json(file, data):
    ensure_data_dir()

    temporary_file = file + ".tmp"

    try:
        with _LOCK:
            with open(temporary_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            os.replace(temporary_file, file)

        return True

    except OSError as e:
        print("[Memory] JSON write error:", repr(e))

        try:
            if os.path.exists(temporary_file):
                os.remove(temporary_file)
        except OSError:
            pass

        return False


# ==================================================
# RIWAYAT CHAT (per chat)
# ==================================================

def _bersihkan_riwayat(items):
    result = []

    if not isinstance(items, list):
        return result

    for item in items:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in ("user", "assistant") or content is None:
            continue

        content = str(content).strip()

        if not content:
            continue

        result.append({"role": role, "content": content})

    return result[-MAX_HISTORY:]


def load_memory(user_id=None):
    data = read_json(get_memory_file(user_id), [])

    if isinstance(data, dict):
        data = data.get("history", [])

    return _bersihkan_riwayat(data)


def save_memory(memory, user_id=None):
    return write_json(get_memory_file(user_id), _bersihkan_riwayat(memory))


def add_message(role, content, user_id=None):
    if role not in ("user", "assistant") or content is None:
        return

    content = str(content).strip()

    if not content:
        return

    with _LOCK:
        memory = load_memory(user_id)
        memory.append({"role": role, "content": content})
        save_memory(memory, user_id)

    # Hanya pesan pengguna yang dipertimbangkan untuk memory jangka panjang.
    if role == "user":
        try:
            deteksi_memory_penting(content, user_id)
        except Exception as e:
            print("[Memory] Detection error:", repr(e))


# ==================================================
# MEMORY JANGKA PANJANG (lintas chat)
# ==================================================

def get_memory_data(user_id=None):
    data = read_json(get_long_term_memory_file(user_id), {"memories": []})

    memories = data.get("memories", []) if isinstance(data, dict) else []

    if not isinstance(memories, list):
        memories = []

    memories = [m for m in memories if isinstance(m, dict)]

    return {"memories": memories[-MAX_LONG_TERM_MEMORY:]}


def save_memory_data(data, user_id=None):
    memories = data.get("memories", []) if isinstance(data, dict) else []

    if not isinstance(memories, list):
        memories = []

    return write_json(
        get_long_term_memory_file(user_id),
        {"memories": memories[-MAX_LONG_TERM_MEMORY:]},
    )


def _normal(text):
    return re.sub(r"\s+", " ", str(text)).lower().strip()


def tambah_memory_penting(content, category="general", user_id=None, key=None):
    """key: bila diisi, memory lama dengan key sama diganti (mis. nama)."""

    if not content:
        return

    content = str(content).strip()

    if not content:
        return

    if len(content) > MAX_MEMORY_CHARS:
        content = content[:MAX_MEMORY_CHARS] + "..."

    if category not in ("preference", "project", "context", "goal", "identity", "general"):
        category = "general"

    with _LOCK:
        memories = get_memory_data(user_id)["memories"]

        if key:
            memories = [m for m in memories if m.get("key") != key]

        baru = _normal(content)

        for item in memories:
            if _normal(item.get("content", "")) == baru:
                save_memory_data({"memories": memories}, user_id)
                return

        entry = {
            "content": content,
            "category": category,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if key:
            entry["key"] = key

        memories.append(entry)

        save_memory_data({"memories": memories}, user_id)


# ==================================================
# DETEKSI INFORMASI PENTING
# ==================================================

STOP_NAMA = (
    r"\s+(?:dan|yang|tapi|dari|di|aku|saya|gue|gw|kelas|umur|usia|lahir|tinggal|"
    r"sekarang|ya|nih|kok|sih|dong|tolong|bisa|mau|ingin|and|from|i)\b"
)

KATA_BUKAN_NAMA = {
    "siapa", "apa", "apakah", "bagaimana", "gimana", "kenapa", "itu", "ini",
    "tidak", "gak", "nggak", "ga", "what", "who",
}

POLA_NAMA = [
    r"\bnama\s*(?:ku|saya|aku|gue|gw)\s*(?:adalah|itu|:|=)?\s*([^\n,.!?;]{2,40})",
    r"\b(?:aku|saya|gue|gw)\s+bernama\s+([^\n,.!?;]{2,40})",
    r"\bpanggil(?:lah)?\s+(?:aku|saya|gue|gw)\s+([^\n,.!?;]{2,40})",
    r"\bnama\s+panggilan\s*(?:ku|saya|aku)?\s*(?:adalah|:)?\s*([^\n,.!?;]{2,40})",
    r"\bmy name is\s+([^\n,.!?;]{2,40})",
    r"\bcall me\s+([^\n,.!?;]{2,40})",
]

POLA_FAKTA = [
    ("identity", r"\b(?:aku|saya|gue|gw)\s+(?:tinggal|berasal|asal|lahir|sekolah|bersekolah|kuliah|kerja|bekerja|kelas)\b"),
    ("identity", r"\b(?:umur|usia|pekerjaan|jurusan|sekolah|kampus|kota)\s*(?:ku|saya|aku)\b"),
    ("preference", r"\b(?:aku|saya|gue|gw)\s+(?:(?:lebih|paling|sangat)\s+)?(?:suka|senang|benci|tidak suka|gak suka|nggak suka|ga suka)\b"),
    ("preference", r"\b(?:hobi|favorit|kesukaan)\s*(?:ku|saya|aku)\b"),
    ("project", r"\b(?:project|projek|proyek|aplikasi|website|web|bot|game)\s*(?:ku|saya|aku)\b"),
    ("project", r"\b(?:aku|saya|gue|gw)\s+(?:sedang|lagi)?\s*(?:membuat|bikin|mengembangkan|membangun|ngoding)\b"),
    ("goal", r"\b(?:target|tujuan|rencana|cita-cita|impian)\s*(?:ku|saya|aku)\b"),
    ("goal", r"\b(?:aku|saya|gue|gw)\s+(?:ingin|mau|pengen)\s+(?:belajar|jadi|menjadi|punya|bisa)\b"),
    ("context", r"\b(?:aku|saya|gue|gw)\s+(?:sedang|lagi)?\s*(?:belajar|memakai|pakai|menggunakan)\b"),
]

POLA_INGAT = (
    r"\b(?:tolong\s+)?(?:ingat|ingatlah|catat)(?:\s+(?:ya|bahwa|kalau|kalo|ini))?\s*[:,]?\s+(.{5,300})"
)

# Jangan pernah simpan data rahasia.
POLA_RAHASIA = re.compile(
    r"(api[_ -]?key|password|kata sandi|\bsandi\b|\btoken\b|secret|gsk_|sk-[a-z0-9]|AIza|\b\d{12,}\b)",
    re.IGNORECASE,
)


def ekstrak_nama(text):
    """Return (nama, (awal, akhir)) atau (None, None)."""

    for pola in POLA_NAMA:
        m = re.search(pola, text, flags=re.IGNORECASE)

        if not m:
            continue

        mentah = m.group(1)
        pertama = re.split(STOP_NAMA, mentah, maxsplit=1, flags=re.IGNORECASE)[0]

        kata = pertama.strip(" -_'\"").split()[:3]

        if not kata or kata[0].lower() in KATA_BUKAN_NAMA:
            continue

        if not all(re.fullmatch(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.-]*", k) for k in kata):
            continue

        nama = " ".join(k.capitalize() for k in kata)

        return nama, (m.start(), m.start(1) + len(pertama))

    return None, None


def _rapikan_sisa(teks):
    """Bersihkan sisa kalimat setelah nama dipotong: 'Halo,   dan aku kelas 10' -> 'aku kelas 10'."""
    teks = re.sub(r"\s+", " ", teks).strip(" ,;-")
    teks = re.sub(r"^(?:halo|hai|hi|hello|hey|selamat\s+\w+)\s*[,!]?\s*", "", teks, flags=re.IGNORECASE)
    teks = re.sub(r"^(?:dan|tapi|yang|serta)\s+", "", teks, flags=re.IGNORECASE)
    return teks.strip(" ,;-")


def ekstrak_fakta(text):
    """Return list (category, content, key)."""

    hasil = []

    kalimat_list = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+|\n+", text)
        if s and s.strip()
    ]

    for kalimat in kalimat_list:
        if kalimat.endswith("?") or len(kalimat) < 8:
            continue

        if POLA_RAHASIA.search(kalimat):
            continue

        # 1. Nama
        nama, span = ekstrak_nama(kalimat)

        if nama:
            hasil.append(("identity", f"Nama pengguna adalah {nama}", "nama"))
            kalimat = _rapikan_sisa(kalimat[: span[0]] + " " + kalimat[span[1]:])

            if len(kalimat) < 8:
                continue

        # 2. Permintaan "ingat ..."
        m = re.search(POLA_INGAT, kalimat, flags=re.IGNORECASE)

        if m:
            hasil.append(("general", m.group(1).strip()[:MAX_MEMORY_CHARS], None))
            continue

        # 3. Fakta pribadi
        for kategori, pola in POLA_FAKTA:
            if re.search(pola, kalimat, flags=re.IGNORECASE):
                hasil.append((kategori, kalimat[:MAX_MEMORY_CHARS], None))
                break

    return hasil[:MAX_FAKTA_PER_PESAN]


def deteksi_memory_penting(content, user_id=None):
    if not content:
        return

    text = str(content).strip()

    if len(text) < 8:
        return

    for kategori, isi, key in ekstrak_fakta(text):
        tambah_memory_penting(isi, kategori, user_id, key)


# ==================================================
# BACA MEMORY
# ==================================================

def load_long_term_memory(user_id=None):
    result = []

    for item in get_memory_data(user_id)["memories"]:
        content = item.get("content")

        if not content:
            continue

        result.append({
            "content": str(content).strip(),
            "category": item.get("category", "general"),
            "created_at": item.get("created_at", ""),
            "key": item.get("key"),
        })

    return result[-MAX_LONG_TERM_MEMORY:]


def get_memory_context(user_id=None):
    memories = load_long_term_memory(user_id)

    if not memories:
        return ""

    baris = []
    total = 0

    # Nama selalu diprioritaskan, sisanya dari yang terbaru.
    urut = [m for m in memories if m.get("key") == "nama"]
    urut += [m for m in reversed(memories) if m.get("key") != "nama"]

    for item in urut:
        if item.get("key") == "nama":
            line = f"- {item['content']}"
        else:
            line = f"- [{item.get('category', 'general')}] {item['content']}"

        if total + len(line) > MAX_MEMORY_CONTEXT_CHARS:
            break

        baris.append(line)
        total += len(line)

    if not baris:
        return ""

    return "INFORMASI TENTANG PENGGUNA:\n" + "\n".join(baris)


# ==================================================
# HAPUS
# ==================================================

def clear_memory(user_id=None):
    save_memory([], user_id)


def clear_long_term_memory(user_id=None):
    file = get_long_term_memory_file(user_id)

    try:
        if os.path.exists(file):
            os.remove(file)
    except OSError as e:
        print("[Memory] Delete error:", repr(e))


def clear_all_memory(user_id=None):
    clear_memory(user_id)
    clear_long_term_memory(user_id)


def delete_user_memory(user_id):
    for file in (get_memory_file(user_id), get_long_term_memory_file(user_id)):
        try:
            if os.path.exists(file):
                os.remove(file)
        except OSError as e:
            print("[Memory] Delete error:", repr(e))
