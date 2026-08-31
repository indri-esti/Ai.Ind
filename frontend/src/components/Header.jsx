function Header() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",

        padding:
          window.innerWidth < 768
            ? "18px 20px 18px 78px"
            : "18px 28px",

        borderBottom: "1px solid rgba(255,255,255,0.07)",

        background:
          "linear-gradient(180deg, rgba(8,20,32,0.98), rgba(8,20,32,0.92))",

        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow biru */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "10%",
          width: "220px",
          height: "120px",
          background: "rgba(0,194,255,0.08)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Judul */}
        <h2
          style={{
            margin: 0,
            color: "#00C2FF",
            fontSize: window.innerWidth < 768 ? 25 : 28,
            fontWeight: 750,
            letterSpacing: "-0.8px",
            lineHeight: 1.2,
          }}
        >
          AI.Ind
        </h2>

        {/* Subjudul */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginTop: 6,
            color: "#8A9BB5",
            fontSize: 13,
            fontWeight: 400,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00C2FF",
              boxShadow: "0 0 9px rgba(0,194,255,0.7)",
            }}
          />

          Asisten AI buatan Indonesia
        </div>
      </div>

      {/* Aksen biru */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: window.innerWidth < 768 ? 78 : 28,
          width: 45,
          height: 2,
          borderRadius: 10,
          background: "#00C2FF",
          boxShadow: "0 0 12px rgba(0,194,255,0.5)",
        }}
      />
    </div>
  );
}

export default Header;
