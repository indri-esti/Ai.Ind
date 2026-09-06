import os
from dotenv import load_dotenv


# ==================================================
# BASE DIRECTORY
# ==================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

load_dotenv(
    os.path.join(BASE_DIR, ".env")
)


# ==================================================
# GROQ
# ==================================================

GROQ_API_KEY = (
    os.getenv("GROQ_API_KEY") or ""
).strip()

GROQ_BASE_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)


# ==================================================
# MODEL TEXT
# ==================================================

MODEL = (
    os.getenv(
        "GROQ_TEXT_MODEL"
    )
    or "openai/gpt-oss-20b"
).strip()


# ==================================================
# MODEL VISION
# ==================================================

VISION_MODEL = (
    os.getenv(
        "GROQ_VISION_MODEL"
    )
    or "qwen/qwen3.6-27b"
).strip()


# ==================================================
# KOMPATIBILITAS
# ==================================================

API_KEY = GROQ_API_KEY
BASE_URL = GROQ_BASE_URL


# ==================================================
# GOOGLE / GEMINI
# ==================================================

GEMINI_API_KEY = (
    os.getenv("GEMINI_API_KEY") or ""
).strip()

GOOGLE_CLIENT_ID = (
    os.getenv("GOOGLE_CLIENT_ID") or ""
).strip()

GEMINI_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)

GEMINI_MODEL = (
    os.getenv(
        "GEMINI_MODEL"
    )
    or "gemini-2.0-flash-lite"
).strip()


# ==================================================
# IMAGE GENERATION
# ==================================================
#
# Jangan diisi dengan GROQ_API_KEY.
#
# Groq dipakai AI.Ind untuk:
# - chat
# - coding
# - reasoning
# - vision
#
# IMAGE_PROVIDER disiapkan agar nanti endpoint
# image generation bisa ditambahkan tanpa
# mengubah sistem chat utama.
#

IMAGE_PROVIDER = (
    os.getenv(
        "IMAGE_PROVIDER"
    )
    or ""
).strip()

IMAGE_API_KEY = (
    os.getenv(
        "IMAGE_API_KEY"
    )
    or ""
).strip()

IMAGE_BASE_URL = (
    os.getenv(
        "IMAGE_BASE_URL"
    )
    or ""
).strip()

IMAGE_MODEL = (
    os.getenv(
        "IMAGE_MODEL"
    )
    or ""
).strip()