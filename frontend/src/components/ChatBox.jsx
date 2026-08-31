import Welcome from "./Welcome";
import ChatMessage from "./ChatMessage";
import Typing from "./Typing";

function ChatBox({ messages, loading, chatEndRef }) {
  return (
    <div
      style={{
        flex: 1,

        // Scroll utama ditangani oleh .home-messages di Home.jsx
        overflowY: "visible",
        overflowX: "visible",

        display: "flex",
        flexDirection: "column",
        gap: 18,

        // Memberi ruang supaya pesan terakhir tidak ketutup ChatInput
        paddingBottom: 150,

        paddingTop: 20,
        paddingLeft: 16,
        paddingRight: 16,

        scrollbarWidth: "thin",
        width: "100%",
        boxSizing: "border-box",

        // Jangan membuat area ChatBox mengganggu tombol input
        position: "relative",
        zIndex: 1,
        pointerEvents: "auto",
        touchAction: "pan-y",
      }}
    >
      {messages.map((msg, index) => (
        <ChatMessage
          key={index}
          msg={msg}
        />
      ))}

      {loading && <Typing />}

      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatBox;