import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

MODEL = "openrouter/free"