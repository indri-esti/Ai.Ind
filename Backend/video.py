import os
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

router = APIRouter(tags=["AI Video"])
MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _generate_video(mode: str, prompt: str, image_bytes: bytes | None = None) -> bytes:
    token = os.getenv("HF_TOKEN", "").strip()
    if not token:
        raise RuntimeError(
            "Backend belum dikonfigurasi. Tambahkan HF_TOKEN sebagai Environment Variable di hosting backend."
        )

    try:
        from huggingface_hub import InferenceClient
    except ImportError as exc:
        raise RuntimeError(
            "Library huggingface_hub belum terpasang. Deploy ulang requirements.txt."
        ) from exc

    provider = os.getenv("HF_VIDEO_PROVIDER", "fal-ai").strip()
    client = InferenceClient(provider=provider, api_key=token, timeout=600)

    if mode == "text":
        model = os.getenv("HF_T2V_MODEL", "Wan-AI/Wan2.2-TI2V-5B")
        result = client.text_to_video(
            prompt,
            model=model,
            num_frames=49,
            num_inference_steps=30,
        )
    else:
        model = os.getenv("HF_I2V_MODEL", "Wan-AI/Wan2.2-I2V-A14B")
        result = client.image_to_video(
            image_bytes,
            model=model,
            prompt=prompt,
            num_frames=49,
            num_inference_steps=30,
        )

    if not isinstance(result, (bytes, bytearray)) or not result:
        raise RuntimeError("Layanan AI tidak mengembalikan file video.")
    return bytes(result)


@router.post("/video/generate")
async def generate_video(
    mode: str = Form(...),
    prompt: str = Form(...),
    image: UploadFile | None = File(default=None),
):
    mode = (mode or "").strip().lower()
    prompt = (prompt or "").strip()

    if mode not in {"text", "image"}:
        raise HTTPException(status_code=400, detail="Mode video tidak valid.")
    if not prompt:
        raise HTTPException(status_code=400, detail="Deskripsi video wajib diisi.")
    if len(prompt) > 1200:
        raise HTTPException(status_code=400, detail="Deskripsi maksimal 1.200 karakter.")

    image_bytes = None
    if mode == "image":
        if image is None:
            raise HTTPException(status_code=400, detail="Gambar awal wajib diunggah.")
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Format gambar harus JPG, PNG, atau WebP.")
        image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Ukuran gambar maksimal 8 MB.")

    try:
        video_bytes = await run_in_threadpool(_generate_video, mode, prompt, image_bytes)
    except Exception as exc:
        # Hindari mengirim detail konfigurasi internal atau token ke pengguna.
        message = str(exc)
        if "not configured" in message.lower() or "HF_TOKEN" in message:
            raise HTTPException(status_code=503, detail=message) from exc
        if "library huggingface_hub" in message.lower():
            raise HTTPException(status_code=503, detail=message) from exc
        raise HTTPException(
            status_code=502,
            detail=(
                "Layanan pembuat video sedang tidak tersedia atau kuota gratis habis. "
                "Coba lagi nanti. Detail: " + message[:350]
            ),
        ) from exc

    return StreamingResponse(
        BytesIO(video_bytes),
        media_type="video/mp4",
        headers={"Content-Disposition": 'attachment; filename="aiind-video.mp4"'},
    )
