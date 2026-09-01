import { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const alertStyle = {
    background: "#122B3C",
    color: "#fff",
    confirmButtonColor: "#00C2FF",
  };

  const saveUserLogin = (user) => {
    if (!user || !user.id) {
      throw new Error(
        "Data user dari server tidak ditemukan."
      );
    }

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    axios.defaults.headers.common["X-User-ID"] =
      String(user.id);
  };

  // Login dengan email dan password
  const handleLogin = async () => {
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Email dan password harus diisi.",
        ...alertStyle,
      });
      return;
    }

    try {
      const res = await axios.post("/login", {
        email,
        password,
      });

      saveUserLogin(res.data.user);

// Login Berhasil
Swal.fire({
  icon: "success",
  title: "Login Berhasil",
  timer: 700,
  showConfirmButton: false,
  ...alertStyle,
});

setTimeout(() => navigate("/"), 700);



    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text:
          err.response?.data?.message ||
          "Email atau password salah.",
        ...alertStyle,
      });
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(18,43,60,0.85)",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
    transition: "0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #12344a 0%, #081420 42%, #050c13 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        fontFamily:
          "Inter, Poppins, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(0,194,255,0.08)",
          filter: "blur(80px)",
          top: "-120px",
          left: "-100px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "rgba(0,194,255,0.06)",
          filter: "blur(80px)",
          bottom: "-100px",
          right: "-80px",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background:
            "linear-gradient(145deg, rgba(11,29,42,0.97), rgba(7,22,33,0.97))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "38px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.45), 0 0 35px rgba(0,194,255,0.08)",
          position: "relative",
          zIndex: 1,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "28px",
              background:
                "linear-gradient(145deg, #0c2638, #071723)",
              border:
                "1px solid rgba(0,194,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow:
                "0 15px 35px rgba(0,0,0,0.3), 0 0 25px rgba(0,194,255,0.10)",
              overflow: "hidden",
            }}
          >
            <img
  src="/logo.svg"
  alt="AI.Ind"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  }}
/>
          </div>

          <h1
            style={{
              color: "#fff",
              marginTop: "22px",
              marginBottom: "7px",
              fontSize: "28px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
            }}
          >
            AI<span style={{ color: "#00C2FF" }}>.Ind</span>
          </h1>

          <p
            style={{
              color: "#8A9BB5",
              margin: 0,
              fontSize: "14px",
            }}
          >
            Selamat datang kembali 
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              color: "#EAF4FA",
              display: "block",
              marginBottom: "9px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Email
          </label>

          <input
            type="email"
            placeholder="Masukkan email kamu"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.border =
                "1px solid #00C2FF";
              e.target.style.boxShadow =
                "0 0 0 3px rgba(0,194,255,0.10)";
            }}
            onBlur={(e) => {
              e.target.style.border =
                "1px solid rgba(255,255,255,0.08)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              color: "#EAF4FA",
              display: "block",
              marginBottom: "9px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Password
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background:
                "rgba(18,43,60,0.85)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              paddingRight: "15px",
              transition: "0.2s",
            }}
          >
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Masukkan password kamu"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={{
                ...inputStyle,
                flex: 1,
                border: "none",
                background: "transparent",
                boxShadow: "none",
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={{
                cursor: "pointer",
                color: "#8A9BB5",
                display: "flex",
                padding: "5px",
                fontSize: "16px",
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

        {/* Login Button */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, #00C2FF, #009FE3)",
            color: "#04131D",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "15px",
            boxShadow:
              "0 8px 22px rgba(0,194,255,0.20)",
            transition: "0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 12px 28px rgba(0,194,255,0.30)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 8px 22px rgba(0,194,255,0.20)";
          }}
        >
          Login
        </button>

        {/* Register */}
        <p
          style={{
            textAlign: "center",
            color: "#8A9BB5",
            marginTop: "22px",
            marginBottom: 0,
            fontSize: "14px",
          }}
        >
          Belum punya akun?{" "}
          <Link
            to="/register"
            style={{
              color: "#00C2FF",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Daftar
          </Link>
        </p>

        {/* Footer */}
        <div
          style={{
            height: "1px",
            background:
              "rgba(255,255,255,0.06)",
            margin: "26px 0 20px",
          }}
        />

        <p
          style={{
            textAlign: "center",
            color: "#61758A",
            margin: 0,
            fontSize: "12px",
          }}
        >
          © 2026 AI.Ind • Buatan Indonesia 🇮🇩
        </p>
      </div>
    </div>
  );
}

export default Login;