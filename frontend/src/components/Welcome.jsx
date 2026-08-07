import { FaRobot } from "react-icons/fa";

function Welcome({ messages }) {
  if (messages.length > 0) {
    return null;
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 20px 120px",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "rgba(0,194,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          boxShadow: "0 0 25px rgba(0,194,255,.15)",
        }}
      >
        <FaRobot
          size={52}
          color="#00C2FF"
        />
      </div>

      <h2
        style={{
          color: "#ffffff",
          fontWeight: "700",
          fontSize: "clamp(28px, 4vw, 38px)",
          margin: 0,
          lineHeight: "1.3",
        }}
      >
        Selamat Datang di{" "}
        <span style={{ color: "#00C2FF" }}>
          AI.Ind
        </span>
      </h2>

      <p
        style={{
          color: "#8A9BB5",
          fontSize: "17px",
          marginTop: "22px",
          maxWidth: "700px",
          lineHeight: "32px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Saya dapat membantu membuat website, memperbaiki kode,
        menjelaskan materi, menganalisis file, menjawab pertanyaan,
        membantu belajar, serta berbagai kebutuhan pemrograman dan
        teknologi lainnya.
      </p>
    </div>
  );
}

export default Welcome;