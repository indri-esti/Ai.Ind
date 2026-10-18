# ==================================================
# main.py
# Dialihkan ke ai.py (versi baru: fallback model,
# kompresi gambar, memory pengguna).
# Nama-nama lama tetap disediakan supaya file lain
# yang mengimpor dari main.py tidak error.
# ==================================================

from ai import (  # noqa: F401
    balas,
    bersihkan_jawaban,
    validasi_gambar,
    siapkan_history,
    ambil_waktu_retry,
    request_groq,
)

from config import VISION_MODEL  # noqa: F401
