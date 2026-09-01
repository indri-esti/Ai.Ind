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
        zIndex: 999999,
        boxSizing: "border-box",
        isolation: "isolate",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        /* ==========================================
           BARIS CHAT
        ========================================== */

        .chat-input-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          position: relative;
          z-index: 999999;
          box-sizing: border-box;
        }

        /* ==========================================
           PLUS WRAPPER
        ========================================== */

        .home-plus-wrapper {
          position: relative !important;
          width: 52px !important;
          height: 46px !important;
          min-width: 52px !important;
          min-height: 46px !important;
          max-width: 52px !important;
          max-height: 46px !important;
          flex: 0 0 52px !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
          z-index: 1000000 !important;
          overflow: visible !important;
          pointer-events: auto !important;
          box-sizing: border-box;
          isolation: isolate;
          touch-action: manipulation !important;
        }

        /* ==========================================
           FILE INPUT
           Input tetap terhubung ke LABEL.
           Tidak menjadi hitbox di atas tombol.
        ========================================== */

        .home-plus-file {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          clip-path: inset(50%) !important;
          white-space: nowrap !important;
          border: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* ==========================================
           PLUS BUTTON
           LABEL = SELURUH HITBOX
        ========================================== */

        .home-plus-button {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;

          width: 52px !important;
          height: 46px !important;

          min-width: 52px !important;
          min-height: 46px !important;

          max-width: 52px !important;
          max-height: 46px !important;

          padding: 0 !important;
          margin: 0 !important;

          border-radius: 23px !important;

          display: flex !important;
          align-items: center !important;
          justify-content: center !important;

          background: #13283F !important;
          border: 1px solid rgba(255, 255, 255, 0.09) !important;

          color: #D7F6FF !important;

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.24);

          cursor: pointer;

          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;

          outline: none !important;

          z-index: 1000001 !important;

          overflow: hidden;

          pointer-events: auto !important;

          box-sizing: border-box;

          transform: none !important;
          -webkit-transform: none !important;

          touch-action: manipulation !important;

          transition:
            background-color 0.12s ease,
            box-shadow 0.12s ease;
        }

        /* Jangan biarkan style Bootstrap/global
           mengubah label menjadi sesuatu yang lain */

        .home-plus-button:hover {
          background: #193652 !important;
          color: #D7F6FF !important;
        }

        .home-plus-button:active {
          background: #00C2FF !important;
          color: #081420 !important;

          box-shadow:
            0 0 0 5px rgba(0, 194, 255, 0.15),
            0 5px 16px rgba(0, 194, 255, 0.35);
        }

        .home-plus-button.is-disabled {
          opacity: 0.55;
          cursor: not-allowed;
          pointer-events: none !important;
        }

        /* ==========================================
           ICON PLUS
        ========================================== */

        .home-plus-icon {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none !important;

          user-select: none;
          -webkit-user-select: none;

          position: relative;
          z-index: 1;
        }

        .home-plus-icon svg {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        /* ==========================================
           INPUT CHAT
        ========================================== */

        .chat-input-box {
          flex: 1;
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 10px;

          background: #13283F;

          border-radius: 28px;

          padding: 7px 8px 7px 18px;

          border:
            1px solid rgba(255, 255, 255, 0.08);

          box-shadow:
            0 8px 25px rgba(0, 0, 0, 0.25);

          box-sizing: border-box;

          position: relative;
          z-index: 1;
        }

        .chat-input {
          flex: 1;
          min-width: 0;

          resize: none;
          overflow-y: auto;

          background: transparent !important;
          color: #fff !important;

          border: none !important;
          outline: none !important;
          box-shadow: none !important;

          font-size: 15px;
          line-height: 22px;

          min-height: 40px;
          max-height: 110px;

          padding: 8px 0;

          box-sizing: border-box;

          -webkit-tap-highlight-color: transparent;
        }

        .chat-input::placeholder {
          color: #78909F;
        }

        /* ==========================================
           SEND BUTTON
        ========================================== */

        .send-btn {
          width: 46px !important;
          height: 46px !important;

          min-width: 46px !important;
          min-height: 46px !important;

          max-width: 46px !important;
          max-height: 46px !important;

          flex: 0 0 46px !important;

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

          position: relative;
          z-index: 2;

          transition:
            background-color 0.15s ease,
            transform 0.12s ease;
        }

        .send-btn:focus,
        .send-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        .send-btn:active:not(:disabled) {
          transform: scale(0.90);
        }

        .send-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none;

          transition: transform 0.12s ease;
        }

        .send-btn:active:not(:disabled) .send-icon {
          transform: scale(0.82);
        }

        /* ==========================================
           MOBILE
        ========================================== */

        @media (max-width: 767px) {
          .chat-input-row {
            gap: 7px;
          }

          .home-plus-wrapper {
            width: 52px !important;
            height: 46px !important;

            min-width: 52px !important;
            min-height: 46px !important;

            max-width: 52px !important;
            max-height: 46px !important;

            flex: 0 0 52px !important;
          }

          .home-plus-button {
            width: 52px !important;
            height: 46px !important;

            min-width: 52px !important;
            min-height: 46px !important;

            max-width: 52px !important;
            max-height: 46px !important;
          }

          .chat-input-box {
            padding:
              7px
              7px
              7px
              15px;

            gap: 7px;
          }

          .send-btn {
            width: 46px !important;
            height: 46px !important;

            min-width: 46px !important;
            min-height: 46px !important;
          }
        }

        /* ==========================================
           HP KECIL
        ========================================== */

        @media (max-width: 380px) {
          .chat-input-row {
            gap: 6px;
          }

          .home-plus-wrapper {
            width: 50px !important;
            height: 46px !important;

            min-width: 50px !important;
            min-height: 46px !important;

            max-width: 50px !important;
            max-height: 46px !important;

            flex: 0 0 50px !important;
          }

          .home-plus-button {
            width: 50px !important;
            height: 46px !important;

            min-width: 50px !important;
            min-height: 46px !important;

            max-width: 50px !important;
            max-height: 46px !important;
          }

          .chat-input-box {
            padding-left: 13px;
            padding-right: 6px;
          }
        }

        /* ==========================================
           DESKTOP
        ========================================== */

        @media (min-width: 768px) {
          .home-plus-wrapper {
            width: 52px !important;
            height: 46px !important;

            min-width: 52px !important;
            min-height: 46px !important;

            max-width: 52px !important;
            max-height: 46px !important;

            flex: 0 0 52px !important;
          }

          .home-plus-button {
            width: 52px !important;
            height: 46px !important;

            min-width: 52px !important;
            min-height: 46px !important;

            max-width: 52px !important;
            max-height: 46px !important;
          }
        }
      `}</style>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleKirim();
        }}
      >
        <div className="chat-input-row">

          {/* ==========================================
              PLUS / UPLOAD
          ========================================== */}

          <div className="home-plus-wrapper">

            <input
              id="chat-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              disabled={loading}
              className="home-plus-file"
            />

            {/*
              PENTING:
              Tidak memakai button + .click() lagi.

              Label langsung terhubung ke input file.
              Jadi SELURUH area 52x46 adalah hitbox.
            */}

            <label
              htmlFor="chat-image-input"
              className={`home-plus-button ${
                loading ? "is-disabled" : ""
              }`}
              aria-label="Tambah gambar"
              title="Tambah gambar"
              aria-disabled={loading}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                }
              }}
            >
              <span className="home-plus-icon">
                <FiPlus
                  size={23}
                  strokeWidth={2.5}
                />
              </span>
            </label>

          </div>

          {/* ==========================================
              INPUT CHAT
          ========================================== */}

          <div className="chat-input-box">

            <Form.Control
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();

                  if (
                    !loading &&
                    (
                      message.trim() ||
                      imagePreview
                    )
                  ) {
                    handleKirim();
                  }
                }
              }}
              placeholder="Ketik pertanyaan untuk AI.Ind..."
              className="chat-input"
            />

            {/* ==========================================
                KIRIM
            ========================================== */}

            <Button
              type="submit"
              className="send-btn"
              disabled={
                loading ||
                (
                  !message.trim() &&
                  !imagePreview
                )
              }
              style={{
                background:
                  loading ||
                  (
                    !message.trim() &&
                    !imagePreview
                  )
                    ? "#4B647A"
                    : "#00C2FF",
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
