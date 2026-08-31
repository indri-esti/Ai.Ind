function Header() {
  const isMobile = window.innerWidth < 768;

  return (
    <header
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",

        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",

        padding: isMobile
          ? "16px 20px 16px 78px"
          : "18px 28px",

        borderBottom: "1px solid rgba(255,255,255,0.07)",

        background:
          "linear-gradient(180deg, rgba(8,20,32,0.99), rgba(8,20,32,0.94))",

        position: "relative",
        flexShrink: 0,
        alignSelf: "stretch",

        overflow: "hidden",

        boxSizing: "border-box",

        zIndex: 10,
      }}
    >
      {/* =========================
          GLOW BIRU
      ========================= */}
      <div
        style={{
          position: "absolute",

          top: "-70px",
          left: isMobile ? "15%" : "8%",

          width: isMobile ? "200px" : "260px",
          height: "130px",

          background: "rgba(0,194,255,0.08)",

          filter: "blur(55px)",

          pointerEvents: "none",
        }}
      />

      {/* =========================
          HEADER CONTENT
      ========================= */}
      <div
        style={{
          position: "relative",
          zIndex: 2,

          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",

          width: "fit-content",

          margin: 0,
          padding: 0,
        }}
      >
        {/* LOGO / TITLE */}
        <h2
          style={{
            margin: 0,
            padding: 0,

            color: "#00C2FF",

            fontSize: isMobile ? "25px" : "28px",

            fontWeight: 750,

            letterSpacing: "-0.8px",

            lineHeight: 1.15,

            whiteSpace: "nowrap",
          }}
        >
          AI.Ind
        </h2>

        {/* =========================
            SUBTITLE
        ========================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",

            gap: "7px",

            marginTop: "7px",

            color: "#8A9BB5",

            fontSize: isMobile ? "13px" : "14px",

            fontWeight: 400,

            lineHeight: 1.2,

            whiteSpace: "nowrap",
          }}
        >
          {/* STATUS DOT */}
          <span
            style={{
              display: "inline-block",

              width: "6px",
              height: "6px",

              minWidth: "6px",

              borderRadius: "50%",

              background: "#00C2FF",

              boxShadow:
                "0 0 8px rgba(0,194,255,0.75)",
            }}
          />

          <span>
            Asisten AI buatan Indonesia
          </span>
        </div>
      </div>

      {/* =========================
          BLUE ACCENT LINE
      ========================= */}
      <div
        style={{
          position: "absolute",

          bottom: 0,

          left: isMobile ? "78px" : "28px",

          width: isMobile ? "45px" : "48px",

          height: "2px",

          borderRadius: "10px",

          background: "#00C2FF",

          boxShadow:
            "0 0 12px rgba(0,194,255,0.55)",

          zIndex: 3,
        }}
      />
    </header>
  );
}

export default Header;