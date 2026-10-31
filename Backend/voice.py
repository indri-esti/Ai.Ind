import re

import edge_tts
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

# Suara perempuan Indonesia (Microsoft Neural, bukan Google)
SUARA = "id-ID-GadisNeural"

# Nada sedikit dinaikkan supaya terdengar lebih muda (remaja),
# dan sedikit lebih cepat supaya santai seperti orang ngobrol.
# Kalau terdengar terlalu cempreng, turunkan NADA (mis. "+6Hz").
KECEPATAN = "+8%"
NADA = "+12Hz"

# Batas per permintaan (frontend mengirim teks panjang per potongan)
MAKS_KARAKTER = 5000


class TTSRequest(BaseModel):
    text: str


def bersihkan(teks: str) -> str:
    # Buang blok kode, link, emoji, dan simbol markdown
    teks = re.sub(r"```[\s\S]*?```", " ", teks)
    teks = re.sub(r"https?://\S+", " ", teks)
    teks = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]", " ", teks)
    teks = re.sub(r"^\s*[-•*#>]+\s*", "", teks, flags=re.MULTILINE)
    teks = re.sub(r"[`*_~|]", "", teks)
    teks = re.sub(r"[ \t]+", " ", teks)
    teks = re.sub(r"\n{2,}", ". ", teks)
    teks = teks.replace("\n", ", ")
    return teks.strip()


async def _aliran_audio(teks: str):
    komunikasi = edge_tts.Communicate(
        teks, SUARA, rate=KECEPATAN, pitch=NADA
    )

    async for potongan in komunikasi.stream():
        if potongan["type"] == "audio":
            yield potongan["data"]


async def _siapkan_stream(teks: str) -> StreamingResponse:
    gen = _aliran_audio(teks)

    # Ambil potongan audio pertama dulu supaya error bisa dikembalikan
    # dengan benar, lalu sisanya dialirkan tanpa menunggu selesai.
    try:
        pertama = await gen.__anext__()
    except StopAsyncIteration:
        raise HTTPException(status_code=502, detail="Suara kosong")
    except Exception:
        raise HTTPException(status_code=502, detail="Gagal membuat suara")

    async def lanjut():
        yield pertama
        try:
            async for data in gen:
                yield data
        except Exception:
            return

    return StreamingResponse(
        lanjut(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/tts")
async def tts(req: TTSRequest):
    teks = bersihkan(req.text)[:MAKS_KARAKTER]

    if not teks:
        raise HTTPException(status_code=400, detail="Teks kosong")

    return await _siapkan_stream(teks)


# Versi GET: bisa langsung dipakai sebagai sumber <audio>/new Audio(url)
# sehingga suara mulai diputar saat potongan pertama datang.
@router.get("/tts")
async def tts_get(text: str = Query(..., max_length=MAKS_KARAKTER)):
    teks = bersihkan(text)[:MAKS_KARAKTER]

    if not teks:
        raise HTTPException(status_code=400, detail="Teks kosong")

    return await _siapkan_stream(teks)