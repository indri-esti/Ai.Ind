import { Form, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

function ChatInput({
  message,
  setMessage,
  kirimPesan,
  loading,
  fileInputRef,
  pilihGambar,
  imagePreview,
  hapusGambar,
}) {
  const handleKirim = () => {
    if (loading) return;

    if (!message.trim() && !imagePreview) return;

    kirimPesan();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 20,
      }}
    >
      <style>{`
        .home-plus-button {
          transition:
            background-color 0.15s ease,
            box-shadow 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }

        .home-plus-button:active {
          background-color: #1c3550 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,.3) !important;
        }

        .home-plus-icon {
          transition: transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .home-plus-button:active .home-plus-icon {
          transform: scale(0.82) rotate(90deg);
        }

        .send-btn {
          transition: background-color 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .send-icon {
          transition: transform 0.12s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .send-btn:active:not(:disabled) .send-icon {
          transform: scale(0.82);
        }

        .chat-input {
          -webkit-tap-highlight-color: transparent;
        }

        .chat-input:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleKirim();
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          {/* =====================================================
              PLUS / UPLOAD GAMBAR
              ===================================================== */}
          <label
            htmlFor="chat-image-input"
            className="home-plus-button"
            aria-label="Tambah gambar"
            title="Tambah gambar"
            style={{
              position: "relative",
              width: 46,
              height: 46,
              minWidth: 46,
              minHeight: 46,
              borderRadius: "50%",
              flexShrink: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "#13283F",
              border: "1px solid rgba(255,255,255,.09)",
              color: "#D7F6FF",

              boxShadow: "0 8px 24px rgba(0,0,0,.24)",

              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",

              padding: 0,
              margin: 0,

              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              userSelect: "none",
              WebkitUserSelect: "none",

              pointerEvents: loading ? "none" : "auto",
            }}
          >
            <span className="home-plus-icon">
              <FiPlus size={23} strokeWidth={2.5} />
            </span>
          </label>

          {/* =====================================================
              FILE INPUT
              ===================================================== */}
          <input
            id="chat-image-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={pilihGambar}
            disabled={loading}
            aria-label="Pilih gambar"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          />

          {/* =====================================================
              INPUT CHAT
              ===================================================== */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#13283F",
              borderRadius: 28,
              padding: "7px 8px 7px 18px",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 8px 25px rgba(0,0,0,.25)",
              boxSizing: "border-box",
            }}
          >
            <Form.Control
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();

                  if (!loading && (message.trim() || imagePreview)) {
                    handleKirim();
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

            {/* =================================================
                KIRIM
                ================================================= */}
            <Button
              type="submit"
              className="send-btn"
              disabled={
                loading || (!message.trim() && !imagePreview)
              }
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                minHeight: 46,
                borderRadius: "50%",
                border: "none",

                background:
                  loading || (!message.trim() && !imagePreview)
                    ? "#4B647A"
                    : "#00C2FF",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                flexShrink: 0,
                padding: 0,

                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span className="send-icon">
                <FaPaperPlane
                  color="#081420"
                  size={17}
                />
              </span>
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default ChatInput;