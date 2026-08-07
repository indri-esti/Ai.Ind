from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection

auth = Blueprint("auth", __name__)


# =====================
# REGISTER
# =====================
@auth.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Data kosong."
        }), 400


    nama = data.get("nama")
    email = data.get("email")
    password = data.get("password")


    if not nama or not email or not password:
        return jsonify({
            "success": False,
            "message": "Semua field wajib diisi."
        }), 400


    conn = get_connection()
    cursor = conn.cursor()


    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()


    if user:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Email sudah digunakan."
        }), 400


    password_hash = generate_password_hash(password)


    cursor.execute(
        """
        INSERT INTO users(nama,email,password)
        VALUES(?,?,?)
        """,
        (
            nama,
            email,
            password_hash
        )
    )


    conn.commit()
    conn.close()


    return jsonify({
        "success": True,
        "message": "Register berhasil."
    })



# =====================
# LOGIN
# =====================
@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()


    email = data.get("email")
    password = data.get("password")


    conn = get_connection()
    cursor = conn.cursor()


    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )


    user = cursor.fetchone()

    conn.close()


    if not user:
        return jsonify({
            "success": False,
            "message": "Email tidak ditemukan."
        }), 404



    if not check_password_hash(
        user["password"],
        password
    ):
        return jsonify({
            "success": False,
            "message": "Password salah."
        }), 401



    return jsonify({
        "success": True,
        "message": "Login berhasil.",
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"],
            "foto": user["foto"]
        }
    })



# =====================
# GOOGLE LOGIN
# =====================
@auth.route("/google-login", methods=["POST"])
def google_login():

    data = request.get_json()


    if not data:
        return jsonify({
            "success": False,
            "message": "Data Google kosong."
        }), 400



    nama = data.get("nama")
    email = data.get("email")
    foto = data.get("foto", "")



    if not nama or not email:
        return jsonify({
            "success": False,
            "message": "Data Google tidak lengkap."
        }), 400



    conn = get_connection()
    cursor = conn.cursor()



    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )


    user = cursor.fetchone()



    # Jika user baru dari Google
    if not user:

        password_hash = generate_password_hash(
            "google_login"
        )


        cursor.execute(
            """
            INSERT INTO users
            (nama,email,password,foto)
            VALUES(?,?,?,?)
            """,
            (
                nama,
                email,
                password_hash,
                foto
            )
        )


        conn.commit()



        cursor.execute(
            "SELECT * FROM users WHERE email=?",
            (email,)
        )


        user = cursor.fetchone()



    conn.close()



    return jsonify({
        "success": True,
        "message": "Google login berhasil.",
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"],
            "foto": user["foto"]
        }
    })



# =====================
# LOGOUT
# =====================
@auth.route("/logout", methods=["POST"])
def logout():

    return jsonify({
        "success": True,
        "message": "Logout berhasil."
    })