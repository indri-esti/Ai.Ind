function ChatMessage({ msg }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          msg.role === "user"
            ? "flex-end"
            : "flex-start",
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
          borderRadius: 20,
          maxWidth: "90%",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default ChatMessage;