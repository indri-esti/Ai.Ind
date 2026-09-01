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

  const handlePlusClick = () => {
    if (loading) return;

    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
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
          position: relative;

          width: 52px;
          height: 46px;

          min-width: 52px;
          min-height: 46px;

          max-width: 52px;
          max-height: 46px;

          flex: 0 0 52px;

          margin: 0;
          padding: 0;

          display: block;

          z-index: 1000000;

          overflow: visible;

          pointer-events: auto;

          box-sizing: border-box;

          touch-action: manipulation;
        }

        /* ==========================================
           TOMBOL PLUS
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

          z-index: 1000001;

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

          pointer-events: none !important;

          user-select: none;
          -webkit-user-select: none;

          position: relative;
          z-index: 1;
        }

        /* ==========================================
           FILE INPUT
           
           BUKAN HITBOX LAGI.
           Tombol + yang membuka file picker.
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
           EFEK VISUAL PLUS
        ========================================== */

        .home-plus-wrapper:hover .home-plus-button:not(:disabled) {
          background: #193652 !important;
        }

        .home-plus-wrapper:active .home-plus-button:not(:disabled) {
          background: #00C2FF !important;

          color: #081420 !important;

          box-shadow:
            0 0 0 5px rgba(0, 194, 255, 0.15),
            0 5px 16px rgba(0, 194, 255, 0.35);
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
            width: 52px;
            height: 46px;

            min-width: 52px;
            min-height: 46px;

            max-width: 52px;
            max-height: 46px;

            flex: 0 0 52px;
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
            width: 50px;
            height: 46px;

            min-width: 50px;
            min-height: 46px;

            max-width: 50px;
            max-height: 46px;

            flex: 0 0 50px;
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
            width: 52px;
            height: 46px;

            min-width: 52px;
            min-height: 46px;

            max-width: 52px;
            max-height: 46px;

            flex: 0 0 52px;
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

            {/* FILE INPUT ASLI */}
            <input
              id="chat-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              disabled={loading}
              aria-label="Tambah gambar"
              className="home-plus-file"
            />

            {/* TOMBOL PLUS ASLI */}
            <button
              type="button"
              className="home-plus-button"
              disabled={loading}
              aria-label="Tambah gambar"
              onClick={handlePlusClick}
            >
              <span className="home-plus-icon">
                <FiPlus
                  size={23}
                  strokeWidth={2.5}
                />
              </span>
            </button>

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