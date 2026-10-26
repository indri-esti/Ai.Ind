function Header() {
  return (
    <>
      <style>
        {`
          @keyframes hdStatusPulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0.55); }
            70% { box-shadow: 0 0 0 7px rgba(0, 194, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0); }
          }

          @keyframes hdDotBreath {
            0%, 100% {
              box-shadow: 0 0 6px rgba(0, 194, 255, 0.6), 0 0 14px rgba(0, 194, 255, 0.35);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 10px rgba(0, 194, 255, 0.95), 0 0 24px rgba(0, 194, 255, 0.55);
              transform: scale(1.12);
            }
          }

          @keyframes hdGlowFloat {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.85; }
            50% { transform: translate3d(40px, 8px, 0); opacity: 1; }
          }

          @keyframes hdLineSweep {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(420%); }
          }

          @keyframes hdIndShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .hd-root {
            position: relative;
            z-index: 10;
            flex-shrink: 0;
            align-self: stretch;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            min-height: 78px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: calc(18px + env(safe-area-inset-top, 0px)) 36px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background:
              radial-gradient(
                ellipse 60% 140% at 0% 0%,
                rgba(0, 194, 255, 0.07),
                transparent 70%
              ),
              linear-gradient(
                180deg,
                rgba(8, 20, 32, 0.99),
                rgba(8, 20, 32, 0.92)
              );
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            backdrop-filter: blur(16px) saturate(140%);
          }

          .hd-glow {
            position: absolute;
            top: -90px;
            left: 6%;
            width: 340px;
            height: 160px;
            background: rgba(0, 194, 255, 0.11);
            filter: blur(60px);
            pointer-events: none;
            animation: hdGlowFloat 9s ease-in-out infinite;
            will-change: transform, opacity;
          }

          .hd-line {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 1px;
            overflow: hidden;
            background: linear-gradient(
              90deg,
              rgba(0, 194, 255, 0.55),
              rgba(0, 194, 255, 0.12) 45%,
              transparent 85%
            );
            pointer-events: none;
          }

          .hd-line::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 25%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(140, 225, 255, 0.95),
              transparent
            );
            animation: hdLineSweep 5.5s cubic-bezier(0.45, 0, 0.25, 1) infinite;
            will-change: transform;
          }

          .hd-left {
            position: relative;
            z-index: 2;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .hd-title {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: flex-end;
            font-size: 28px;
            line-height: 1.1;
            letter-spacing: -1px;
            white-space: nowrap;
          }

          .hd-ai {
            font-weight: 800;
            color: #f1f7fb;
            text-shadow: 0 0 18px rgba(0, 194, 255, 0.18);
          }

          .hd-dot {
            width: 7px;
            height: 7px;
            margin: 0 3px 5px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 10px rgba(0, 194, 255, 0.85);
            flex-shrink: 0;
            animation: hdDotBreath 3s ease-in-out infinite;
          }

          .hd-ind {
            font-weight: 300;
            color: #00c2ff;
            background: linear-gradient(
              90deg,
              #00c2ff,
              #7fe3ff,
              #00c2ff
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: hdIndShift 6s ease-in-out infinite;
          }

          .hd-sub {
            margin: 6px 0 0;
            font-size: 13.5px;
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: 0.1px;
            color: #8a9bb5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .hd-status {
            position: relative;
            z-index: 2;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 34px;
            padding: 0 14px;
            border-radius: 999px;
            font-size: 12.5px;
            font-weight: 500;
            color: #bfeaff;
            background: linear-gradient(
              180deg,
              rgba(0, 194, 255, 0.12),
              rgba(0, 194, 255, 0.05)
            );
            border: 1px solid rgba(0, 194, 255, 0.24);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.06),
              0 0 18px rgba(0, 194, 255, 0.08);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            user-select: none;
          }

          .hd-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #00c2ff;
            animation: hdStatusPulse 2.2s ease-out infinite;
          }

          /* ---------- HP ----------
             padding kiri 78px dipertahankan supaya tidak
             menimpa tombol buka/tutup sidebar */
          @media (max-width: 767px) {
            .hd-root {
              min-height: 70px;
              padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 14px 78px;
            }

            .hd-title { font-size: 25px; }

            .hd-sub { font-size: 12.5px; }

            .hd-status {
              height: 30px;
              padding: 0 11px;
              font-size: 11.5px;
            }
          }

          @media (max-width: 400px) {
            .hd-status span:last-child { display: none; }
            .hd-status { padding: 0 10px; }
          }

          @media (prefers-reduced-motion: reduce) {
            .hd-glow,
            .hd-dot,
            .hd-ind,
            .hd-status-dot { animation: none; }
            .hd-line::after { animation: none; opacity: 0; }
          }
        `}
      </style>

      <header className="hd-root">
        <div className="hd-glow" />

        <div className="hd-left">
          <h2 className="hd-title">
            <span className="hd-ai">AI</span>
            <span className="hd-dot" />
            <span className="hd-ind">Ind</span>
          </h2>

          <p className="hd-sub">Asisten AI buatan Indonesia</p>
        </div>

        <div className="hd-status">
          <span className="hd-status-dot" />
          <span>Siap membantu</span>
        </div>

        <div className="hd-line" />
      </header>
    </>
  );
}

export default Header;