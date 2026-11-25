function Header() {
  return (
    <>
      <style>
        {`
          @keyframes hdIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes hdInSide {
            from { opacity: 0; transform: translateX(8px); }
            to { opacity: 1; transform: translateX(0); }
          }

          @keyframes hdStatusPulse {
            0% { box-shadow: 0 0 8px rgba(46, 230, 255, 0.9), 0 0 0 0 rgba(46, 230, 255, 0.6); }
            70% { box-shadow: 0 0 8px rgba(46, 230, 255, 0.9), 0 0 0 7px rgba(46, 230, 255, 0); }
            100% { box-shadow: 0 0 8px rgba(46, 230, 255, 0.9), 0 0 0 0 rgba(46, 230, 255, 0); }
          }

          @keyframes hdLineSweep {
            0% { transform: translateX(-120%); }
            70%, 100% { transform: translateX(520%); }
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
            border-bottom: 1px solid rgba(0, 194, 255, 0.18);
            background:
              radial-gradient(
                ellipse 55% 160% at 0% 0%,
                rgba(0, 194, 255, 0.11),
                transparent 70%
              ),
              linear-gradient(
                180deg,
                rgba(9, 24, 38, 0.99),
                rgba(7, 19, 31, 0.96)
              );
            -webkit-backdrop-filter: blur(18px) saturate(140%);
            backdrop-filter: blur(18px) saturate(140%);
            box-shadow: 0 8px 26px rgba(0, 0, 0, 0.28);
          }

          /* cahaya lembut di kiri, diam (tidak bergerak) */
          .hd-glow {
            position: absolute;
            top: -90px;
            left: 6%;
            width: 340px;
            height: 160px;
            background: rgba(0, 194, 255, 0.14);
            filter: blur(60px);
            pointer-events: none;
          }

          /* garis bawah tipis, dengan satu kilau yang lewat pelan */
          .hd-line {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 1px;
            overflow: hidden;
            background: linear-gradient(
              90deg,
              rgba(0, 194, 255, 0.7),
              rgba(0, 194, 255, 0.18) 45%,
              transparent 85%
            );
            pointer-events: none;
          }

          .hd-line::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 20%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(150, 230, 255, 0.95),
              transparent
            );
            animation: hdLineSweep 4.2s cubic-bezier(0.45, 0, 0.25, 1) 0.6s infinite;
          }

          .hd-left {
            position: relative;
            z-index: 2;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            animation: hdIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
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
            text-shadow: 0 0 18px rgba(0, 194, 255, 0.22);
          }

          .hd-dot {
            width: 7px;
            height: 7px;
            margin: 0 3px 5px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow:
              0 0 9px rgba(0, 194, 255, 0.9),
              0 0 20px rgba(0, 194, 255, 0.4);
            flex-shrink: 0;
          }

          .hd-ind {
            font-weight: 300;
            color: #00c2ff;
            background: linear-gradient(90deg, #00c2ff, #55d9ff);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .hd-sub {
            margin: 6px 0 0;
            font-size: 13.5px;
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: 0.1px;
            color: #9fb4c4;
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
            color: #cdeefb;
            background: linear-gradient(
              180deg,
              rgba(0, 194, 255, 0.13),
              rgba(0, 194, 255, 0.05)
            );
            border: 1px solid rgba(0, 194, 255, 0.28);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.07),
              0 0 16px rgba(0, 194, 255, 0.1);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            user-select: none;
            animation: hdInSide 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
          }

          .hd-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #2ee6ff;
            box-shadow: 0 0 8px rgba(46, 230, 255, 0.9);
            animation: hdStatusPulse 1.6s ease-out infinite;
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
            .hd-left,
            .hd-status,
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
