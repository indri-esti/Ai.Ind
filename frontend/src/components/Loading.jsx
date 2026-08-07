

function Loading() {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse {
            0%,100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.08);
            }
          }

          @keyframes bgMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background:
            "linear-gradient(-45deg,#081420,#10293A,#0B1D2A,#081420)",
          backgroundSize: "300% 300%",
          animation: "bgMove 8s ease infinite",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 90,
            height: 90,
            animation: "pulse 2s infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "5px solid rgba(255,255,255,.15)",
              borderTop: "5px solid #00C2FF",
              animation: "spin 1s linear infinite",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 18,
              borderRadius: "50%",
              background: "#00C2FF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#081420",
              fontWeight: "bold",
              fontSize: 20,
              boxShadow: "0 0 20px rgba(0,194,255,.5)",
            }}
          >
            AI
          </div>
        </div>

        <h2
          style={{
            marginTop: 28,
            color: "#fff",
            fontWeight: "700",
          }}
        >
          AI.Ind
        </h2>

        <p
          style={{
            marginTop: 10,
            color: "#8A9BB5",
          }}
        >
          Menyiapkan pengalaman terbaik...
        </p>
      </div>
    </>
  );
}

export default Loading;