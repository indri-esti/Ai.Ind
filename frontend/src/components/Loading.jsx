
function Loading() {
  return (
    <>
      <style>
        {`
          @keyframes rotate {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes rotateReverse {
            to {
              transform: rotate(-360deg);
            }
          }

          @keyframes breathe {
            0%, 100% {
              transform: scale(0.96);
              opacity: 0.85;
            }
            50% {
              transform: scale(1.04);
              opacity: 1;
            }
          }

          @keyframes glow {
            0%, 100% {
              box-shadow:
                0 0 20px rgba(0, 194, 255, 0.25),
                0 0 50px rgba(0, 194, 255, 0.08);
            }
            50% {
              box-shadow:
                0 0 30px rgba(0, 194, 255, 0.5),
                0 0 80px rgba(0, 194, 255, 0.15);
            }
          }

          @keyframes dots {
            0%, 80%, 100% {
              opacity: 0.25;
              transform: translateY(0);
            }
            40% {
              opacity: 1;
              transform: translateY(-4px);
            }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes backgroundMove {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
            background:
              radial-gradient(
                circle at center,
                #102d42 0%,
                #081824 42%,
                #050d15 100%
              );
          }

          .loading-screen::before {
            content: "";
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: rgba(0, 194, 255, 0.06);
            filter: blur(80px);
            animation: breathe 4s ease-in-out infinite;
          }

          .loading-logo {
            width: 105px;
            height: 105px;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: breathe 2.5s ease-in-out infinite;
          }

          .loading-ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-top-color: #00c2ff;
            border-right-color: rgba(0, 194, 255, 0.35);
            animation: rotate 1.3s linear infinite;
          }

          .loading-ring::after {
            content: "";
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-left-color: rgba(0, 194, 255, 0.5);
            animation: rotateReverse 2s linear infinite;
          }

          .loading-core {
            width: 62px;
            height: 62px;
            border-radius: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(
              145deg,
              #00c2ff,
              #008fd4
            );
            color: #04111a;
            font-size: 21px;
            font-weight: 800;
            letter-spacing: -1px;
            animation: glow 2s ease-in-out infinite;
          }

          .loading-title {
            margin-top: 30px;
            margin-bottom: 0;
            color: #ffffff;
            font-size: 27px;
            font-weight: 700;
            letter-spacing: -0.7px;
            animation: fadeUp 0.8s ease;
          }

          .loading-subtitle {
            margin-top: 9px;
            margin-bottom: 0;
            color: #8094aa;
            font-size: 14px;
            animation: fadeUp 1s ease;
          }

          .loading-dots {
            display: flex;
            gap: 5px;
            margin-top: 18px;
          }

          .loading-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #00c2ff;
            animation: dots 1.4s infinite ease-in-out;
          }

          .loading-dot:nth-child(2) {
            animation-delay: 0.15s;
          }

          .loading-dot:nth-child(3) {
            animation-delay: 0.3s;
          }

          .loading-footer {
            position: absolute;
            bottom: 28px;
            color: rgba(255, 255, 255, 0.28);
            font-size: 11px;
            letter-spacing: 0.5px;
          }
        `}
      </style>

      <div className="loading-screen">
        <div className="loading-logo">
          <div className="loading-ring" />

          <div className="loading-core">
            AI
          </div>
        </div>

        <h2 className="loading-title">
          AI.Ind
        </h2>

        <p className="loading-subtitle">
          Menyiapkan pengalaman terbaik
        </p>

        <div className="loading-dots">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>

        <div className="loading-footer">
          AI.Ind • Your Intelligent Assistant
        </div>
      </div>
    </>
  );
}

export default Loading;

