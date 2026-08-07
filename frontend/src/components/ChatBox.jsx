import Welcome from "./Welcome";
import ChatMessage from "./ChatMessage";
import Typing from "./Typing";

function ChatBox({
  messages,
  loading,
  chatEndRef,
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        paddingBottom: 170,
        scrollbarWidth: "thin",
      }}
    >
      <Welcome messages={messages} />

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