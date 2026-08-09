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

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { GoogleLogin } from "@react-oauth/google";

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

      Swal.fire({
        icon: "success",
        title: "Login Berhasil",
        timer: 1200,
        showConfirmButton: false,
        ...alertStyle,
      });

      setTimeout(() => navigate("/"), 1200);
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

  // Login Google dari Web
  const handleGoogleSuccess = async (
    credentialResponse
  ) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error(
          "Credential Google tidak diterima."
        );
      }

      const payload =
        credentialResponse.credential.split(".")[1];

      if (!payload) {
        throw new Error(
          "Credential Google tidak valid."
        );
      }

      const base64 = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const padded = base64.padEnd(
        base64.length +
          ((4 - (base64.length % 4)) % 4),
        "="
      );

      const decoded = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            atob(padded),
            (char) => char.charCodeAt(0)
          )
        )
      );

      if (!decoded.email) {
        throw new Error(
          "Email Google tidak ditemukan."
        );
      }

      const res = await axios.post(
        "/google-login",
        {
          nama: decoded.name || "",
          email: decoded.email,
          foto: decoded.picture || "",
        }
      );

      saveUserLogin(res.data.user);

      Swal.fire({
        icon: "success",
        title: "Login Google Berhasil",
        timer: 1200,
        showConfirmButton: false,
        ...alertStyle,
      });

      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(
        "Google Login Error:",
        err
      );

      Swal.fire({
        icon: "error",
        title: "Google Login Gagal",
        text:
          err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan saat login dengan Google.",
        ...alertStyle,
      });
    }
  };

  const handleGoogleError = () => {
    Swal.fire({
      icon: "error",
      title: "Google Login Gagal",
      text:
        "Google Login tidak dapat digunakan. Pastikan Client ID dan domain aplikasi sudah benar.",
      ...alertStyle,
    });
  };

  // Login Google untuk Android / APK
  const handleNativeGoogleLogin = async () => {
    try {
      const result =
        await FirebaseAuthentication.signInWithGoogle();

      const googleUser = {
        nama:
          result.user?.displayName || "",
        email:
          result.user?.email || "",
        foto:
          result.user?.photoUrl ||
          result.user?.photoURL ||
          "",
      };

      if (!googleUser.email) {
        throw new Error(
          "Email Google tidak ditemukan."
        );
      }

      const res = await axios.post(
        "/google-login",
        googleUser
      );

      saveUserLogin(res.data.user);

      Swal.fire({
        icon: "success",
        title: "Login Google Berhasil",
        timer: 1200,
        showConfirmButton: false,
        ...alertStyle,
      });

      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(
        "Native Google Login Error:",
        err
      );

      Swal.fire({
        icon: "error",
        title: "Google Login Gagal",
        text:
          err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan saat login Google.",
        ...alertStyle,
      });
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #1B3445",
    background: "#122B3C",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

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
          boxShadow:
            "0 0 25px rgba(0,194,255,.15)",
        }}
      >
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
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={inputStyle}
          />
        </div>

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
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Masukkan password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={{
                ...inputStyle,
                flex: 1,
                border: "none",
                background: "transparent",
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

        {Capacitor.isNativePlatform() ? (
          <button
            type="button"
            onClick={handleNativeGoogleLogin}
            style={{
              width: "100%",
              maxWidth: "280px",
              height: "44px",
              margin: "0 auto",
              padding: "0 14px",
              border: "1px solid #DADCE0",
              borderRadius: "8px",
              background: "#fff",
              color: "#3C4043",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              boxSizing: "border-box",
            }}
          >
            <FaGoogle color="#4285F4" />
            Login dengan Google
          </button>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: "280px",
              height: "44px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="280"
            />
          </div>
        )}

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