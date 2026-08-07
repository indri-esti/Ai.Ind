import json
import os

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
FILE = os.path.join(DATA_DIR, "memory.json")

MAX_HISTORY = 20


def load_memory():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(FILE):
        with open(FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False)

    try:
        with open(FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_memory(memory):
    os.makedirs(DATA_DIR, exist_ok=True)

    memory = memory[-MAX_HISTORY:]

    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, ensure_ascii=False, indent=4)


def add_message(role, content):
    memory = load_memory()

    memory.append({
        "role": role,
        "content": content
    })

    save_memory(memory)


def clear_memory():
    save_memory([])