import {
  FiBookOpen,
  FiZap,
  FiHelpCircle,
  FiCode,
  FiGlobe,
  FiEdit3,
} from "react-icons/fi";

const SARAN = [
  { label: "Bantu belajar", icon: FiBookOpen },
  { label: "Cari ide", icon: FiZap },
  { label: "Jelaskan sesuatu", icon: FiHelpCircle },
  { label: "Bantu coding", icon: FiCode },
  { label: "Terjemahkan", icon: FiGlobe },
  { label: "Tulis teks", icon: FiEdit3 },
];

function Welcome({
  message,
  setMessage,
}) {
  return (
    <>
      <style>
        {`
          @keyframes wlRise {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .wl-root {
            width: 100%;
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px 40px;
            box-sizing: border-box;
          }

          .wl-content {
            width: 100%;
            max-width: 560px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          /* ---------- Logo ---------- */
          .wl-logo {
            position: relative;
            width: 72px;
            height: 72px;
            margin-bottom: 26px;
            animation: wlRise 0.6s ease both;
          }

          .wl-logo::before {
            content: "";
            position: absolute;
            inset: -22px;
            border-radius: 50%;
            background: rgba(0, 194, 255, 0.12);
            filter: blur(26px);
            pointer-events: none;
          }

          .wl-logo img {
            position: relative;
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            border-radius: 22px;
            border: 1px solid rgba(0, 194, 255, 0.22);
            box-shadow: 0 14px 40px rgba(0, 194, 255, 0.16);
          }

          /* ---------- Teks ---------- */
          .wl-hello {
            margin: 0;
            color: #a9bfcc;
            font-size: 15px;
            font-weight: 500;
            letter-spacing: 0.2px;
            animation: wlRise 0.6s ease 0.08s both;
          }

          .wl-title {
            margin: 6px 0 0;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            font-size: clamp(44px, 11vw, 60px);
            line-height: 1;
            letter-spacing: -2.5px;
            animation: wlRise 0.6s ease 0.16s both;
          }

          .wl-ai {
            font-weight: 800;
            color: #f1f7fb;
          }

          .wl-dot {
            width: 0.15em;
            height: 0.15em;
            margin: 0 0.05em 0.14em;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 14px rgba(0, 194, 255, 0.85);
            flex-shrink: 0;
          }

          .wl-ind {
            font-weight: 300;
            color: #00c2ff;
          }

          .wl-sub {
            margin: 14px 0 0;
            color: #e3f1f7;
            font-size: 16px;
            font-weight: 600;
            animation: wlRise 0.6s ease 0.24s both;
          }

          .wl-desc {
            max-width: 440px;
            margin: 10px 0 0;
            color: #a9bfcc;
            font-size: 15px;
            line-height: 1.7;
            animation: wlRise 0.6s ease 0.32s both;
          }

          /* ---------- Saran ---------- */
          .wl-grid {
            width: 100%;
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            animation: wlRise 0.6s ease 0.4s both;
          }

          .wl-card {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 56px;
            padding: 12px 14px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.07);
            background: rgba(255, 255, 255, 0.03);
            color: #cde4ed;
            font-size: 14px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition:
              background 0.2s ease,
              border-color 0.2s ease,
              transform 0.15s ease;
          }

          .wl-card:hover {
            background: rgba(0, 194, 255, 0.08);
            border-color: rgba(0, 194, 255, 0.32);
            transform: translateY(-1px);
          }

          .wl-card:active {
            transform: scale(0.97);
          }

          .wl-card-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: #00c2ff;
            background: rgba(0, 194, 255, 0.1);
          }

          .wl-card-icon svg {
            pointer-events: none;
          }

          /* ---------- HP ---------- */
          @media (max-width: 767px) {
            .wl-root {
              padding: 16px 14px 28px;
            }

            .wl-logo {
              width: 64px;
              height: 64px;
              margin-bottom: 22px;
            }

            .wl-logo img {
              border-radius: 19px;
            }

            .wl-hello {
              font-size: 14px;
            }

            .wl-sub {
              font-size: 15px;
            }

            .wl-desc {
              font-size: 14px;
            }

            .wl-grid {
              margin-top: 24px;
              gap: 8px;
            }

            .wl-card {
              min-height: 52px;
              padding: 10px 12px;
              font-size: 13px;
            }
          }

          @media (max-width: 340px) {
            .wl-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .wl-logo,
            .wl-hello,
            .wl-title,
            .wl-sub,
            .wl-desc,
            .wl-grid {
              animation: none;
            }
          }
        `}
      </style>

      <div className="wl-root">
        <div className="wl-content">
          <div className="wl-logo">
            <img src="/logo.svg" alt="AI.Ind" />
          </div>

          <p className="wl-hello">Selamat datang di</p>

          <h1 className="wl-title">
            <span className="wl-ai">AI</span>
            <span className="wl-dot" />
            <span className="wl-ind">Ind</span>
          </h1>

          <div className="wl-sub">Asisten AI buatan Indonesia</div>

          <p className="wl-desc">
            Teman cerdas untuk belajar, mencari ide, memahami sesuatu,
            membuat kode, dan menganalisis gambar.
          </p>

          <div className="wl-grid">
            {SARAN.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="wl-card"
                onClick={() => setMessage(label)}
              >
                <span className="wl-card-icon">
                  <Icon size={17} />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Welcome;