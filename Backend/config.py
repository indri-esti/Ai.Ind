import os
from dotenv import load_dotenv


# ==================================================
# BASE DIRECTORY
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


# ==================================================
# GROQ
# ==================================================

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"


# ==================================================
# MODEL TEXT
# ==================================================

MODEL = (
    os.getenv("GROQ_TEXT_MODEL") or "openai/gpt-oss-20b"
).strip()


# ==================================================
# MODEL VISION (analisis foto)
# ==================================================

VISION_MODEL = (
    os.getenv("GROQ_VISION_MODEL")
    or "meta-llama/llama-4-scout-17b-16e-instruct"
).strip()


# ==================================================
# KOMPATIBILITAS
# ==================================================

API_KEY = GROQ_API_KEY
BASE_URL = GROQ_BASE_URL


# ==================================================
# GOOGLE / GEMINI
# ==================================================

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()

GOOGLE_CLIENT_ID = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

GEMINI_MODEL = (
    os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
).strip()


# ==================================================
# IMAGE GENERATION (belum dipakai)
# ==================================================

IMAGE_PROVIDER = (os.getenv("IMAGE_PROVIDER") or "").strip()

IMAGE_API_KEY = (os.getenv("IMAGE_API_KEY") or "").strip()

IMAGE_BASE_URL = (os.getenv("IMAGE_BASE_URL") or "").strip()

# Bug lama: ada koma di akhir yang membuat nilainya jadi tuple. Sudah dihapus.
IMAGE_MODEL = (os.getenv("IMAGE_MODEL") or "").strip()
