import { useState } from "react";
import {
  FaRobot,
  FaGoogle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { useNavigate, Link } from "react-router-dom";

import Swal from "sweetalert2";
import axios from "../api";

import { GoogleLogin } from "@react-oauth/google";

function Login() {
  
  const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {
  if (!email || !password) {
Swal.fire({
  icon: "warning",
  title: "Oops...",
  text: "Email dan password harus diisi.",
  background: "#122B3C",
  color: "#fff",
  confirmButtonColor: "#00C2FF",
});
    return;
  }

  try {
    const res = await axios.post("/login", {
      email,
      password,
    });

    localStorage.setItem(
      "user",
      JSON.stringify(res.data.user)
    );

Swal.fire({
  icon: "success",
  title: "Login Berhasil",
  timer: 1200,
  showConfirmButton: false,
  background: "#122B3C",
  color: "#fff",
});

    setTimeout(() => {
      navigate("/");
    }, 1200);
  } catch (err) {
    Swal.fire({
  icon: "error",
  title: "Login Gagal",
  text:
    err.response?.data?.message ||
    "Email atau password salah.",
  background: "#122B3C",
  color: "#fff",
  confirmButtonColor: "#00C2FF",
});
  }
};

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#081420",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0B1D2A",
          border: "1px solid #1B3445",
          borderRadius: "18px",
          padding: "35px",
          boxShadow: "0 0 25px rgba(0,194,255,.15)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#122B3C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <FaRobot
              size={42}
              color="#00C2FF"
            />
          </div>

          <h2
            style={{
              color: "#00C2FF",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            AI.Ind
          </h2>

          <p
            style={{
              color: "#8A9BB5",
              margin: 0,
            }}
          >
            Selamat Datang Kembali
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              color: "#fff",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
  onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #1B3445",
              background: "#122B3C",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "22px" }}>
          <label
            style={{
              color: "#fff",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Password
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#122B3C",
              border: "1px solid #1B3445",
              borderRadius: "10px",
              paddingRight: "15px",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
  onChange={(e) => setPassword(e.target.value)}
              style={{
                flex: 1,
                padding: "14px",
                border: "none",
                background: "transparent",
                color: "#fff",
                outline: "none",
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={{
                cursor: "pointer",
                color: "#8A9BB5",
              }}
            >
              {showPassword ? (
                <FaEye />
              ) : (
                <FaEyeSlash />
              )}
            </span>
          </div>
        </div>

        {/* Login */}
       <button
  onClick={handleLogin}
  style={{
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#00C2FF",
    color: "#081420",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "16px",
  }}
>
  Login
</button>

        <div
          style={{
            textAlign: "center",
            color: "#8A9BB5",
            margin: "18px 0",
          }}
        >
          atau
        </div>

        {/* Google */}
       <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
  }}
>
<GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {

      const token = credentialResponse.credential;

      // Ambil data user dari token Google
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );


      const res = await axios.post("/google-login", {
        nama: payload.name,
        email: payload.email,
        foto: payload.picture || "",
      });


      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );


      Swal.fire({
        icon: "success",
        title: "Login Google Berhasil",
        timer: 1200,
        showConfirmButton: false,
        background: "#122B3C",
        color: "#fff",
      });


      setTimeout(() => {
        navigate("/");
      }, 1200);


    } catch (err) {

      console.log(err.response?.data);


      Swal.fire({
        icon: "error",
        title: "Google Login Gagal",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan.",
        background: "#122B3C",
        color: "#fff",
        confirmButtonColor: "#00C2FF",
      });

    }
  }}


  onError={() => {

    Swal.fire({
      icon: "error",
      title: "Google Login Gagal",
      text: "Tidak dapat terhubung ke Google.",
      background: "#122B3C",
      color: "#fff",
      confirmButtonColor: "#00C2FF",
    });

  }}
/>
</div>

<p
  style={{
    textAlign: "center",
    color: "#8A9BB5",
    marginTop: "18px",
  }}
>
  Belum punya akun?{" "}
  <Link
    to="/register"
    style={{
      color: "#00C2FF",
      textDecoration: "none",
      fontWeight: "600",
    }}
  >
    Daftar
  </Link>
</p>

        <p
          style={{
            textAlign: "center",
            color: "#8A9BB5",
            marginTop: "25px",
            fontSize: "14px",
          }}
        >
          © 2026 AI.Ind • Buatan Indonesia 🇮🇩
        </p>
      </div>
    </div>
  );
}

export default Login;