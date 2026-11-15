import math
import os
import tempfile
from io import BytesIO

from dotenv import load_dotenv
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

# Pastikan Backend/.env selalu terbaca di file ini, tanpa bergantung
# pada urutan import file lain.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

router = APIRouter(tags=["AI Video"])
MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Jalur gratis: memanggil Hugging Face Space (ZeroGPU) lewat gradio_client.
# Space bisa diganti lewat Environment Variable HF_VIDEO_SPACE bila perlu.
# Space ini punya endpoint /generate_video untuk text-to-video dan image-to-video.
DEFAULT_VIDEO_SPACE = "Upsampler/wan-2-2-5b-video"
VIDEO_API_NAME = "/generate_video"
VIDEO_DURATION_SECONDS = 3.0
VIDEO_STEPS = 4
VIDEO_BASE_AREA = 512 * 512
VIDEO_TIMEOUT_SECONDS = 600


class VideoUnavailable(Exception):
    """Error yang pesannya aman ditampilkan langsung ke pengguna."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _target_size(image_bytes: bytes | None) -> tuple[int, int]:
    """Kembalikan (tinggi, lebar) kelipatan 32, sesuai rasio gambar bila ada."""
    default = (512, 512)
    if not image_bytes:
        return default
    try:
        from PIL import Image

        with Image.open(BytesIO(image_bytes)) as im:
            w, h = im.size
    except Exception:
        return default
    if w <= 0 or h <= 0:
        return default

    ratio = h / w
    th = round(math.sqrt(VIDEO_BASE_AREA * ratio))
    tw = round(math.sqrt(VIDEO_BASE_AREA / ratio))
    th = min(1024, max(256, (th // 32) * 32))
    tw = min(1024, max(256, (tw // 32) * 32))
    return th, tw


def _image_suffix(image_bytes: bytes) -> str:
    if image_bytes.startswith(b"\x89PNG"):
        return ".png"
    if image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        return ".webp"
    return ".jpg"


def _generate_video(mode: str, prompt: str, image_bytes: bytes | None = None) -> bytes:
    token = os.getenv("HF_TOKEN", "").strip()
    if not token:
        raise RuntimeError(
            "Backend belum dikonfigurasi. Tambahkan HF_TOKEN sebagai Environment Variable di hosting backend."
        )

    try:
        from gradio_client import Client, handle_file
    except ImportError as exc:
        raise RuntimeError(
            "Library gradio_client belum terpasang. Tambahkan gradio_client ke requirements.txt lalu deploy ulang."
        ) from exc

    space = os.getenv("HF_VIDEO_SPACE", DEFAULT_VIDEO_SPACE).strip() or DEFAULT_VIDEO_SPACE
    height, width = _target_size(image_bytes if mode == "image" else None)

    image_path = None
    try:
        if mode == "image" and image_bytes:
            with tempfile.NamedTemporaryFile(
                suffix=_image_suffix(image_bytes), delete=False
            ) as tmp:
                tmp.write(image_bytes)
                image_path = tmp.name

        try:
            try:
                client = Client(space, token=token)
            except TypeError:
                # gradio_client versi lama memakai nama parameter hf_token.
                client = Client(space, hf_token=token)

            job = client.submit(
                input_image=handle_file(image_path) if image_path else None,
                prompt=prompt,
                height=height,
                width=width,
                negative_prompt="",
                duration_seconds=VIDEO_DURATION_SECONDS,
                guidance_scale=0.0,
                steps=VIDEO_STEPS,
                seed=42,
                randomize_seed=True,
                api_name=VIDEO_API_NAME,
            )
            result = job.result(timeout=VIDEO_TIMEOUT_SECONDS)
        except VideoUnavailable:
            raise
        except Exception as exc:
            text = str(exc)
            low = text.lower()
            if "quota" in low or "zerogpu" in low or "exceeded" in low:
                raise VideoUnavailable(
                    429,
                    "Kuota GPU gratis hari ini habis. Coba lagi besok (reset tiap 24 jam).",
                ) from exc
            if (
                "could not get" in low
                or "runtime" in low
                or "sleeping" in low
                or "paused" in low
                or "not found" in low
                or "connection" in low
            ):
                raise VideoUnavailable(
                    503,
                    "Space pembuat video sedang mati atau tidak ditemukan. "
                    "Ganti Space lewat HF_VIDEO_SPACE di Environment Variable hosting.",
                ) from exc
            raise
    finally:
        if image_path:
            try:
                os.remove(image_path)
            except OSError:
                pass

    video = result[0] if isinstance(result, (list, tuple)) and result else result
    if isinstance(video, dict):
        video = video.get("video") or video.get("path")
    if not isinstance(video, str) or not os.path.isfile(video):
        raise RuntimeError("Layanan AI tidak mengembalikan file video.")

    with open(video, "rb") as f:
        data = f.read()
    try:
        os.remove(video)
    except OSError:
        pass

    if not data:
        raise RuntimeError("Layanan AI tidak mengembalikan file video.")
    return data


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
    except VideoUnavailable as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except Exception as exc:
        # Hindari mengirim detail konfigurasi internal atau token ke pengguna.
        message = str(exc)
        if "not configured" in message.lower() or "HF_TOKEN" in message:
            raise HTTPException(status_code=503, detail=message) from exc
        if "library gradio_client" in message.lower():
            raise HTTPException(status_code=503, detail=message) from exc
        raise HTTPException(
            status_code=502,
            detail=(
                "Layanan pembuat video sedang tidak tersedia. "
                "Coba lagi nanti. Detail: " + message[:350]
            ),
        ) from exc

    return StreamingResponse(
        BytesIO(video_bytes),
        media_type="video/mp4",
        headers={"Content-Disposition": 'attachment; filename="aiind-video.mp4"'},
    )
