import json
import os
import re
from datetime import datetime


# ==================================================
# BASE DIRECTORY
# ==================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

MAX_HISTORY = 20

# Maksimal memory jangka panjang.
MAX_LONG_TERM_MEMORY = 100

# Maksimal karakter satu memory.
MAX_MEMORY_CHARS = 1000

# Maksimal karakter context memory
# yang nantinya diberikan ke AI.
MAX_MEMORY_CONTEXT_CHARS = 6000


# ==================================================
# MEMORY FILE
# ==================================================

def get_memory_file(user_id=None):

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    if user_id is not None:

        safe_user_id = (
            str(user_id)
            .replace("/", "_")
            .replace("\\", "_")
        )

        return os.path.join(
            DATA_DIR,
            f"memory_{safe_user_id}.json"
        )

    return os.path.join(
        DATA_DIR,
        "memory.json"
    )


# ==================================================
# LONG TERM MEMORY FILE
# ==================================================

def get_long_term_memory_file(user_id=None):

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    if user_id is not None:

        safe_user_id = (
            str(user_id)
            .replace("/", "_")
            .replace("\\", "_")
        )

        return os.path.join(
            DATA_DIR,
            f"long_memory_{safe_user_id}.json"
        )

    return os.path.join(
        DATA_DIR,
        "long_memory.json"
    )


# ==================================================
# GET MEMORY DATA
# ==================================================

def get_memory_data(
    user_id=None
):

    file = get_long_term_memory_file(
        user_id
    )

    if not os.path.exists(file):

        return {
            "memories": []
        }

    try:

        with open(
            file,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

        if not isinstance(
            data,
            dict
        ):

            return {
                "memories": []
            }

        memories = data.get(
            "memories",
            []
        )

        if not isinstance(
            memories,
            list
        ):

            memories = []

        return {
            "memories": memories[
                -MAX_LONG_TERM_MEMORY:
            ]
        }

    except (
        json.JSONDecodeError,
        OSError
    ) as e:

        print(
            "Long term memory load error:",
            e
        )

        return {
            "memories": []
        }


# ==================================================
# SAVE MEMORY DATA
# ==================================================

def save_memory_data(
    data,
    user_id=None
):

    file = get_long_term_memory_file(
        user_id
    )

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    if not isinstance(
        data,
        dict
    ):

        data = {
            "memories": []
        }

    memories = data.get(
        "memories",
        []
    )

    if not isinstance(
        memories,
        list
    ):

        memories = []

    memories = memories[
        -MAX_LONG_TERM_MEMORY:
    ]

    data = {
        "memories": memories
    }

    try:

        with open(
            file,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2
            )

    except OSError as e:

        print(
            "Long term memory save error:",
            e
        )


# ==================================================
# LOAD MEMORY
# ==================================================

def load_memory(
    user_id=None
):

    file = get_memory_file(
        user_id
    )

    if not os.path.exists(file):

        save_memory(
            [],
            user_id
        )

        return []

    try:

        with open(
            file,
            "r",
            encoding="utf-8"
        ) as f:

            memory = json.load(f)

        # --------------------------------------------------
        # FORMAT MEMORY LAMA
        # --------------------------------------------------

        if isinstance(
            memory,
            list
        ):

            valid_memory = []

            for item in memory:

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

                if role not in [
                    "user",
                    "assistant"
                ]:

                    continue

                if not isinstance(
                    content,
                    str
                ):

                    continue

                content = content.strip()

                if not content:
                    continue

                valid_memory.append({
                    "role": role,
                    "content": content
                })

            return valid_memory[
                -MAX_HISTORY:
            ]

        # --------------------------------------------------
        # FORMAT BARU
        # --------------------------------------------------

        if isinstance(
            memory,
            dict
        ):

            history = memory.get(
                "history",
                []
            )

            if not isinstance(
                history,
                list
            ):

                return []

            valid_memory = []

            for item in history:

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

                if role not in [
                    "user",
                    "assistant"
                ]:

                    continue

                if not isinstance(
                    content,
                    str
                ):

                    continue

                content = content.strip()

                if not content:
                    continue

                valid_memory.append({
                    "role": role,
                    "content": content
                })

            return valid_memory[
                -MAX_HISTORY:
            ]

        return []

    except (
        json.JSONDecodeError,
        OSError
    ) as e:

        print(
            "Memory load error:",
            e
        )

        return []


# ==================================================
# SAVE MEMORY
# ==================================================

def save_memory(
    memory,
    user_id=None
):

    file = get_memory_file(
        user_id
    )

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    if not isinstance(
        memory,
        list
    ):

        memory = []

    valid_memory = []

    for item in memory:

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

        if role not in [
            "user",
            "assistant"
        ]:

            continue

        if not isinstance(
            content,
            str
        ):

            continue

        content = content.strip()

        if not content:
            continue

        valid_memory.append({
            "role": role,
            "content": content
        })

    valid_memory = valid_memory[
        -MAX_HISTORY:
    ]

    try:

        with open(
            file,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                valid_memory,
                f,
                ensure_ascii=False,
                indent=2
            )

    except OSError as e:

        print(
            "Memory save error:",
            e
        )


# ==================================================
# ADD MESSAGE
# ==================================================

def add_message(
    role,
    content,
    user_id=None
):

    if role not in [
        "user",
        "assistant"
    ]:

        return

    if (
        content is None
        or not str(content).strip()
    ):

        return

    content = str(
        content
    ).strip()

    memory = load_memory(
        user_id
    )

    memory.append({

        "role":
            role,

        "content":
            content

    })

    save_memory(
        memory,
        user_id
    )

    # --------------------------------------------------
    # Coba deteksi informasi penting secara otomatis.
    # --------------------------------------------------

    if role == "user":

        try:

            deteksi_memory_penting(
                content,
                user_id
            )

        except Exception as e:

            print(
                "Memory detection error:",
                e
            )


# ==================================================
# DETEKSI MEMORY PENTING
# ==================================================

def deteksi_memory_penting(
    content,
    user_id=None
):

    if not content:
        return

    text = str(
        content
    ).strip()

    if not text:
        return

    # Jangan menyimpan pesan yang terlalu pendek.
    if len(text) < 8:
        return

    text_lower = text.lower()

    kategori = None

    # ==================================================
    # PREFERENSI
    # ==================================================

    preference_patterns = [
        r"\bakulah\b",
        r"\baku suka\b",
        r"\baku tidak suka\b",
        r"\baku nggak suka\b",
        r"\baku gak suka\b",
        r"\bjangan panggil aku\b",
        r"\bpanggil aku\b",
        r"\baku lebih suka\b",
        r"\baku ingin\b",
        r"\bakumau\b"
    ]

    for pattern in preference_patterns:

        if re.search(
            pattern,
            text_lower
        ):

            kategori = "preference"

            break

    # ==================================================
    # PROJECT
    # ==================================================

    project_patterns = [
        r"\bproject\b",
        r"\bprojek\b",
        r"\baplikasi\b",
        r"\bwebsite\b",
        r"\bweb\b",
        r"\bapp\b",
        r"\bgithub\b",
        r"\breact\b",
        r"\bvite\b",
        r"\bpython\b",
        r"\bflask\b",
        r"\bfastapi\b",
        r"\bjava\b",
        r"\bspring boot\b",
        r"\bsql\b"
    ]

    if kategori is None:

        for pattern in project_patterns:

            if re.search(
                pattern,
                text_lower
            ):

                kategori = "project"

                break

    # ==================================================
    # INFORMASI PRIBADI YANG TIDAK SENSITIF
    # ==================================================

    personal_patterns = [
        r"\baku sedang belajar\b",
        r"\baku belajar\b",
        r"\baku kelas\b",
        r"\baku sekolah\b",
        r"\baku kerja\b",
        r"\baku kuliah\b",
        r"\baku tinggal\b"
    ]

    if kategori is None:

        for pattern in personal_patterns:

            if re.search(
                pattern,
                text_lower
            ):

                kategori = "context"

                break

    # ==================================================
    # TUJUAN
    # ==================================================

    goal_patterns = [
        r"\baku ingin membuat\b",
        r"\baku mau membuat\b",
        r"\baku ingin belajar\b",
        r"\baku mau belajar\b",
        r"\btujuanku\b",
        r"\btargetku\b",
        r"\btarget saya\b",
        r"\brencanaku\b"
    ]

    if kategori is None:

        for pattern in goal_patterns:

            if re.search(
                pattern,
                text_lower
            ):

                kategori = "goal"

                break

    if kategori is None:
        return

    # ==================================================
    # BATAS PANJANG
    # ==================================================

    if len(text) > MAX_MEMORY_CHARS:

        text = (
            text[
                :MAX_MEMORY_CHARS
            ]
            + "..."
        )

    # ==================================================
    # SIMPAN
    # ==================================================

    tambah_memory_penting(
        text,
        kategori,
        user_id
    )


# ==================================================
# TAMBAH MEMORY PENTING
# ==================================================

def tambah_memory_penting(
    content,
    category="context",
    user_id=None
):

    if not content:
        return

    content = str(
        content
    ).strip()

    if not content:
        return

    if len(content) > MAX_MEMORY_CHARS:

        content = (
            content[
                :MAX_MEMORY_CHARS
            ]
            + "..."
        )

    if category not in [
        "preference",
        "project",
        "context",
        "goal",
        "general"
    ]:

        category = "general"

    data = get_memory_data(
        user_id
    )

    memories = data.get(
        "memories",
        []
    )

    # ==================================================
    # CEK DUPLIKAT
    # ==================================================

    content_normalized = (
        content.lower().strip()
    )

    for item in memories:

        if not isinstance(
            item,
            dict
        ):

            continue

        old_content = str(
            item.get(
                "content",
                ""
            )
        ).lower().strip()

        if old_content == content_normalized:

            return

    # ==================================================
    # MEMORY BARU
    # ==================================================

    memories.append({

        "content":
            content,

        "category":
            category,

        "created_at":
            datetime.utcnow().isoformat()

    })

    # ==================================================
    # BATASI JUMLAH
    # ==================================================

    memories = memories[
        -MAX_LONG_TERM_MEMORY:
    ]

    save_memory_data(
        {
            "memories":
                memories
        },
        user_id
    )


# ==================================================
# GET LONG TERM MEMORY
# ==================================================

def load_long_term_memory(
    user_id=None
):

    data = get_memory_data(
        user_id
    )

    memories = data.get(
        "memories",
        []
    )

    if not isinstance(
        memories,
        list
    ):

        return []

    hasil = []

    for item in memories:

        if not isinstance(
            item,
            dict
        ):

            continue

        content = item.get(
            "content"
        )

        if not content:
            continue

        hasil.append({

            "content":
                str(content).strip(),

            "category":
                item.get(
                    "category",
                    "general"
                ),

            "created_at":
                item.get(
                    "created_at",
                    ""
                )

        })

    return hasil[
        -MAX_LONG_TERM_MEMORY:
    ]


# ==================================================
# GET MEMORY CONTEXT
# ==================================================

def get_memory_context(
    user_id=None
):

    memories = (
        load_long_term_memory(
            user_id
        )
    )

    if not memories:
        return ""

    bagian = []

    total_chars = 0

    # Memory terbaru lebih diprioritaskan.
    for item in reversed(
        memories
    ):

        content = item.get(
            "content",
            ""
        )

        category = item.get(
            "category",
            "general"
        )

        if not content:
            continue

        baris = (
            f"- [{category}] {content}"
        )

        if (
            total_chars
            + len(baris)
            > MAX_MEMORY_CONTEXT_CHARS
        ):

            break

        bagian.append(
            baris
        )

        total_chars += len(
            baris
        )

    bagian.reverse()

    if not bagian:
        return ""

    return (
        "MEMORY PENTING PENGGUNA:\n"
        + "\n".join(bagian)
    )


# ==================================================
# CLEAR MEMORY
# ==================================================

def clear_memory(
    user_id=None
):

    save_memory(
        [],
        user_id
    )


# ==================================================
# CLEAR LONG TERM MEMORY
# ==================================================

def clear_long_term_memory(
    user_id=None
):

    file = get_long_term_memory_file(
        user_id
    )

    try:

        if os.path.exists(file):

            os.remove(file)

            print(
                "Long term memory berhasil dihapus."
            )

    except OSError as e:

        print(
            "Long term memory delete error:",
            e
        )


# ==================================================
# CLEAR ALL MEMORY
# ==================================================

def clear_all_memory(
    user_id=None
):

    clear_memory(
        user_id
    )

    clear_long_term_memory(
        user_id
    )


# ==================================================
# DELETE USER MEMORY
# ==================================================

def delete_user_memory(
    user_id
):

    # --------------------------------------------------
    # Hapus history
    # --------------------------------------------------

    file = get_memory_file(
        user_id
    )

    try:

        if os.path.exists(file):

            os.remove(file)

            print(
                f"Memory user {user_id} berhasil dihapus."
            )

    except OSError as e:

        print(
            "Memory delete error:",
            e
        )

    # --------------------------------------------------
    # Hapus long-term memory
    # --------------------------------------------------

    long_file = (
        get_long_term_memory_file(
            user_id
        )
    )

    try:

        if os.path.exists(
            long_file
        ):

            os.remove(
                long_file
            )

            print(
                f"Long term memory user {user_id} "
                "berhasil dihapus."
            )

    except OSError as e:

        print(
            "Long term memory delete error:",
            e
        )