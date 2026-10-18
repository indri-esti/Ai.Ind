import re

import edge_tts
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter()

# Suara perempuan Indonesia (Microsoft Neural)
SUARA = "id-ID-GadisNeural"

# Sedikit lebih cepat supaya terdengar santai seperti orang ngobrol
KECEPATAN = "+5%"
NADA = "+0Hz"

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


@router.post("/tts")
async def tts(req: TTSRequest):
    teks = bersihkan(req.text)[:MAKS_KARAKTER]

    if not teks:
        raise HTTPException(status_code=400, detail="Teks kosong")

    try:
        komunikasi = edge_tts.Communicate(
            teks, SUARA, rate=KECEPATAN, pitch=NADA
        )

        audio = bytearray()
        async for potongan in komunikasi.stream():
            if potongan["type"] == "audio":
                audio.extend(potongan["data"])
    except Exception:
        raise HTTPException(status_code=502, detail="Gagal membuat suara")

    if not audio:
        raise HTTPException(status_code=502, detail="Suara kosong")

    return Response(content=bytes(audio), media_type="audio/mpeg")
