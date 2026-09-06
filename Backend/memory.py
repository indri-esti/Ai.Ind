import json
import os
import re
from datetime import datetime, timezone


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


# ==================================================
# LIMIT
# ==================================================

MAX_HISTORY = 30

MAX_LONG_TERM_MEMORY = 100

MAX_MEMORY_CHARS = 1000

MAX_MEMORY_CONTEXT_CHARS = 8000


# ==================================================
# ENSURE DATA DIRECTORY
# ==================================================

def ensure_data_dir():

    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )


# ==================================================
# SAFE USER ID
# ==================================================

def safe_user_id(
    user_id
):

    if user_id is None:
        return "default"

    value = str(
        user_id
    ).strip()

    if not value:
        return "default"

    value = re.sub(
        r"[^a-zA-Z0-9_.-]",
        "_",
        value
    )

    return value[:100]


# ==================================================
# MEMORY FILE
# ==================================================

def get_memory_file(
    user_id=None
):

    ensure_data_dir()

    return os.path.join(
        DATA_DIR,
        f"memory_{safe_user_id(user_id)}.json"
    )


# ==================================================
# LONG MEMORY FILE
# ==================================================

def get_long_term_memory_file(
    user_id=None
):

    ensure_data_dir()

    return os.path.join(
        DATA_DIR,
        f"long_memory_{safe_user_id(user_id)}.json"
    )


# ==================================================
# READ JSON
# ==================================================

def read_json(
    file,
    default
):

    if not os.path.exists(
        file
    ):

        return default

    try:

        with open(
            file,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except (
        json.JSONDecodeError,
        OSError
    ) as e:

        print(
            "[Memory] JSON read error:",
            repr(e)
        )

        return default


# ==================================================
# WRITE JSON
# ==================================================

def write_json(
    file,
    data
):

    ensure_data_dir()

    temporary_file = (
        file + ".tmp"
    )

    try:

        with open(
            temporary_file,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2
            )

        os.replace(
            temporary_file,
            file
        )

        return True

    except OSError as e:

        print(
            "[Memory] JSON write error:",
            repr(e)
        )

        try:

            if os.path.exists(
                temporary_file
            ):

                os.remove(
                    temporary_file
                )

        except OSError:
            pass

        return False


# ==================================================
# LOAD CHAT MEMORY
# ==================================================

def load_memory(
    user_id=None
):

    file = get_memory_file(
        user_id
    )

    data = read_json(
        file,
        []
    )

    # --------------------------------------------------
    # FORMAT LAMA
    # --------------------------------------------------

    if isinstance(
        data,
        list
    ):

        history = data

    # --------------------------------------------------
    # FORMAT BARU
    # --------------------------------------------------

    elif isinstance(
        data,
        dict
    ):

        history = data.get(
            "history",
            []
        )

    else:

        return []

    if not isinstance(
        history,
        list
    ):

        return []

    result = []

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

        if role not in (
            "user",
            "assistant"
        ):

            continue

        if content is None:
            continue

        content = str(
            content
        ).strip()

        if not content:
            continue

        result.append({

            "role":
                role,

            "content":
                content

        })

    return result[
        -MAX_HISTORY:
    ]


# ==================================================
# SAVE CHAT MEMORY
# ==================================================

def save_memory(
    memory,
    user_id=None
):

    if not isinstance(
        memory,
        list
    ):

        memory = []

    result = []

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

        if role not in (
            "user",
            "assistant"
        ):

            continue

        if content is None:
            continue

        content = str(
            content
        ).strip()

        if not content:
            continue

        result.append({

            "role":
                role,

            "content":
                content

        })

    result = result[
        -MAX_HISTORY:
    ]

    return write_json(
        get_memory_file(
            user_id
        ),
        result
    )


# ==================================================
# ADD MESSAGE
# ==================================================

def add_message(
    role,
    content,
    user_id=None
):

    if role not in (
        "user",
        "assistant"
    ):

        return

    if content is None:
        return

    content = str(
        content
    ).strip()

    if not content:
        return

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

    # Hanya user message yang
    # dipertimbangkan untuk long-term memory.
    if role == "user":

        try:

            deteksi_memory_penting(
                content,
                user_id
            )

        except Exception as e:

            print(
                "[Memory] Detection error:",
                repr(e)
            )


# ==================================================
# LONG MEMORY DATA
# ==================================================

def get_memory_data(
    user_id=None
):

    file = get_long_term_memory_file(
        user_id
    )

    data = read_json(
        file,
        {
            "memories": []
        }
    )

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

        "memories":
            memories[
                -MAX_LONG_TERM_MEMORY:
            ]

    }


# ==================================================
# SAVE LONG MEMORY
# ==================================================

def save_memory_data(
    data,
    user_id=None
):

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

    return write_json(

        get_long_term_memory_file(
            user_id
        ),

        {
            "memories":
                memories
        }

    )


# ==================================================
# DETEKSI MEMORY
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

    if len(text) < 8:
        return

    lower = text.lower()

    category = None

    # ==================================================
    # PREFERENCE
    # ==================================================

    preference_patterns = [

        r"\baku suka\b",

        r"\baku tidak suka\b",

        r"\baku gak suka\b",

        r"\baku nggak suka\b",

        r"\baku lebih suka\b",

        r"\bjangan panggil aku\b",

        r"\bpanggil aku\b",

        r"\baku ingin\b",

        r"\baku mau\b",

    ]

    for pattern in preference_patterns:

        if re.search(
            pattern,
            lower
        ):

            category = (
                "preference"
            )

            break

    # ==================================================
    # PROJECT
    # ==================================================

    if category is None:

        project_patterns = [

            r"\bproject\b",

            r"\bprojek\b",

            r"\baplikasi\b",

            r"\bwebsite\b",

            r"\bgithub\b",

            r"\bgitlab\b",

            r"\breact\b",

            r"\bvite\b",

            r"\bpython\b",

            r"\bflask\b",

            r"\bfastapi\b",

            r"\bjava\b",

            r"\bspring boot\b",

            r"\bsql\b",

            r"\bandroid\b",

        ]

        for pattern in project_patterns:

            if re.search(
                pattern,
                lower
            ):

                category = (
                    "project"
                )

                break

    # ==================================================
    # CONTEXT
    # ==================================================

    if category is None:

        context_patterns = [

            r"\baku sedang belajar\b",

            r"\baku belajar\b",

            r"\baku kelas\b",

            r"\baku sekolah\b",

            r"\baku kerja\b",

            r"\baku kuliah\b",

        ]

        for pattern in context_patterns:

            if re.search(
                pattern,
                lower
            ):

                category = (
                    "context"
                )

                break

    # ==================================================
    # GOAL
    # ==================================================

    if category is None:

        goal_patterns = [

            r"\baku ingin membuat\b",

            r"\baku mau membuat\b",

            r"\baku ingin belajar\b",

            r"\baku mau belajar\b",

            r"\btujuanku\b",

            r"\btargetku\b",

            r"\brencanaku\b",

        ]

        for pattern in goal_patterns:

            if re.search(
                pattern,
                lower
            ):

                category = (
                    "goal"
                )

                break

    if category is None:
        return

    if len(text) > MAX_MEMORY_CHARS:

        text = (
            text[
                :MAX_MEMORY_CHARS
            ]
            + "..."
        )

    tambah_memory_penting(
        text,
        category,
        user_id
    )


# ==================================================
# ADD LONG MEMORY
# ==================================================

def tambah_memory_penting(
    content,
    category="general",
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

    allowed = (
        "preference",
        "project",
        "context",
        "goal",
        "general"
    )

    if category not in allowed:

        category = "general"

    data = get_memory_data(
        user_id
    )

    memories = data.get(
        "memories",
        []
    )

    normalized = (
        re.sub(
            r"\s+",
            " ",
            content
        )
        .lower()
        .strip()
    )

    # --------------------------------------------------
    # DUPLICATE
    # --------------------------------------------------

    for item in memories:

        if not isinstance(
            item,
            dict
        ):

            continue

        old = str(
            item.get(
                "content",
                ""
            )
        )

        old_normalized = (
            re.sub(
                r"\s+",
                " ",
                old
            )
            .lower()
            .strip()
        )

        if (
            old_normalized
            == normalized
        ):

            return

    # --------------------------------------------------
    # ADD
    # --------------------------------------------------

    memories.append({

        "content":
            content,

        "category":
            category,

        "created_at":
            datetime.now(
                timezone.utc
            ).isoformat()

    })

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
# LOAD LONG MEMORY
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

    result = []

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

        result.append({

            "content":
                str(
                    content
                ).strip(),

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

    return result[
        -MAX_LONG_TERM_MEMORY:
    ]


# ==================================================
# MEMORY CONTEXT
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

    total = 0

    # Terbaru lebih diprioritaskan.
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

        line = (
            f"- [{category}] {content}"
        )

        if (
            total
            + len(line)
            > MAX_MEMORY_CONTEXT_CHARS
        ):

            break

        bagian.append(
            line
        )

        total += len(
            line
        )

    bagian.reverse()

    if not bagian:
        return ""

    return (
        "MEMORY PENTING PENGGUNA:\n"
        + "\n".join(
            bagian
        )
    )


# ==================================================
# CLEAR CHAT MEMORY
# ==================================================

def clear_memory(
    user_id=None
):

    save_memory(
        [],
        user_id
    )


# ==================================================
# CLEAR LONG MEMORY
# ==================================================

def clear_long_term_memory(
    user_id=None
):

    file = (
        get_long_term_memory_file(
            user_id
        )
    )

    try:

        if os.path.exists(
            file
        ):

            os.remove(
                file
            )

    except OSError as e:

        print(
            "[Memory] Delete error:",
            repr(e)
        )


# ==================================================
# CLEAR ALL
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
# DELETE USER
# ==================================================

def delete_user_memory(
    user_id
):

    files = [

        get_memory_file(
            user_id
        ),

        get_long_term_memory_file(
            user_id
        )

    ]

    for file in files:

        try:

            if os.path.exists(
                file
            ):

                os.remove(
                    file
                )

        except OSError as e:

            print(
                "[Memory] Delete error:",
                repr(e)
            )