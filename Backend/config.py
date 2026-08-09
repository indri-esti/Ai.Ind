import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))


API_KEY = os.getenv("OPENROUTER_API_KEY")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


BASE_URL = "https://openrouter.ai/api/v1/chat/completions"


MODEL = "meta-llama/llama-3.2-3b-instruct:free"
