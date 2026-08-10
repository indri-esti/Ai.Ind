function ChatMessage({ msg }) {
  const cleanContent = (content = "") => {
    return content
      // Hilangkan tanda # di awal baris
      .replace(/^\s*#+\s?/gm, "")

      // Hilangkan tanda > di awal baris
      .replace(/^\s*>\s?/gm, "")

      // Hilangkan tanda **
      .replace(/\*\*/g, "")

      // Hilangkan tanda * untuk bullet sederhana
      .replace(/^\s*\*\s+/gm, "")

      // Hilangkan tanda ' jika berdiri sebagai tanda kutip
      .replace(/'/g, "")

      // Rapikan spasi berlebihan
      .replace(/[ \t]+$/gm, "")
      .trim();
  };


  const content =
    cleanContent(msg.content);


  const hasImage =
    msg.role === "user" &&
    msg.image;


  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          msg.role === "user"
            ? "flex-end"
            : "flex-start",

        width: "100%",

        marginBottom: "12px",

        paddingLeft: "4px",
        paddingRight: "4px",

        boxSizing: "border-box",
      }}
    >

      <div
        style={{
          background:
            msg.role === "user"
              ? "#00C2FF"
              : "#13283F",

          color:
            msg.role === "user"
              ? "#081420"
              : "#fff",

          padding:
            hasImage
              ? "7px"
              : "14px 18px",

          borderRadius: "20px",

          maxWidth: "90%",

          whiteSpace:
            "pre-wrap",

          wordBreak:
            "break-word",

          lineHeight:
            "1.6",

          overflow:
            "hidden",

          boxSizing:
            "border-box",
        }}
      >

        {/* =========================
            GAMBAR PESAN USER
        ========================== */}

        {hasImage && (
          <div
            style={{
              marginBottom:
                content
                  ? "8px"
                  : "0",

              borderRadius:
                "15px",

              overflow:
                "hidden",

              background:
                "rgba(0,0,0,.08)",
            }}
          >

            <img
              src={msg.image}
              alt="Gambar yang dikirim"
              style={{
                display:
                  "block",

                width:
                  "100%",

                maxWidth:
                  "360px",

                maxHeight:
                  "360px",

                objectFit:
                  "cover",

                borderRadius:
                  "15px",
              }}
            />

          </div>
        )}


        {/* =========================
            TEKS PESAN
        ========================== */}

        {content && (
          <div
            style={{
              padding:
                hasImage
                  ? "3px 7px 7px"
                  : "0",

              whiteSpace:
                "pre-wrap",

              wordBreak:
                "break-word",
            }}
          >
            {content}
          </div>
        )}

      </div>
    </div>
  );
}

export default ChatMessage;