
function Loading() {
  return (
    <>
      <style>
        {`
          @keyframes spinSlow {
            to { transform: rotate(360deg); }
          }

          @keyframes orbPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }

          @keyframes auroraOne {
            0%, 100% { transform: translate(-20%, -10%) scale(1); }
            50% { transform: translate(15%, 12%) scale(1.25); }
          }

          @keyframes auroraTwo {
            0%, 100% { transform: translate(20%, 15%) scale(1.1); }
            50% { transform: translate(-15%, -12%) scale(0.9); }
          }

          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }

          @keyframes sparkle {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
            50% { transform: scale(1.12) rotate(12deg); opacity: 1; }
          }

          @keyframes progressMove {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }

          @keyframes riseIn {
            from { opacity: 0; transform: translateY(14px); filter: blur(6px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }

          .ld-screen {
            position: fixed;
            inset: 0;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #05070d;
            padding: env(safe-area-inset-top, 0px) 24px
              env(safe-area-inset-bottom, 0px);
          }

          /* ---------- Aurora background ---------- */
          .ld-aurora {
            position: absolute;
            border-radius: 50%;
            filter: blur(90px);
            pointer-events: none;
          }

          .ld-aurora.one {
            width: 380px;
            height: 380px;
            top: 8%;
            left: -12%;
            background: rgba(99, 102, 241, 0.38);
            animation: auroraOne 11s ease-in-out infinite;
          }

          .ld-aurora.two {
            width: 340px;
            height: 340px;
            bottom: 6%;
            right: -14%;
            background: rgba(6, 182, 212, 0.32);
            animation: auroraTwo 13s ease-in-out infinite;
          }

          .ld-grid {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
            background-size: 44px 44px;
            -webkit-mask-image: radial-gradient(circle at center, #000 0%, transparent 70%);
            mask-image: radial-gradient(circle at center, #000 0%, transparent 70%);
          }

          /* ---------- Orb ---------- */
          .ld-orb {
            position: relative;
            width: 124px;
            height: 124px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: orbPulse 3s ease-in-out infinite, riseIn 0.9s ease both;
          }

          .ld-orb-glow {
            position: absolute;
            inset: -14px;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              #6366f1,
              #22d3ee,
              #a78bfa,
              #6366f1
            );
            filter: blur(26px);
            opacity: 0.55;
            animation: spinSlow 6s linear infinite;
          }

          .ld-orb-ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            padding: 2px;
            background: conic-gradient(
              from 0deg,
              #6366f1,
              #22d3ee,
              #a78bfa,
              #6366f1
            );
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask:
              linear-gradient(#000 0 0) content-box exclude,
              linear-gradient(#000 0 0);
            animation: spinSlow 3.2s linear infinite;
          }

          .ld-orb-core {
            position: relative;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.18), transparent 55%),
              rgba(14, 18, 32, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow:
              inset 0 0 30px rgba(99, 102, 241, 0.25),
              0 10px 40px rgba(0, 0, 0, 0.5);
            -webkit-backdrop-filter: blur(12px);
            backdrop-filter: blur(12px);
          }

          .ld-sparkle {
            width: 42px;
            height: 42px;
            animation: sparkle 2.4s ease-in-out infinite;
            filter: drop-shadow(0 0 10px rgba(129, 140, 248, 0.8));
          }

          /* ---------- Teks ---------- */
          .ld-title {
            margin: 38px 0 0;
            font-size: 34px;
            font-weight: 700;
            letter-spacing: -1.2px;
            line-height: 1.1;
            background: linear-gradient(
              90deg,
              #ffffff 0%,
              #a5b4fc 25%,
              #67e8f9 50%,
              #a5b4fc 75%,
              #ffffff 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            animation: shimmer 4s linear infinite, riseIn 0.9s ease 0.15s both;
          }

          .ld-subtitle {
            margin: 12px 0 0;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.2px;
            color: rgba(203, 213, 225, 0.6);
            animation: riseIn 0.9s ease 0.3s both;
          }

          /* ---------- Progress bar ---------- */
          .ld-progress {
            position: relative;
            width: 140px;
            height: 3px;
            margin-top: 30px;
            overflow: hidden;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.08);
            animation: riseIn 0.9s ease 0.45s both;
          }

          .ld-progress::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 40%;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #6366f1, #22d3ee);
            box-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
            animation: progressMove 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          .ld-footer {
            position: absolute;
            bottom: calc(26px + env(safe-area-inset-bottom, 0px));
            font-size: 11px;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.28);
            animation: riseIn 0.9s ease 0.6s both;
          }

          /* ---------- Hormati pengaturan "kurangi gerakan" ---------- */
          @media (prefers-reduced-motion: reduce) {
            .ld-screen *,
            .ld-screen *::before {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}
      </style>

      <div className="ld-screen" role="status" aria-live="polite" aria-label="Memuat AI.Ind">
        <div className="ld-aurora one" />
        <div className="ld-aurora two" />
        <div className="ld-grid" />

        <div className="ld-orb">
          <div className="ld-orb-glow" />
          <div className="ld-orb-ring" />

          <div className="ld-orb-core">
            <svg
              className="ld-sparkle"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="ldSparkGrad" x1="3" y1="3" x2="21" y2="21">
                  <stop offset="0%" stopColor="#c7d2fe" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <path
                d="M12 2c.6 4.9 2.1 6.4 7 7-4.9.6-6.4 2.1-7 7-.6-4.9-2.1-6.4-7-7 4.9-.6 6.4-2.1 7-7Z"
                fill="url(#ldSparkGrad)"
              />
              <path
                d="M19 14c.3 2.2 1 2.9 3 3.2-2 .3-2.7 1-3 3.2-.3-2.2-1-2.9-3-3.2 2-.3 2.7-1 3-3.2Z"
                fill="url(#ldSparkGrad)"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        <h2 className="ld-title">AI.Ind</h2>

        <p className="ld-subtitle">Menyiapkan pengalaman terbaik</p>

        <div className="ld-progress" />

        <div className="ld-footer">AI.Ind • Your Intelligent Assistant</div>
      </div>
    </>
  );
}

export default Loading;