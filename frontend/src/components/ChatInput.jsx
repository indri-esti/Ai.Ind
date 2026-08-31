import { useState } from "react";
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
  const [plusPressed, setPlusPressed] = useState(false);

  const handleKirim = () => {
    if (loading) return;

    if (!message.trim() && !imagePreview) return;

    kirimPesan();
  };

  const tekanPlus = () => {
    if (loading) return;

    setPlusPressed(true);

    setTimeout(() => {
      setPlusPressed(false);
    }, 220);
  };

  const selesaiPilihGambar = (e) => {
    setPlusPressed(false);
    pilihGambar(e);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 99999,
        isolation: "isolate",
      }}
    >
      <style>{`
        .home-plus-wrapper {
          position: relative;
          width: 46px;
          height: 46px;
          min-width: 46px;
          min-height: 46px;
          flex-shrink: 0;
          z-index: 99999;
          isolation: isolate;
        }

        .home-plus-button {
          position: absolute;
          inset: 0;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;

          background: #13283F;
          border: 1px solid rgba(255,255,255,.09);
          color: #D7F6FF;

          box-shadow: 0 8px 24px rgba(0,0,0,.24);

          padding: 0;
          margin: 0;

          pointer-events: none;

          transition:
            transform 0.16s ease,
            background-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .home-plus-button.pressed {
          transform: scale(0.78) rotate(90deg);
          background: #00C2FF !important;
          color: #081420 !important;
          box-shadow:
            0 0 0 5px rgba(0,194,255,.15),
            0 5px 16px rgba(0,194,255,.35);
        }

        .home-plus-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .home-plus-file {
          position: absolute !important;
          inset: 0 !important;
          width: 46px !important;
          height: 46px !important;
          min-width: 46px !important;
          min-height: 46px !important;

          opacity: 0 !important;

          cursor: pointer !important;

          z-index: 100000 !important;

          pointer-events: auto !important;

          margin: 0 !important;
          padding: 0 !important;

          touch-action: manipulation !important;

          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
        }

        .home-plus-file:disabled {
          pointer-events: none !important;
          cursor: not-allowed !important;
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
              PLUS BUTTON
              ===================================================== */}
          <div className="home-plus-wrapper">
            <button
              type="button"
              tabIndex="-1"
              aria-hidden="true"
              className={`home-plus-button${
                plusPressed ? " pressed" : ""
              }`}
            >
              <span className="home-plus-icon">
                <FiPlus
                  size={23}
                  strokeWidth={2.5}
                />
              </span>
            </button>

            {/* INPUT FILE LANGSUNG DI ATAS TOMBOL */}
            <input
              id="chat-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={selesaiPilihGambar}
              onPointerDown={tekanPlus}
              onTouchStart={tekanPlus}
              disabled={loading}
              aria-label="Tambah gambar"
              className="home-plus-file"
            />
          </div>

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

                  if (
                    !loading &&
                    (message.trim() || imagePreview)
                  ) {
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
                loading ||
                (!message.trim() && !imagePreview)
              }
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                minHeight: 46,
                borderRadius: "50%",
                border: "none",

                background:
                  loading ||
                  (!message.trim() && !imagePreview)
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