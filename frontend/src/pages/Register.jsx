import { useState, useRef, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api";

function Register() {
  const navigate = useNavigate();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  const showToast = (type, title, text = "", duration = 3200) => {
    clearTimeout(toastTimer.current);

    setToast({
      id: Date.now(),
      type,
      title,
      text,
      duration,
    });

    toastTimer.current = setTimeout(
      () => setToast(null),
      duration
    );
  };

  const handleRegister = async () => {
    if (!nama || !email || !password) {
      showToast(
        "warning",
        "Oops...",
        "Semua field harus diisi."
      );

      return;
    }

    try {
      const res = await axios.post("/register", {
        nama,
        email,
        password,
      });

      showToast(
        "success",
        "Register Berhasil",
        res.data.message,
        1500
      );

      setTimeout(
        () => navigate("/login"),
        1500
      );
    } catch (err) {
      showToast(
        "error",
        "Register Gagal",
        err.response?.data?.message ||
          "Terjadi kesalahan."
      );
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes auIn {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .au-root {
            position: relative;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            overflow: hidden;
            padding:
              calc(24px + env(safe-area-inset-top, 0px))
              20px
              calc(24px + env(safe-area-inset-bottom, 0px));
            font-family: Inter, Poppins, Arial, sans-serif;
            background: radial-gradient(
              circle at 50% 0%,
              #0f2c40 0%,
              #081420 45%,
              #050c13 100%
            );
          }

          .au-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
          }

          .au-glow.one {
            width: 320px;
            height: 320px;
            top: -120px;
            left: -100px;
            background: rgba(0, 194, 255, 0.09);
          }

          .au-glow.two {
            width: 280px;
            height: 280px;
            bottom: -100px;
            right: -80px;
            background: rgba(0, 194, 255, 0.06);
          }

          .au-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 400px;
            box-sizing: border-box;
            padding: 32px 28px 24px;
            border-radius: 24px;
            background: linear-gradient(
              160deg,
              rgba(14, 34, 50, 0.92),
              rgba(8, 22, 34, 0.94)
            );
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow:
              0 24px 70px rgba(0, 0, 0, 0.45),
              0 0 40px rgba(0, 194, 255, 0.06);
            -webkit-backdrop-filter: blur(18px);
            backdrop-filter: blur(18px);
            animation: auIn 0.5s ease both;
          }

          /* ---------- Kepala ---------- */
          .au-head {
            text-align: center;
            margin-bottom: 28px;
          }

          .au-logo {
            width: 56px;
            height: 56px;
            margin: 0 auto 18px;
            border-radius: 16px;
            overflow: hidden;
            background: #0a1d2b;
            border: 1px solid rgba(0, 194, 255, 0.2);
            box-shadow: 0 10px 28px rgba(0, 194, 255, 0.14);
          }

          .au-logo img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: contain;
          }

          .au-title {
            margin: 0;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            font-size: 32px;
            line-height: 1;
            letter-spacing: -1.2px;
          }

          .au-ai {
            font-weight: 800;
            color: #f1f7fb;
          }

          .au-dot {
            width: 6px;
            height: 6px;
            margin: 0 3px 5px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 10px rgba(0, 194, 255, 0.85);
            flex-shrink: 0;
          }

          .au-ind {
            font-weight: 300;
            color: #00c2ff;
          }

          .au-sub {
            margin: 12px 0 0;
            font-size: 14px;
            color: #8a9bb5;
          }

          /* ---------- Form ---------- */
          .au-field {
            margin-bottom: 16px;
          }

          .au-label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #cfe3ee;
          }

          .au-input-wrap {
            display: flex;
            align-items: center;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background: rgba(255, 255, 255, 0.04);
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease;
          }

          .au-input-wrap:focus-within {
            border-color: rgba(0, 194, 255, 0.7);
            background: rgba(0, 194, 255, 0.04);
            box-shadow: 0 0 0 4px rgba(0, 194, 255, 0.12);
          }

          .au-icon {
            display: flex;
            padding-left: 14px;
            color: #6f8798;
            transition: color 0.2s ease;
          }

          .au-input-wrap:focus-within .au-icon {
            color: #00c2ff;
          }

          .au-input {
            flex: 1;
            min-width: 0;
            height: 50px;
            padding: 0 14px 0 10px;
            border: 0;
            outline: none;
            background: transparent;
            color: #ffffff;
            font-size: 16px;
            font-family: inherit;
          }

          .au-input::placeholder {
            color: #5b7385;
          }

          .au-input:-webkit-autofill {
            -webkit-text-fill-color: #ffffff;
            -webkit-box-shadow: 0 0 0 1000px #10283a inset;
            caret-color: #ffffff;
            border-radius: 14px;
          }

          .au-eye {
            width: 46px;
            height: 50px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            background: transparent;
            color: #8a9bb5;
            font-size: 16px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition: color 0.2s ease;
          }

          .au-eye:hover {
            color: #00c2ff;
          }

          .au-btn {
            width: 100%;
            height: 50px;
            margin-top: 10px;
            border: 0;
            border-radius: 14px;
            background: linear-gradient(135deg, #00c2ff, #009fe3);
            color: #04131d;
            font-size: 15px;
            font-weight: 800;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 8px 22px rgba(0, 194, 255, 0.22);
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition:
              transform 0.15s ease,
              box-shadow 0.2s ease;
          }

          .au-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(0, 194, 255, 0.32);
          }

          .au-btn:active {
            transform: scale(0.98);
          }

          .au-switch {
            margin: 20px 0 0;
            text-align: center;
            font-size: 14px;
            color: #8a9bb5;
          }

          .au-switch a {
            color: #00c2ff;
            font-weight: 700;
            text-decoration: none;
          }

          .au-foot {
            margin: 22px 0 0;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
            font-size: 12px;
            color: #5b7385;
          }

          /* ---------- Notifikasi (toast) ---------- */
          @keyframes auToastIn {
            from { opacity: 0; transform: translateY(-14px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes auToastBar {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }

          .au-toast-wrap {
            position: fixed;
            top: calc(env(safe-area-inset-top, 0px) + 14px);
            left: 0;
            right: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            padding: 0 14px;
            pointer-events: none;
          }

          .au-toast {
            --tc: #00c2ff;
            position: relative;
            width: 100%;
            max-width: 380px;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 13px 12px 15px 13px;
            border-radius: 16px;
            pointer-events: auto;
            background: rgba(12, 30, 44, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.09);
            box-shadow:
              0 16px 44px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.02);
            -webkit-backdrop-filter: blur(16px);
            backdrop-filter: blur(16px);
            animation: auToastIn 0.32s cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }

          .au-toast.success { --tc: #34d399; }
          .au-toast.warning { --tc: #fbbf24; }
          .au-toast.error { --tc: #f87171; }

          .au-toast-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: var(--tc);
            background: color-mix(in srgb, var(--tc) 14%, transparent);
          }

          .au-toast-body {
            flex: 1;
            min-width: 0;
            padding-top: 1px;
          }

          .au-toast-title {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.3;
            color: #f1f7fb;
          }

          .au-toast-text {
            margin-top: 3px;
            font-size: 13px;
            line-height: 1.45;
            color: #9fb4c4;
            word-break: break-word;
          }

          .au-toast-close {
            width: 28px;
            height: 28px;
            min-width: 28px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: #6f8798;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition: background 0.2s ease, color 0.2s ease;
          }

          .au-toast-close:hover {
            background: rgba(255, 255, 255, 0.07);
            color: #cfe3ee;
          }

          .au-toast-bar {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 3px;
            background: var(--tc);
            transform-origin: left;
            animation-name: auToastBar;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
          }

          @media (max-width: 480px) {
            .au-card {
              padding: 28px 20px 20px;
              border-radius: 22px;
            }

            .au-title {
              font-size: 30px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .au-card,
            .au-toast {
              animation: none;
            }

            .au-toast-bar {
              display: none;
            }
          }
        `}
      </style>

      <div className="au-root">
        {/* Notifikasi */}
        <div className="au-toast-wrap" aria-live="polite">
          {toast && (
            <div
              key={toast.id}
              className={`au-toast ${toast.type}`}
              role="alert"
            >
              <span className="au-toast-icon">
                {toast.type === "success" && (
                  <FiCheckCircle size={18} />
                )}
                {toast.type === "warning" && (
                  <FiAlertTriangle size={18} />
                )}
                {toast.type === "error" && (
                  <FiAlertCircle size={18} />
                )}
              </span>

              <div className="au-toast-body">
                <div className="au-toast-title">
                  {toast.title}
                </div>

                {toast.text && (
                  <div className="au-toast-text">
                    {toast.text}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="au-toast-close"
                onClick={() => setToast(null)}
                aria-label="Tutup notifikasi"
              >
                <FiX size={15} />
              </button>

              <span
                className="au-toast-bar"
                style={{
                  animationDuration: `${toast.duration}ms`,
                }}
              />
            </div>
          )}
        </div>

        <div className="au-glow one" />
        <div className="au-glow two" />

        <div className="au-card">
        <div className="au-head">
          <div className="au-logo">
            <img src="/logo.svg" alt="AI.Ind" />
          </div>

          <h1 className="au-title">
            <span className="au-ai">AI</span>
            <span className="au-dot" />
            <span className="au-ind">Ind</span>
          </h1>

          <p className="au-sub">Buat akun baru</p>
        </div>

          {/* Nama */}
          <div className="au-field">
            <label className="au-label">Nama</label>

            <div className="au-input-wrap">
              <span className="au-icon">
                <FiUser size={17} />
              </span>

              <input
                className="au-input"
                type="text"
                placeholder="Masukkan nama kamu"
                value={nama}
                onChange={(e) =>
                  setNama(e.target.value)
                }
              />
            </div>
          </div>

          {/* Email */}
          <div className="au-field">
            <label className="au-label">Email</label>

            <div className="au-input-wrap">
              <span className="au-icon">
                <FiMail size={17} />
              </span>

              <input
                className="au-input"
                type="email"
                placeholder="Masukkan email kamu"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>
          </div>

          {/* Password */}
          <div className="au-field">
            <label className="au-label">Password</label>

            <div className="au-input-wrap">
              <span className="au-icon">
                <FiLock size={17} />
              </span>

              <input
                className="au-input"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Buat password kamu"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="au-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <FaEye />
                ) : (
                  <FaEyeSlash />
                )}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="button"
            className="au-btn"
            onClick={handleRegister}
          >
            Daftar
          </button>

          {/* Login */}
          <p className="au-switch">
            Sudah punya akun?{" "}
            <Link to="/login">Login</Link>
          </p>

          <p className="au-foot">
            © 2026 AI.Ind • Buatan Indonesia
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;
