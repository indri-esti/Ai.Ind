function Typing() {
  return (
    <>
      <style>
        {`
          @keyframes tyWave {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }

          @keyframes tyIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .ty-row {
            display: flex;
            width: 100%;
            margin: 2px 0 14px;
            padding: 0 4px;
            box-sizing: border-box;
            animation: tyIn 0.2s ease both;
          }

          .ty-col {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .ty-label {
            display: flex;
            align-items: flex-end;
            margin: 0 0 6px 4px;
            font-size: 12px;
            letter-spacing: -0.2px;
            color: #9fb4c4;
            user-select: none;
          }

          .ty-label b {
            font-weight: 800;
            color: #e8f3fa;
          }

          .ty-label-dot {
            width: 5px;
            height: 5px;
            margin: 0 3px 3px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 8px rgba(0, 194, 255, 0.8);
          }

          .ty-bubble {
            position: relative;
            display: flex;
            align-items: center;
            gap: 6px;
            height: 44px;
            padding: 0 20px 0 22px;
            border-radius: 6px 20px 20px 20px;
            overflow: hidden;
            box-sizing: border-box;
            background: linear-gradient(
              160deg,
              rgba(24, 48, 74, 0.95),
              rgba(15, 32, 52, 0.95)
            );
            border: 1px solid rgba(0, 194, 255, 0.14);
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.22);
          }

          .ty-bubble::before {
            content: "";
            position: absolute;
            left: 0;
            top: 10px;
            bottom: 10px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: linear-gradient(180deg, #00c2ff, rgba(0, 194, 255, 0.15));
          }

          .ty-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #00c2ff;
            animation: tyWave 0.9s ease-in-out infinite;
          }

          .ty-dot:nth-child(2) { animation-delay: 0.12s; }
          .ty-dot:nth-child(3) { animation-delay: 0.24s; }

          @media (prefers-reduced-motion: reduce) {
            .ty-row { animation: none; }
            .ty-dot { animation-duration: 2s; }
          }
        `}
      </style>

      <div
        className="ty-row"
        role="status"
        aria-live="polite"
        aria-label="AI.Ind sedang mengetik"
      >
        <div className="ty-col">
          <div className="ty-label">
            <b>AI</b>
            <span className="ty-label-dot" />
            <span>Ind</span>
          </div>

          <div className="ty-bubble">
            <span className="ty-dot" />
            <span className="ty-dot" />
            <span className="ty-dot" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Typing;