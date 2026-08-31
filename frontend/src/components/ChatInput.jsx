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

    // Efek tekan tombol
    setPlusPressed(true);

    setTimeout(() => {
      setPlusPressed(false);
    }, 180);

    // Buka file picker secara langsung
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
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
        boxSizing: "border-box",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .home-plus-wrapper {
          position: relative;
          width: 46px;
          height: 46px;
          min-width: 46px;
          min-height: 46px;
          flex: 0 0 46px;
          z-index: 100000;
        }

        .home-plus-button {
          position: relative;

          width: 46px !important;
          height: 46px !important;
          min-width: 46px !important;
          min-height: 46px !important;

          display: flex !important;
          align-items: center !important;
          justify-content: center !important;

          padding: 0 !important;
          margin: 0 !important;

          border-radius: 50% !important;

          background: #13283F !important;
          border: 1px solid rgba(255,255,255,.09) !important;

          color: #D7F6FF !important;

          box-shadow: 0 8px 24px rgba(0,0,0,.24);

          cursor: pointer;

          user-select: none;
          -webkit-user-select: none;

          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;

          outline: none !important;

          transition:
            transform 0.16s ease,
            background-color 0.16s ease,
            box-shadow 0.16s ease;

          z-index: 100001;
        }

        .home-plus-button:hover:not(:disabled) {
          background: #193652 !important;
        }

        .home-plus-button:focus,
        .home-plus-button:focus-visible {
          outline: none !important;
          box-shadow: 0 8px 24px rgba(0,0,0,.24) !important;
        }

        .home-plus-button.pressed {
          transform: scale(0.82) rotate(90deg);
          background: #00C2FF !important;
          color: #081420 !important;

          box-shadow:
            0 0 0 5px rgba(0,194,255,.15),
            0 5px 16px rgba(0,194,255,.35);
        }

        .home-plus-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .home-plus-icon {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none;
        }

        /*
          Input file benar-benar disembunyikan.
          Tombol Plus sekarang TIDAK bergantung pada label/htmlFor.
        */
        .home-plus-file {
          position: absolute !important;

          width: 1px !important;
          height: 1px !important;

          opacity: 0 !important;

          pointer-events: none !important;

          overflow: hidden !important;

          border: 0 !important;
          padding: 0 !important;
          margin: -1px !important;
        }

        .send-btn {
          width: 46px !important;
          height: 46px !important;
          min-width: 46px !important;
          min-height: 46px !important;

          flex: 0 0 46px;

          border-radius: 50% !important;
          border: none !important;

          display: flex !important;
          align-items: center !important;
          justify-content: center !important;

          padding: 0 !important;
          margin: 0 !important;

          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;

          outline: none !important;

          transition:
            background-color 0.15s ease,
            transform 0.12s ease;
        }

        .send-btn:focus,
        .send-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        .send-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none;

          transition: transform 0.12s ease;
        }

        .send-btn:active:not(:disabled) {
          transform: scale(0.90);
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

        @media (max-width: 576px) {
          .home-plus-wrapper {
            width: 46px;
            height: 46px;
            min-width: 46px;
            flex-basis: 46px;
          }

          .home-plus-button {
            width: 46px !important;
            height: 46px !important;
            min-width: 46px !important;
            min-height: 46px !important;
          }

          .send-btn {
            width: 46px !important;
            height: 46px !important;
            min-width: 46px !important;
            min-height: 46px !important;
          }
        }

        @media (min-width: 577px) {
          .home-plus-wrapper {
            width: 46px;
            height: 46px;
            min-width: 46px;
          }
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
            boxSizing: "border-box",
          }}
        >
          {/* =====================================================
              PLUS BUTTON
              ===================================================== */}
          <div className="home-plus-wrapper">

            {/* INPUT FILE */}
            <input
              id="chat-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={selesaiPilihGambar}
              disabled={loading}
              aria-label="Tambah gambar"
              className="home-plus-file"
            />

            {/* TOMBOL PLUS */}
            <button
              type="button"
              className={`home-plus-button${
                plusPressed ? " pressed" : ""
              }`}
              onClick={tekanPlus}
              disabled={loading}
              aria-label="Tambah gambar"
            >
              <span className="home-plus-icon">
                <FiPlus
                  size={23}
                  strokeWidth={2.5}
                />
              </span>
            </button>
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
                background:
                  loading ||
                  (!message.trim() && !imagePreview)
                    ? "#4B647A"
                    : "#00C2FF",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                flexShrink: 0,
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