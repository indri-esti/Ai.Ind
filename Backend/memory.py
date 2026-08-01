import json
import os

BASE_DIR = os.path.dirname(__file__)

DATA_DIR = os.path.join(BASE_DIR, "data")

FILE = os.path.join(DATA_DIR, "memory.json")


def load_memory():

    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(FILE):

        with open(FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

    with open(FILE, "r", encoding="utf-8") as f:

        try:
            return json.load(f)
        except:
            return []


def save_memory(memory):

    os.makedirs(DATA_DIR, exist_ok=True)

    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, ensure_ascii=False, indent=4)