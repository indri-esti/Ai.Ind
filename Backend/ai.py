import base64
import json
import re
import time
from typing import Any

import requests

from config import (
    API_KEY,
    BASE_URL,
    MODEL,
    VISION_MODEL,
)

from prompt import SYSTEM_PROMPT
from memory import get_memory_context


# ==================================================
# KONFIGURASI
# ==================================================

MAX_HISTORY_CHARS = 20000

MAX_MESSAGE_CHARS = 6000

MAX_OUTPUT_TOKENS = 4096

MAX_RETRIES = 3

MAX_RETRY_WAIT = 65

REQUEST_TIMEOUT = 120

MAX_IMAGE_CHARS = 20_000_000

MAX_MEMORY_CONTEXT_CHARS = 8000


# ==================================================
# MODEL
# ==================================================

TEXT_MODEL = MODEL

IMAGE_MODEL = VISION_MODEL


# ==================================================
# BERSIHKAN JAWABAN
# ==================================================

def bersihkan_jawaban(teks):

    if teks is None:
        return ""

    if not isinstance(teks, str):
        teks = str(teks)

    # --------------------------------------------------
    # THINK TAG
    # --------------------------------------------------

    teks = re.sub(
        r"<think>.*?</think>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"<think>.*$",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"</think>",
        "",
        teks,
        flags=re.IGNORECASE
    )

    # --------------------------------------------------
    # ANALYSIS / REASONING TAG
    # --------------------------------------------------

    teks = re.sub(
        r"<analysis>.*?</analysis>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    teks = re.sub(
        r"<reasoning>.*?</reasoning>",
        "",
        teks,
        flags=re.DOTALL | re.IGNORECASE
    )

    # --------------------------------------------------
    # HAPUS INTERNAL PROCESS
    # --------------------------------------------------

    teks = re.sub(
        r"^\s*(thinking process|chain of thought|"
        r"internal reasoning|internal analysis)\s*:?.*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # --------------------------------------------------
    # SAFETY STATUS
    # --------------------------------------------------

    teks = re.sub(
        r"^\s*(User Safety|Response Safety)\s*:\s*safe\s*$",
        "",
        teks,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # --------------------------------------------------
    # RAPATKAN BARIS
    # --------------------------------------------------

    teks = re.sub(
        r"\n{3,}",
        "\n\n",
        teks
    )

    return teks.strip()


# ==================================================
# EKSTRAK CONTENT
# ==================================================

def ekstrak_teks_content(content):

    if content is None:
        return ""

    if isinstance(
        content,
        str
    ):

        return content.strip()

    if isinstance(
        content,
        list
    ):

        bagian = []

        for part in content:

            if isinstance(
                part,
                str
            ):

                bagian.append(
                    part
                )

                continue

            if not isinstance(
                part,
                dict
            ):

                continue

            part_type = (
                part.get("type")
                or ""
            )

            if part_type in (
                "text",
                "output_text"
            ):

                value = (
                    part.get("text")
                    or ""
                )

                if value:
                    bagian.append(
                        str(value)
                    )

        return "\n".join(
            bagian
        ).strip()

    return ""


# ==================================================
# VALIDASI GAMBAR
# ==================================================

def validasi_gambar(image):

    if image is None:
        return None

    if not isinstance(
        image,
        str
    ):

        raise ValueError(
            "Format gambar tidak valid."
        )

    image = image.strip()

    if not image:
        return None

    # --------------------------------------------------
    # DATA URL
    # --------------------------------------------------

    if not image.lower().startswith(
        "data:image/"
    ):

        raise ValueError(
            "Gambar harus dikirim dalam format "
            "data:image/...;base64,..."
        )

    if ";base64," not in image.lower():

        raise ValueError(
            "Data gambar bukan Base64 yang valid."
        )

    # --------------------------------------------------
    # HEADER
    # --------------------------------------------------

    try:

        header, encoded = image.split(
            ",",
            1
        )

    except ValueError:

        raise ValueError(
            "Data gambar tidak valid."
        )

    header_lower = (
        header.lower()
    )

    allowed_types = (
        "data:image/jpeg;base64",
        "data:image/jpg;base64",
        "data:image/png;base64",
        "data:image/webp;base64",
        "data:image/gif;base64",
    )

    if not header_lower.startswith(
        allowed_types
    ):

        raise ValueError(
            "Format gambar tidak didukung. "
            "Gunakan JPG, PNG, WEBP, atau GIF."
        )

    # --------------------------------------------------
    # UKURAN
    # --------------------------------------------------

    if len(image) > MAX_IMAGE_CHARS:

        raise ValueError(
            "Ukuran gambar terlalu besar. "
            "Kompres gambar terlebih dahulu."
        )

    # --------------------------------------------------
    # BASE64
    # --------------------------------------------------

    encoded = encoded.strip()

    if not encoded:

        raise ValueError(
            "Data gambar kosong."
        )

    try:

        base64.b64decode(
            encoded,
            validate=True
        )

    except Exception:

        raise ValueError(
            "Data Base64 gambar tidak valid."
        )

    return image


# ==================================================
# HISTORY
# ==================================================

def siapkan_history(history):

    if not isinstance(
        history,
        list
    ):

        return []

    hasil = []

    total_chars = 0

    # Pesan terbaru diprioritaskan.
    for item in reversed(history):

        if not isinstance(
            item,
            dict
        ):

            continue

        role = item.get(
            "role"
        )

        content = item.get(
            "content"
        )

        if role not in (
            "user",
            "assistant"
        ):

            continue

        if content is None:
            continue

        # --------------------------------------------------
        # CONTENT LIST
        # --------------------------------------------------

        if isinstance(
            content,
            list
        ):

            content = (
                ekstrak_teks_content(
                    content
                )
            )

        else:

            content = str(
                content
            )

        content = content.strip()

        if not content:
            continue

        # --------------------------------------------------
        # BATAS PER PESAN
        # --------------------------------------------------

        if len(content) > MAX_MESSAGE_CHARS:

            content = (
                content[:MAX_MESSAGE_CHARS]
                + "\n[Pesan dipersingkat]"
            )

        tambahan = len(
            content
        )

        # --------------------------------------------------
        # BATAS TOTAL
        # --------------------------------------------------

        if (
            total_chars
            + tambahan
            > MAX_HISTORY_CHARS
        ):

            sisa = (
                MAX_HISTORY_CHARS
                - total_chars
            )

            if sisa > 200:

                content = (
                    content[:sisa]
                    + "\n[History dipersingkat]"
                )

                hasil.append({
                    "role": role,
                    "content": content
                })

            break

        hasil.append({
            "role": role,
            "content": content
        })

        total_chars += len(
            content
        )

    hasil.reverse()

    return hasil


# ==================================================
# MEMORY
# ==================================================

def siapkan_memory_context(
    user_id=None
):

    if user_id is None:
        return ""

    try:

        memory = (
            get_memory_context(
                user_id
            )
        )

    except Exception as e:

        print(
            "[Memory] Error:",
            repr(e)
        )

        return ""

    if not memory:
        return ""

    memory = str(
        memory
    ).strip()

    if len(memory) > MAX_MEMORY_CONTEXT_CHARS:

        memory = (
            memory[
                :MAX_MEMORY_CONTEXT_CHARS
            ]
            + "\n[Memory dipersingkat]"
        )

    return memory


# ==================================================
# RETRY TIME
# ==================================================

def ambil_waktu_retry(
    response
):

    if response is None:
        return 5

    # --------------------------------------------------
    # HEADER
    # --------------------------------------------------

    try:

        retry_after = (
            response.headers.get(
                "Retry-After"
            )
        )

    except Exception:

        retry_after = None

    if retry_after:

        try:

            seconds = float(
                retry_after
            )

            return min(
                max(
                    seconds + 1,
                    2
                ),
                MAX_RETRY_WAIT
            )

        except (
            ValueError,
            TypeError
        ):

            pass

    # --------------------------------------------------
    # BODY
    # --------------------------------------------------

    try:

        text = (
            response.text
            or ""
        )

    except Exception:

        text = ""

    patterns = [

        r"try again in\s+([\d.]+)s",

        r"retry after\s+([\d.]+)s",

        r"retry-after[:\s]+([\d.]+)",

        r"wait\s+([\d.]+)s",

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        if match:

            try:

                seconds = float(
                    match.group(1)
                )

                return min(
                    max(
                        seconds + 1,
                        2
                    ),
                    MAX_RETRY_WAIT
                )

            except (
                ValueError,
                TypeError
            ):

                pass

    return 5


# ==================================================
# REQUEST GROQ
# ==================================================

def request_groq(
    headers,
    data
):

    last_response = None

    for attempt in range(
        MAX_RETRIES
    ):

        try:

            response = requests.post(
                BASE_URL,
                headers=headers,
                json=data,
                timeout=REQUEST_TIMEOUT
            )

            last_response = response

            # --------------------------------------------------
            # BERHASIL
            # --------------------------------------------------

            if response.status_code == 200:

                return response

            # --------------------------------------------------
            # RATE LIMIT
            # --------------------------------------------------

            if response.status_code == 429:

                print(
                    f"[Groq] 429 "
                    f"{attempt + 1}/{MAX_RETRIES}"
                )

                if (
                    attempt
                    >= MAX_RETRIES - 1
                ):

                    return response

                wait_time = (
                    ambil_waktu_retry(
                        response
                    )
                )

                print(
                    f"[Groq] Retry dalam "
                    f"{wait_time:.1f} detik"
                )

                time.sleep(
                    wait_time
                )

                continue

            # --------------------------------------------------
            # SERVER ERROR
            # --------------------------------------------------

            if response.status_code >= 500:

                print(
                    f"[Groq] Server error "
                    f"{response.status_code}"
                )

                if (
                    attempt
                    >= MAX_RETRIES - 1
                ):

                    return response

                time.sleep(
                    min(
                        2 ** attempt,
                        8
                    )
                )

                continue

            # --------------------------------------------------
            # CLIENT ERROR
            # --------------------------------------------------

            return response

        except requests.exceptions.Timeout:

            print(
                "[Groq] Timeout"
            )

            if (
                attempt
                >= MAX_RETRIES - 1
            ):

                return None

            time.sleep(
                2 ** attempt
            )

        except requests.exceptions.ConnectionError:

            print(
                "[Groq] Connection error"
            )

            if (
                attempt
                >= MAX_RETRIES - 1
            ):

                return None

            time.sleep(
                2 ** attempt
            )

        except requests.exceptions.RequestException as e:

            print(
                "[Groq] Request exception:",
                repr(e)
            )

            return None

        except Exception as e:

            print(
                "[Groq] Unexpected request error:",
                repr(e)
            )

            return None

    return last_response


# ==================================================
# PARSE ERROR API
# ==================================================

def ambil_error_api(
    response
):

    if response is None:
        return ""

    try:

        data = response.json()

    except Exception:

        return (
            response.text
            or ""
        )

    if not isinstance(
        data,
        dict
    ):

        return ""

    error = data.get(
        "error"
    )

    if isinstance(
        error,
        dict
    ):

        return str(
            error.get(
                "message",
                ""
            )
        )

    if error:

        return str(
            error
        )

    return ""


# ==================================================
# EKSTRAK JAWABAN GROQ
# ==================================================

def ekstrak_jawaban_groq(
    data
):

    if not isinstance(
        data,
        dict
    ):

        return ""

    choices = data.get(
        "choices"
    )

    if not isinstance(
        choices,
        list
    ) or not choices:

        return ""

    first = choices[0]

    if not isinstance(
        first,
        dict
    ):

        return ""

    message = first.get(
        "message"
    )

    if not isinstance(
        message,
        dict
    ):

        return ""

    content = message.get(
        "content"
    )

    # --------------------------------------------------
    # NORMAL CONTENT
    # --------------------------------------------------

    answer = (
        ekstrak_teks_content(
            content
        )
    )

    if answer:
        return answer

    # --------------------------------------------------
    # BEBERAPA MODEL DAPAT MENGEMBALIKAN
    # ALTERNATIVE FIELD
    # --------------------------------------------------

    for key in (
        "text",
        "output_text",
        "reasoning_content"
    ):

        value = message.get(
            key
        )

        if value:

            answer = (
                ekstrak_teks_content(
                    value
                )
            )

            if answer:
                return answer

    return ""


# ==================================================
# BANGUN SYSTEM PROMPT
# ==================================================

def buat_system_prompt(
    user_id=None
):

    system_prompt = str(
        SYSTEM_PROMPT
    ).strip()

    memory_context = (
        siapkan_memory_context(
            user_id
        )
    )

    if memory_context:

        system_prompt += (

            "\n\n"
            "==================================================\n"
            "MEMORY RELEVAN PENGGUNA\n"
            "==================================================\n"

            + memory_context

            + "\n\n"
            "Gunakan memory hanya jika relevan. "
            "Jangan menyebut sistem memory internal "
            "kepada pengguna."
        )

    return system_prompt


# ==================================================
# BANGUN USER CONTENT
# ==================================================

def buat_user_content(
    pesan_text,
    image
):

    if not image:

        return pesan_text

    return [

        {
            "type": "text",
            "text": pesan_text
        },

        {
            "type": "image_url",
            "image_url": {
                "url": image
            }
        }

    ]


# ==================================================
# BALAS AI
# ==================================================

def balas(
    pesan,
    history=None,
    image=None,
    user_id=None
):

    # ==================================================
    # API KEY
    # ==================================================

    if not API_KEY:

        return (
            "API Key Groq belum tersedia. "
            "Pastikan GROQ_API_KEY sudah diatur "
            "di file .env."
        )

    # ==================================================
    # HISTORY
    # ==================================================

    if not isinstance(
        history,
        list
    ):

        history = []

    # ==================================================
    # VALIDASI IMAGE
    # ==================================================

    try:

        image = validasi_gambar(
            image
        )

    except ValueError as e:

        print(
            "[AI.Ind] Image validation:",
            str(e)
        )

        return str(e)

    # ==================================================
    # PESAN
    # ==================================================

    if pesan is None:

        pesan_text = ""

    else:

        pesan_text = str(
            pesan
        ).strip()

    # ==================================================
    # GAMBAR TANPA TEKS
    # ==================================================

    if (
        not pesan_text
        and image
    ):

        pesan_text = (
            "Analisis gambar ini. "
            "Jelaskan informasi penting yang terlihat "
            "dan jawab berdasarkan isi gambar. "
            "Jangan mengarang bagian yang tidak terlihat."
        )

    # ==================================================
    # KOSONG
    # ==================================================

    if (
        not pesan_text
        and not image
    ):

        return (
            "Silakan tulis pertanyaan atau kirim "
            "gambar yang ingin dianalisis."
        )

    # ==================================================
    # SYSTEM
    # ==================================================

    system_prompt = (
        buat_system_prompt(
            user_id
        )
    )

    messages = [

        {
            "role":
                "system",

            "content":
                system_prompt
        }

    ]

    # ==================================================
    # HISTORY
    # ==================================================

    messages.extend(
        siapkan_history(
            history
        )
    )

    # ==================================================
    # USER
    # ==================================================

    user_content = (
        buat_user_content(
            pesan_text,
            image
        )
    )

    messages.append({

        "role":
            "user",

        "content":
            user_content

    })

    # ==================================================
    # PILIH MODEL
    # ==================================================

    if image:

        request_model = (
            IMAGE_MODEL
        )

    else:

        request_model = (
            TEXT_MODEL
        )

    print(
        "[AI.Ind] Model:",
        request_model
    )

    print(
        "[AI.Ind] Vision:",
        bool(image)
    )

    # ==================================================
    # HEADERS
    # ==================================================

    headers = {

        "Authorization":
            f"Bearer {API_KEY}",

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

    }

    # ==================================================
    # REQUEST DATA
    # ==================================================

    data = {

        "model":
            request_model,

        "messages":
            messages,

        "max_completion_tokens":
            MAX_OUTPUT_TOKENS,

        "temperature":
            0.4,

    }

    # ==================================================
    # REQUEST
    # ==================================================

    try:

        response = request_groq(
            headers,
            data
        )

        # ==================================================
        # NO RESPONSE
        # ==================================================

        if response is None:

            return (
                "AI.Ind tidak dapat terhubung ke "
                "server AI. Periksa koneksi internet "
                "atau backend lalu coba lagi."
            )

        # ==================================================
        # RATE LIMIT
        # ==================================================

        if response.status_code == 429:

            print(
                "========== GROQ 429 =========="
            )

            print(
                response.text
            )

            print(
                "=============================="
            )

            return (
                "AI.Ind sedang terlalu sibuk. "
                "Tunggu sebentar lalu coba lagi."
            )

        # ==================================================
        # SERVER ERROR
        # ==================================================

        if response.status_code >= 500:

            print(
                "========== GROQ SERVER ERROR =========="
            )

            print(
                response.status_code
            )

            print(
                response.text
            )

            print(
                "========================================"
            )

            return (
                "Server AI sedang mengalami gangguan. "
                "Coba lagi sebentar."
            )

        # ==================================================
        # CLIENT ERROR
        # ==================================================

        if response.status_code != 200:

            error_message = (
                ambil_error_api(
                    response
                )
            )

            print(
                "========== GROQ CLIENT ERROR =========="
            )

            print(
                "STATUS:",
                response.status_code
            )

            print(
                "ERROR:",
                error_message
            )

            print(
                "RAW:",
                response.text
            )

            print(
                "========================================"
            )

            if image:

                return (
                    "Gambar belum dapat diproses. "
                    "Pastikan gambar JPG, PNG, WEBP, "
                    "atau GIF dan ukurannya tidak terlalu besar."
                )

            return (
                "AI.Ind belum dapat memproses "
                "permintaan tersebut. Coba lagi."
            )

        # ==================================================
        # JSON
        # ==================================================

        try:

            result = response.json()

        except ValueError:

            print(
                "[AI.Ind] Invalid JSON:",
                response.text
            )

            return (
                "Respons dari server AI tidak valid. "
                "Coba kirim ulang pesan."
            )

        # ==================================================
        # API ERROR
        # ==================================================

        if isinstance(
            result,
            dict
        ):

            if result.get(
                "error"
            ):

                print(
                    "[AI.Ind] API error:",
                    result.get("error")
                )

                return (
                    "AI.Ind mengalami kendala "
                    "saat memproses permintaan."
                )

        # ==================================================
        # EXTRACT ANSWER
        # ==================================================

        jawaban = (
            ekstrak_jawaban_groq(
                result
            )
        )

        # ==================================================
        # EMPTY
        # ==================================================

        if not jawaban:

            print(
                "[AI.Ind] Empty answer:"
            )

            print(
                json.dumps(
                    result,
                    ensure_ascii=False
                )[:5000]
            )

            return (
                "AI.Ind belum mendapatkan jawaban. "
                "Coba kirim pertanyaan sekali lagi."
            )

        # ==================================================
        # CLEAN
        # ==================================================

        jawaban = (
            bersihkan_jawaban(
                jawaban
            )
        )

        # ==================================================
        # FINAL
        # ==================================================

        if not jawaban:

            return (
                "AI.Ind belum menghasilkan jawaban "
                "yang dapat ditampilkan."
            )

        return jawaban

    # ==================================================
    # TIMEOUT
    # ==================================================

    except requests.exceptions.Timeout:

        print(
            "[AI.Ind] Timeout"
        )

        return (
            "Respons AI terlalu lama. "
            "Coba kirim lagi."
        )

    # ==================================================
    # CONNECTION
    # ==================================================

    except requests.exceptions.ConnectionError:

        print(
            "[AI.Ind] Connection error"
        )

        return (
            "Koneksi ke server AI terputus. "
            "Periksa internet dan coba lagi."
        )

    # ==================================================
    # REQUEST
    # ==================================================

    except requests.exceptions.RequestException as e:

        print(
            "[AI.Ind] Request error:",
            repr(e)
        )

        return (
            "Terjadi kesalahan saat menghubungi "
            "server AI. Coba lagi."
        )

    # ==================================================
    # JSON / PROGRAM ERROR
    # ==================================================

    except (
        ValueError,
        TypeError,
        KeyError
    ) as e:

        print(
            "[AI.Ind] Data error:",
            repr(e)
        )

        return (
            "Data dari AI tidak dapat diproses. "
            "Coba kirim ulang."
        )

    # ==================================================
    # UNKNOWN ERROR
    # ==================================================

    except Exception as e:

        print(
            "[AI.Ind] Unexpected error:",
            repr(e)
        )

        return (
            "AI.Ind mengalami kesalahan internal. "
            "Coba kirim ulang pesan."
        )