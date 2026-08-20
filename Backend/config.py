import os
from dotenv import load_dotenv

# ==================================================
# BASE DIRECTORY
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(
    os.path.join(BASE_DIR, ".env")
)


# ==================================================
# GROQ API
# ==================================================

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

GROQ_BASE_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)

# Model Groq
# Mendukung text + image input
MODEL = "openai/gpt-oss-20b"

# ==================================================
# GOOGLE
# ==================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID"
)


# ==================================================
# GEMINI
# ==================================================

GEMINI_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)

GEMINI_MODEL = "gemini-2.0-flash-lite"


# ==================================================
# KOMPATIBILITAS
# ==================================================

# Dipakai jika ada file lama yang masih
# mengimpor API_KEY atau BASE_URL.
API_KEY = GROQ_API_KEY
BASE_URL = GROQ_BASE_URL
