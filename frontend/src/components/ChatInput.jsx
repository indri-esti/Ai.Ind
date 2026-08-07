import { Form, Button, Container } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";

function ChatInput({
  message,
  setMessage,
  kirimPesan,
  loading,
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#081420",
        padding: "18px 0 24px",
        zIndex: 999,
      }}
    >
      <Container
        fluid
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            kirimPesan();
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              background: "#13283F",
              borderRadius: 28,
              padding: "8px 10px 8px 18px",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            }}
          >
            <Form.Control
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  kirimPesan();
                }
              }}
              placeholder="Ketik pertanyaan untuk AI.Ind..."
              className="chat-input"
              style={{
                flex: 1,
                resize: "none",
                overflowY: "auto",
                background: "transparent",
                color: "#fff",
                border: "none",
                outline: "none",
                boxShadow: "none",
                fontSize: 16,
                lineHeight: "24px",
                minHeight: 42,
                maxHeight: 120,
              }}
            />

            <Button
              type="submit"
              disabled={loading}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "none",
                background: loading ? "#4B647A" : "#00C2FF",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <FaPaperPlane color="#081420" />
            </Button>
          </div>
        </Form>

        <div
          style={{
            marginTop: 10,
            textAlign: "center",
            color: "#6F849A",
            fontSize: 12,
          }}
        >
          AI.Ind dapat membuat kesalahan. Selalu periksa kembali jawaban penting.
        </div>
      </Container>
    </div>
  );
}

export default ChatInput;