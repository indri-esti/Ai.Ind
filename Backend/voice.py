import asyncio
import hashlib
import re
from collections import OrderedDict
from dataclasses import dataclass
from typing import Optional

import edge_tts
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

router = APIRouter()

# Suara perempuan Indonesia (Microsoft Neural, bukan Google).
# Suara dibuat di server, jadi di PC / HP / tablet hasilnya sama persis.
SUARA = "id-ID-GadisNeural"

# Suara per bahasa (semua perempuan, nuansa muda). Bahasa dideteksi otomatis
# per kalimat, jadi satu teks campur Indonesia-Inggris-Jawa tetap lancar.
SUARA_BAHASA = {
    "id": SUARA,
    "en": "en-US-AriaNeural",
    "jv": "jv-ID-SitiNeural",
    "su": "su-ID-TutiNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "hi": "hi-IN-SwaraNeural",
    "th": "th-TH-PremwadeeNeural",
}

# Nada sedikit dinaikkan supaya terdengar lebih muda (remaja),
# dan sedikit lebih cepat supaya santai seperti orang ngobrol.
# Kalau terdengar terlalu cempreng, turunkan NADA (mis. "+6Hz").
KECEPATAN = "+8%"
NADA = "+12Hz"

# Mode nyanyi (otomatis aktif kalau teks terdeteksi sebagai lirik):
# tiap baris dipecah jadi frasa pendek, tiap frasa punya nada berbeda
# (naik-turun seperti melodi), dan ujung baris ditahan lebih lambat.
KECEPATAN_NYANYI = "-10%"        # frasa di tengah baris
KECEPATAN_NYANYI_AKHIR = "-22%"  # ujung baris (nada ditahan)
# Pola melodi (Hz) yang berputar antar frasa. Nilai dijaga di rentang aman.
NADA_NYANYI = [24, 30, 27, 35, 29, 37, 26, 32]
TURUN_AKHIR_BARIS = 6            # ujung baris nadanya turun (kadens)
FRASA_MAKS_KATA = 5              # baris lebih dari ini dipecah jadi frasa
FRASA_IDEAL_KATA = 4

# Batas per permintaan (frontend mengirim teks panjang per potongan)
MAKS_KARAKTER = 5000

# Potongan pertama dibuat sangat pendek supaya suara langsung mulai,
# sisanya disintesis paralel di belakang layar.
SEGMEN_PERTAMA_MAKS = 60
SEGMEN_MAKS = 240
PARALEL = 3

# Cache audio di memori supaya teks yang sama langsung diputar tanpa menunggu
CACHE_MAKS_ITEM = 64
CACHE_MAKS_BYTE = 50 * 1024 * 1024
_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_cache_byte = 0

_HEADER = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}


class TTSRequest(BaseModel):
    text: str
    # Opsional: paksa bahasa (id, en, jv, su, ...). Kosong = deteksi otomatis.
    lang: Optional[str] = None
    # Opsional: "auto" (default), "nyanyi", atau "bicara"
    mode: str = "auto"


@dataclass
class Segmen:
    teks: str
    suara: str
    kecepatan: str
    nada: str


# ---------------------------------------------------------------------------
# Pembersihan teks
# ---------------------------------------------------------------------------

def bersihkan(teks: str) -> str:
    # Buang blok kode, link, emoji, dan simbol markdown
    teks = re.sub(r"```[\s\S]*?```", " ", teks)
    teks = re.sub(r"https?://\S+", " ", teks)
    teks = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]", " ", teks)
    teks = re.sub(r"^\s*[-•*#>]+\s*", "", teks, flags=re.MULTILINE)
    teks = re.sub(r"[`*_~|]", "", teks)
    # Titik-titik berulang bikin suara tersendat, ganti jeda pendek
    teks = re.sub(r"\.{2,}|…", ", ", teks)

    # Tiap baris jadi kalimat utuh supaya intonasinya natural (tidak terbata-bata)
    baris_bersih = []
    for baris in teks.split("\n"):
        baris = re.sub(r"[ \t]+", " ", baris).strip()
        if not baris:
            continue
        if baris[-1] not in ".!?,;:":
            baris += "."
        baris_bersih.append(baris)
    return " ".join(baris_bersih).strip()


# ---------------------------------------------------------------------------
# Deteksi bahasa
# ---------------------------------------------------------------------------

_KATA_EN = {
    "the", "is", "are", "was", "were", "and", "you", "your", "i", "my", "me",
    "we", "they", "he", "she", "it", "to", "of", "in", "on", "for", "with",
    "that", "this", "what", "how", "why", "when", "where", "can", "will",
    "would", "should", "have", "has", "had", "do", "does", "not", "but",
    "if", "so", "just", "like", "good", "please", "thanks", "thank", "hello",
    "hi", "yes", "no", "am", "be", "been", "at", "from", "about", "an", "or",
}

_KATA_JV = {
    "ora", "wis", "durung", "piye", "kowe", "sampeyan", "panjenengan", "iki",
    "iku", "kuwi", "ning", "neng", "karo", "lan", "nggih", "mboten", "matur",
    "nuwun", "sugeng", "wae", "tenan", "yo", "dadi", "kanggo", "saka", "soko",
    "kabeh", "opo", "ngopo", "pengen", "arep", "mangan", "turu", "lungo",
    "mulih", "ojo", "kudu", "iso", "isoh", "kae", "kono", "kene", "apik",
    "ayu", "lara", "seneng", "nyuwun", "pareng", "monggo", "dhuwur", "cilik",
}

_KATA_SU = {
    "teu", "abdi", "anjeun", "naon", "kumaha", "hatur", "nuhun", "punten",
    "urang", "geus", "aya", "jeung", "sareng", "téh", "mah", "wilujeng",
    "sampurasun", "kuring", "saha", "dimana", "iraha", "bageur", "geulis",
}

_KATA_ID = {
    "yang", "dan", "di", "ke", "dari", "ini", "itu", "untuk", "dengan", "aku",
    "kamu", "saya", "tidak", "ada", "apa", "bisa", "akan", "sudah", "juga",
    "pada", "adalah", "kalau", "jadi", "tapi", "atau", "karena", "sama",
    "mau", "gak", "nggak", "banget", "dong", "sih", "kok", "lagi", "belum",
    "bagaimana", "kenapa", "siapa", "dimana", "halo", "terima", "kasih",
}

_POLA_KANA = re.compile(r"[\u3040-\u30FF]")
_POLA_HANGUL = re.compile(r"[\uAC00-\uD7AF]")
_POLA_HAN = re.compile(r"[\u4E00-\u9FFF]")
_POLA_ARAB = re.compile(r"[\u0600-\u06FF]")
_POLA_DEVANAGARI = re.compile(r"[\u0900-\u097F]")
_POLA_THAI = re.compile(r"[\u0E00-\u0E7F]")


def _deteksi_bahasa(teks: str, paksa: Optional[str] = None) -> str:
    huruf = len(re.findall(r"[^\W\d_]", teks))

    # 1) Bahasa non-Latin dikenali dari aksaranya
    if huruf:
        kana = len(_POLA_KANA.findall(teks))
        han = len(_POLA_HAN.findall(teks))
        if kana and (kana + han) / huruf >= 0.4:
            return "ja"
        for kode, pola in (
            ("ko", _POLA_HANGUL),
            ("zh", _POLA_HAN),
            ("ar", _POLA_ARAB),
            ("hi", _POLA_DEVANAGARI),
            ("th", _POLA_THAI),
        ):
            if len(pola.findall(teks)) / huruf >= 0.4:
                return kode

    # 2) Kalau frontend memaksa bahasa, pakai itu
    if paksa:
        return paksa

    # 3) Bahasa Latin: hitung kata penciri
    kata = re.findall(r"[a-zà-ÿ']+", teks.lower())
    if not kata:
        return "id"

    skor = {
        "en": sum(k in _KATA_EN for k in kata),
        "jv": sum(k in _KATA_JV for k in kata),
        "su": sum(k in _KATA_SU for k in kata),
    }
    skor_id = sum(k in _KATA_ID for k in kata)

    terbaik = max(skor, key=lambda b: skor[b])
    if skor[terbaik] >= 1 and skor[terbaik] > skor_id:
        return terbaik
    return "id"


# ---------------------------------------------------------------------------
# Memecah teks jadi segmen
# ---------------------------------------------------------------------------

def _pecah_panjang(kalimat: str, batas: int) -> list:
    if len(kalimat) <= batas:
        return [kalimat]

    bagian = re.split(r"(?<=[,;:])\s+", kalimat)
    hasil, sekarang = [], ""
    for b in bagian:
        if sekarang and len(sekarang) + 1 + len(b) > batas:
            hasil.append(sekarang)
            sekarang = b
        else:
            sekarang = f"{sekarang} {b}".strip()
    if sekarang:
        hasil.append(sekarang)

    # Kalau masih terlalu panjang (tanpa tanda baca), potong di spasi
    akhir = []
    for h in hasil:
        while len(h) > batas:
            potong = h.rfind(" ", 0, batas)
            if potong <= 0:
                potong = batas
            akhir.append(h[:potong].strip())
            h = h[potong:].strip()
        if h:
            akhir.append(h)
    return akhir


def _segmen_bicara(teks: str, paksa: Optional[str]) -> list:
    kalimat = []
    for k in re.split(r"(?<=[.!?])\s+", teks):
        k = k.strip()
        if k:
            kalimat.extend(_pecah_panjang(k, SEGMEN_MAKS))

    gabungan = []  # [[bahasa, teks], ...]
    for k in kalimat:
        b = _deteksi_bahasa(k, paksa)
        if gabungan and gabungan[-1][0] == b:
            batas = SEGMEN_PERTAMA_MAKS if len(gabungan) == 1 else SEGMEN_MAKS
            if len(gabungan[-1][1]) + 1 + len(k) <= batas:
                gabungan[-1][1] += " " + k
                continue
        gabungan.append([b, k])

    # Segmen pertama dipaksa pendek supaya suara langsung mulai berbunyi
    if gabungan and len(gabungan[0][1]) > SEGMEN_PERTAMA_MAKS:
        bahasa_awal = gabungan[0][0]
        pecahan = _pecah_panjang(gabungan[0][1], SEGMEN_PERTAMA_MAKS)
        gabungan = [[bahasa_awal, p] for p in pecahan] + gabungan[1:]

    return [
        Segmen(t, SUARA_BAHASA.get(b, SUARA), KECEPATAN, NADA)
        for b, t in gabungan
    ]


# ---------------------------------------------------------------------------
# Mode nyanyi (lirik)
# ---------------------------------------------------------------------------

def _apakah_lirik(teks: str) -> bool:
    # Penanda lirik yang jelas: [Verse], [Chorus], [Reff], not musik, dll
    if re.search(
        r"\[\s*(verse|chorus|reff?|refrain|intro|bridge|outro|pre-?chorus|hook|bait)[^\]]*\]",
        teks,
        re.IGNORECASE,
    ):
        return True
    if re.search(r"[\u266A\u266B\U0001F3B5\U0001F3B6]", teks):
        return True

    baris = [b.strip() for b in teks.split("\n") if b.strip()]
    if len(baris) < 3:
        return False

    # Ciri bentuk lirik: banyak baris pendek tanpa tanda titik di akhir
    pendek = sum(
        1
        for b in baris
        if 2 <= len(b.split()) <= 9 and not re.search(r"[.!?:]$", b)
    )
    if len(baris) >= 4 and pendek / len(baris) >= 0.7:
        return True

    # Ada kata petunjuk (lirik / lagu / nyanyi) dan mayoritas baris pendek
    sangat_pendek = sum(1 for b in baris if 1 <= len(b.split()) <= 10)
    if (
        re.search(r"\b(lirik|lyrics?|nyanyi\w*|bernyanyi|lagu)\b", teks, re.IGNORECASE)
        and sangat_pendek / len(baris) >= 0.6
    ):
        return True

    # Lirik biasanya ada baris yang berulang (reff) dan semuanya pendek
    normal = [re.sub(r"\W+", " ", b.lower()).strip() for b in baris]
    ada_ulang = len(set(normal)) < len(normal)
    if len(baris) >= 6 and ada_ulang and sangat_pendek / len(baris) >= 0.8:
        return True

    return False


def _fmt_nada(hz: int) -> str:
    return f"{hz:+d}Hz"


def _pecah_frasa(baris: str) -> list:
    # Baris panjang dipecah jadi frasa pendek (3-5 kata) supaya tiap frasa
    # bisa diberi nada berbeda dan terdengar seperti melodi, bukan datar.
    kata = baris.split()
    if len(kata) <= FRASA_MAKS_KATA:
        return [baris]
    jumlah = -(-len(kata) // FRASA_IDEAL_KATA)  # pembulatan ke atas
    ukuran = -(-len(kata) // jumlah)
    return [
        " ".join(kata[i:i + ukuran])
        for i in range(0, len(kata), ukuran)
    ]


def _segmen_nyanyi(teks: str, paksa: Optional[str]) -> list:
    teks = re.sub(r"```[\s\S]*?```", " ", teks)
    teks = re.sub(r"https?://\S+", " ", teks)
    # Buang penanda seperti [Verse 1], [Chorus]
    teks = re.sub(r"\[[^\]\n]{1,40}\]", " ", teks)
    teks = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]", " ", teks)
    teks = re.sub(r"[`*_~|#>]", "", teks)

    segmen = []
    urutan = 0
    for baris in teks.split("\n"):
        baris = re.sub(r"\s+", " ", baris).strip(" -•")
        if not baris or not re.search(r"\w", baris):
            continue
        for potongan in _pecah_panjang(baris, SEGMEN_MAKS):
            frasa_list = _pecah_frasa(potongan)
            for i, frasa in enumerate(frasa_list):
                frasa = frasa.strip()
                if not frasa:
                    continue
                akhir_baris = i == len(frasa_list) - 1

                hz = NADA_NYANYI[urutan % len(NADA_NYANYI)]
                if akhir_baris:
                    # Ujung baris: nada turun dan ditahan lebih lama
                    hz -= TURUN_AKHIR_BARIS
                    kecepatan = KECEPATAN_NYANYI_AKHIR
                    if frasa[-1] not in ",.!?":
                        frasa += ","  # jeda tipis, seperti napas penyanyi
                else:
                    kecepatan = KECEPATAN_NYANYI

                b = _deteksi_bahasa(frasa, paksa)
                segmen.append(
                    Segmen(
                        frasa,
                        SUARA_BAHASA.get(b, SUARA),
                        kecepatan,
                        _fmt_nada(hz),
                    )
                )
                urutan += 1
    return segmen


def _buat_segmen(teks_mentah: str, mode: str, lang: Optional[str]) -> list:
    teks_mentah = (teks_mentah or "")[:MAKS_KARAKTER]
    paksa = lang if lang in SUARA_BAHASA else None

    if mode == "nyanyi":
        nyanyi = True
    elif mode == "bicara":
        nyanyi = False
    else:
        nyanyi = _apakah_lirik(teks_mentah)

    if nyanyi:
        segmen = _segmen_nyanyi(teks_mentah, paksa)
    else:
        segmen = _segmen_bicara(bersihkan(teks_mentah), paksa)

    if not segmen:
        raise HTTPException(status_code=400, detail="Teks kosong")
    return segmen


# ---------------------------------------------------------------------------
# Sintesis suara
# ---------------------------------------------------------------------------

# Penanda akhir aliran satu segmen
_SELESAI = object()
_GAGAL = object()


async def _produksi(segmen: Segmen, antrean: asyncio.Queue, batas: asyncio.Semaphore):
    # Potongan audio langsung dimasukkan ke antrean begitu datang dari layanan
    # suara (tidak menunggu satu segmen selesai), jadi suara bisa mulai
    # terdengar secepat mungkin. Coba ulang otomatis hanya jika belum ada
    # audio yang terkirim, supaya tidak ada potongan ganda / terbata-bata.
    terkirim = False
    berhasil = False
    try:
        async with batas:
            for percobaan in range(3):
                try:
                    komunikasi = edge_tts.Communicate(
                        segmen.teks,
                        segmen.suara,
                        rate=segmen.kecepatan,
                        pitch=segmen.nada,
                    )
                    async for potongan in komunikasi.stream():
                        if potongan["type"] == "audio" and potongan["data"]:
                            terkirim = True
                            await antrean.put(potongan["data"])
                    if terkirim:
                        berhasil = True
                        break
                except asyncio.CancelledError:
                    raise
                except Exception:
                    if terkirim:
                        break  # sudah ada audio terkirim, tidak bisa diulang
                await asyncio.sleep(0.15 * (percobaan + 1))
    finally:
        await antrean.put(_SELESAI if berhasil else _GAGAL)


async def _aliran_audio(segmen_list: list, status: dict):
    # Semua segmen disintesis paralel (maks PARALEL sekaligus),
    # tapi dikirim berurutan. Segmen pertama pendek dan dialirkan langsung,
    # jadi suara cepat mulai.
    batas = asyncio.Semaphore(PARALEL)
    antrean_list = [asyncio.Queue() for _ in segmen_list]
    tugas = [
        asyncio.create_task(_produksi(s, q, batas))
        for s, q in zip(segmen_list, antrean_list)
    ]
    try:
        for q in antrean_list:
            while True:
                item = await q.get()
                if item is _SELESAI:
                    break
                if item is _GAGAL:
                    status["lengkap"] = False
                    break
                yield item
    finally:
        for t in tugas:
            if not t.done():
                t.cancel()


def _kunci_cache(segmen_list: list) -> str:
    mentah = "||".join(
        f"{s.suara}|{s.kecepatan}|{s.nada}|{s.teks}" for s in segmen_list
    )
    return hashlib.sha1(mentah.encode("utf-8")).hexdigest()


def _simpan_cache(kunci: str, data: bytes) -> None:
    global _cache_byte
    if len(data) > CACHE_MAKS_BYTE // 4:
        return
    if kunci in _CACHE:
        _cache_byte -= len(_CACHE.pop(kunci))
    _CACHE[kunci] = data
    _cache_byte += len(data)
    while _CACHE and (
        len(_CACHE) > CACHE_MAKS_ITEM or _cache_byte > CACHE_MAKS_BYTE
    ):
        _, lama = _CACHE.popitem(last=False)
        _cache_byte -= len(lama)


async def _siapkan_stream(segmen_list: list):
    kunci = _kunci_cache(segmen_list)

    # Sudah pernah dibuat: langsung kirim, tanpa menunggu
    ada = _CACHE.get(kunci)
    if ada is not None:
        _CACHE.move_to_end(kunci)
        return Response(content=ada, media_type="audio/mpeg", headers=_HEADER)

    status = {"lengkap": True}
    gen = _aliran_audio(segmen_list, status)

    # Ambil potongan audio pertama dulu supaya error bisa dikembalikan
    # dengan benar, lalu sisanya dialirkan tanpa menunggu selesai.
    try:
        pertama = await gen.__anext__()
    except StopAsyncIteration:
        raise HTTPException(status_code=502, detail="Suara kosong")
    except Exception:
        raise HTTPException(status_code=502, detail="Gagal membuat suara")

    async def lanjut():
        kumpul = bytearray(pertama)
        yield pertama
        try:
            async for data in gen:
                kumpul.extend(data)
                yield data
        except Exception:
            return
        # Simpan ke cache hanya kalau semua potongan berhasil dan klien
        # mendengarkan sampai habis
        if status["lengkap"]:
            _simpan_cache(kunci, bytes(kumpul))

    return StreamingResponse(
        lanjut(),
        media_type="audio/mpeg",
        headers=_HEADER,
    )


@router.post("/tts")
async def tts(req: TTSRequest):
    segmen = _buat_segmen(req.text, req.mode, req.lang)
    return await _siapkan_stream(segmen)


# Versi GET: bisa langsung dipakai sebagai sumber <audio>/new Audio(url)
# sehingga suara mulai diputar saat potongan pertama datang.
@router.get("/tts")
async def tts_get(
    text: str = Query(..., max_length=MAKS_KARAKTER),
    lang: Optional[str] = Query(None),
    mode: str = Query("auto"),
):
    segmen = _buat_segmen(text, mode, lang)
    return await _siapkan_stream(segmen)