import { Form, Button } from "react-bootstrap";
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
        left: 0,
        right: 0,
        bottom: 0,

        background: "#081420",

        // Jarak dari bawah layar
        padding: "12px 16px 14px",

        zIndex: 999,

        boxSizing: "border-box",
      }}
    >
      {/* AREA INPUT DIBUAT BENAR-BENAR DI TENGAH */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();

            if (!loading && message.trim()) {
              kirimPesan();
            }
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,

              width: "100%",
              boxSizing: "border-box",

              background: "#13283F",
              borderRadius: 28,

              padding: "7px 8px 7px 18px",

              border: "1px solid rgba(255,255,255,.08)",

              boxShadow: "0 8px 25px rgba(0,0,0,.25)",
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

                  if (!loading && message.trim()) {
                    kirimPesan();
                  }
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

                fontSize: 15,
                lineHeight: "22px",

                minHeight: 40,
                maxHeight: 110,

                padding: "8px 0",

                boxSizing: "border-box",
              }}
            />

            <Button
              type="submit"
              disabled={loading || !message.trim()}
              style={{
                width: 46,
                height: 46,

                minWidth: 46,

                borderRadius: "50%",
                border: "none",

                background:
                  loading || !message.trim()
                    ? "#4B647A"
                    : "#00C2FF",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                flexShrink: 0,

                padding: 0,
              }}
            >
              <FaPaperPlane
                color="#081420"
                size={17}
              />
            </Button>
          </div>
        </Form>

        {/* KETERANGAN */}
        <div
          style={{
            marginTop: 8,

            textAlign: "center",

            color: "#6F849A",
            fontSize: 11,

            lineHeight: "16px",

            paddingBottom: 2,
          }}
        >
          AI.Ind dapat membuat kesalahan. Selalu periksa kembali jawaban penting.
        </div>
      </div>
    </div>
  );
}

export default ChatInput;