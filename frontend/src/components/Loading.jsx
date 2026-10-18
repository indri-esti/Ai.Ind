function Loading() {
  return (
    <>
      <style>
        {`
          @keyframes aiLdLetterIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes aiLdBounce {
            0%, 100% { transform: translateY(0) scale(1, 1); }
            45% { transform: translateY(-11px) scale(0.92, 1.08); }
            75% { transform: translateY(0) scale(1.18, 0.82); }
          }

          @keyframes aiLdRipple {
            0%, 55% { transform: scale(0.6); opacity: 0; }
            60% { opacity: 0.7; }
            100% { transform: scale(3.6); opacity: 0; }
          }

          @keyframes aiLdShadow {
            0%, 100% { transform: scaleX(1); opacity: 0.35; }
            45% { transform: scaleX(0.5); opacity: 0.12; }
          }

          @keyframes aiLdSlide {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(260%); }
          }

          @keyframes aiLdFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .ai-ld-screen {
            position: fixed;
            inset: 0;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                ellipse at 50% 42%,
                #0b1f2e 0%,
                #060f18 55%,
                #04090f 100%
              );
            padding: env(safe-area-inset-top, 0px) 24px
              env(safe-area-inset-bottom, 0px);
            overflow: hidden;
          }

          /* ---------- Wordmark ---------- */
          .ai-ld-mark {
            display: flex;
            align-items: flex-end;
            font-size: 38px;
            line-height: 1;
            letter-spacing: -1.5px;
            color: #f1f7fb;
            user-select: none;
          }

          .ai-ld-ai {
            font-weight: 800;
            opacity: 0;
            animation: aiLdLetterIn 0.6s ease 0.05s forwards;
          }

          .ai-ld-ind {
            font-weight: 300;
            color: #9fb4c4;
            opacity: 0;
            animation: aiLdLetterIn 0.6s ease 0.25s forwards;
          }

          /* ---------- Titik yang memantul ---------- */
          .ai-ld-dot-wrap {
            position: relative;
            width: 9px;
            height: 9px;
            margin: 0 3px 5px;
            flex-shrink: 0;
          }

          .ai-ld-dot {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 10px rgba(0, 194, 255, 0.75);
            animation: aiLdBounce 1.3s cubic-bezier(0.3, 0.6, 0.4, 1) infinite;
          }

          .ai-ld-ripple {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 1.5px solid rgba(0, 194, 255, 0.8);
            opacity: 0;
            animation: aiLdRipple 1.3s ease-out infinite;
          }

          .ai-ld-shadow {
            position: absolute;
            left: -2px;
            right: -2px;
            bottom: -9px;
            height: 3px;
            border-radius: 50%;
            background: rgba(0, 194, 255, 0.45);
            filter: blur(2px);
            animation: aiLdShadow 1.3s cubic-bezier(0.3, 0.6, 0.4, 1) infinite;
          }

          /* ---------- Garis tipis + teks ---------- */
          .ai-ld-track {
            position: relative;
            width: 56px;
            height: 2px;
            margin-top: 26px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.08);
            opacity: 0;
            animation: aiLdFade 0.6s ease 0.5s forwards;
          }

          .ai-ld-track::after {
            content: "";
            position: absolute;
            inset: 0;
            width: 40%;
            border-radius: 999px;
            background: #00c2ff;
            animation: aiLdSlide 1.3s ease-in-out infinite;
          }

          .ai-ld-text {
            margin: 12px 0 0;
            font-size: 12px;
            letter-spacing: 0.4px;
            color: rgba(159, 180, 196, 0.7);
            opacity: 0;
            animation: aiLdFade 0.6s ease 0.7s forwards;
          }

          .ai-ld-footer {
            position: absolute;
            bottom: calc(24px + env(safe-area-inset-bottom, 0px));
            font-size: 10px;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.2);
            opacity: 0;
            animation: aiLdFade 0.6s ease 0.9s forwards;
          }

          /* ---------- Hormati pengaturan "kurangi gerakan" ---------- */
          @media (prefers-reduced-motion: reduce) {
            .ai-ld-screen *,
            .ai-ld-screen *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}
      </style>

      <div
        className="ai-ld-screen"
        role="status"
        aria-live="polite"
        aria-label="Memuat AI.Ind"
      >
        <div className="ai-ld-mark">
          <span className="ai-ld-ai">AI</span>

          <span className="ai-ld-dot-wrap">
            <span className="ai-ld-ripple" />
            <span className="ai-ld-dot" />
            <span className="ai-ld-shadow" />
          </span>

          <span className="ai-ld-ind">Ind</span>
        </div>

        <div className="ai-ld-track" />

        <p className="ai-ld-text">Menyiapkan AI.Ind</p>

        <div className="ai-ld-footer">Asisten cerdas Indonesia</div>
      </div>
    </>
  );
}

export default Loading;