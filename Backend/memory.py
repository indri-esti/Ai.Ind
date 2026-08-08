import json
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

MAX_HISTORY = 20


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


def load_memory(user_id=None):

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


        if not isinstance(
            memory,
            list
        ):

            return []


        valid_memory = []


        for item in memory:

            if (
                isinstance(item, dict)
                and item.get("role")
                in [
                    "user",
                    "assistant"
                ]
                and isinstance(
                    item.get("content"),
                    str
                )
                and item.get(
                    "content"
                ).strip()
            ):

                valid_memory.append({

                    "role":
                        item["role"],

                    "content":
                        item["content"].strip()

                })


        return valid_memory[
            -MAX_HISTORY:
        ]


    except (
        json.JSONDecodeError,
        OSError
    ) as e:

        print(
            "Memory load error:",
            e
        )

        return []


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


    memory = memory[
        -MAX_HISTORY:
    ]


    try:

        with open(
            file,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                memory,
                f,
                ensure_ascii=False,
                indent=2
            )


    except OSError as e:

        print(
            "Memory save error:",
            e
        )


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
        not content
        or not str(content).strip()
    ):

        return


    memory = load_memory(
        user_id
    )


    memory.append({

        "role":
            role,

        "content":
            str(content).strip()

    })


    save_memory(
        memory,
        user_id
    )


def clear_memory(
    user_id=None
):

    save_memory(
        [],
        user_id
    )


def delete_user_memory(
    user_id
):

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