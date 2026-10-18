import os
from dotenv import load_dotenv


# ==================================================
# BASE DIRECTORY
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


# ==================================================
# GROQ (satu-satunya provider AI yang dipakai ai.py)
# ==================================================

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"


# ==================================================
# MODEL TEXT
# ==================================================

MODEL = (
    os.getenv("GROQ_TEXT_MODEL") or "openai/gpt-oss-120b"
).strip()


# ==================================================
# MODEL VISION (analisis foto)
# ==================================================

VISION_MODEL = (
    os.getenv("GROQ_VISION_MODEL")
    or "qwen/qwen3.8-27b"
).strip()


# ==================================================
# KOMPATIBILITAS
# ==================================================

API_KEY = GROQ_API_KEY
BASE_URL = GROQ_BASE_URL


# ==================================================
# GOOGLE LOGIN
# ==================================================

GOOGLE_CLIENT_ID = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()


# ==================================================
# GEMINI (tidak dipakai ai.py; dibiarkan agar file lain tidak error)
# ==================================================

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()

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

IMAGE_MODEL = (os.getenv("IMAGE_MODEL") or "").strip()
