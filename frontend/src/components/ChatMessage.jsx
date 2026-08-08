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

  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          msg.role === "user" ? "flex-end" : "flex-start",
        width: "100%",
        marginBottom: "12px",
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

          padding: "14px 18px",
          borderRadius: "20px",
          maxWidth: "90%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: "1.6",
        }}
      >
        {cleanContent(msg.content)}
      </div>
    </div>
  );
}

export default ChatMessage;