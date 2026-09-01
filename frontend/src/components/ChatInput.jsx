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
      className="chat-input-root"
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        /* =====================================================
           CHAT INPUT ROOT
        ===================================================== */

        .chat-input-root,
        .chat-input-root * {
          box-sizing: border-box;
        }

        /* =====================================================
           BARIS CHAT
        ===================================================== */

        .chat-input-row {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          min-width: 0;
          margin: 0;
          padding: 0;
          position: relative;
        }

        /* =====================================================
           PLUS WRAPPER
           
           PENTING:
           Tidak absolute.
           Tidak ada transform.
           Ukuran wrapper = ukuran tombol.
        ===================================================== */

        .home-plus-wrapper {
          position: relative;
          flex: 0 0 52px;
          width: 52px;
          height: 46px;
          min-width: 52px;
          max-width: 52px;
          min-height: 46px;
          max-height: 46px;
          margin: 0;
          padding: 0;
          display: block;
          overflow: visible;
          isolation: isolate;
        }

        /* =====================================================
           FILE INPUT
           
           Benar-benar disembunyikan.
           Tidak ikut menjadi hitbox.
        ===================================================== */

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

        /* =====================================================
           PLUS LABEL

           LABEL INI ADALAH HITBOX SEBENARNYA.

           Tidak absolute.
           Tidak width 100%.
           Tidak transform.

           Jadi posisi visual = posisi touch.
        ===================================================== */

        .home-plus-button {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          flex: 0 0 52px;

          width: 52px;
          height: 46px;

          min-width: 52px;
          max-width: 52px;

          min-height: 46px;
          max-height: 46px;

          margin: 0;
          padding: 0;

          border-radius: 23px;

          background: #13283F;

          border: 1px solid rgba(255, 255, 255, 0.09);

          color: #D7F6FF;

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.24);

          cursor: pointer;

          user-select: none;
          -webkit-user-select: none;

          -webkit-touch-callout: none;

          -webkit-tap-highlight-color: transparent;

          touch-action: manipulation;

          outline: none;

          overflow: hidden;

          isolation: isolate;

          z-index: 10;

          transition:
            background-color 0.12s ease,
            box-shadow 0.12s ease;
        }

        /* =====================================================
           PLUS HOVER
        ===================================================== */

        .home-plus-button:hover {
          background: #193652;
          color: #D7F6FF;
        }

        /* =====================================================
           PLUS ACTIVE
        ===================================================== */

        .home-plus-button:active {
          background: #00C2FF;
          color: #081420;

          box-shadow:
            0 0 0 5px rgba(0, 194, 255, 0.15),
            0 5px 16px rgba(0, 194, 255, 0.35);
        }

        /* =====================================================
           DISABLED
        ===================================================== */

        .home-plus-button.is-disabled {
          opacity: 0.55;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* =====================================================
           ICON PLUS

           Icon TIDAK menerima touch.
           Touch diteruskan ke LABEL.
        ===================================================== */

        .home-plus-icon {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none;

          user-select: none;
          -webkit-user-select: none;
        }

        .home-plus-icon svg {
          display: block;

          width: 23px;
          height: 23px;

          pointer-events: none;

          user-select: none;
          -webkit-user-select: none;
        }

        /* =====================================================
           CHAT INPUT BOX
        ===================================================== */

        .chat-input-box {
          flex: 1 1 auto;

          width: auto;

          min-width: 0;

          display: flex;
          flex-direction: row;
          align-items: center;

          gap: 10px;

          background: #13283F;

          border-radius: 28px;

          padding: 7px 8px 7px 18px;

          border:
            1px solid rgba(255, 255, 255, 0.08);

          box-shadow:
            0 8px 25px rgba(0, 0, 0, 0.25);

          position: relative;
        }

        /* =====================================================
           TEXTAREA
        ===================================================== */

        .chat-input {
          flex: 1 1 auto;

          width: auto;

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

          margin: 0;

          box-sizing: border-box;

          -webkit-tap-highlight-color: transparent;

          touch-action: manipulation;
        }

        .chat-input::placeholder {
          color: #78909F;
        }

        /* =====================================================
           SEND BUTTON
        ===================================================== */

        .send-btn {
          width: 46px !important;
          height: 46px !important;

          min-width: 46px !important;
          min-height: 46px !important;

          max-width: 46px !important;
          max-height: 46px !important;

          flex: 0 0 46px !important;

          margin: 0 !important;
          padding: 0 !important;

          border-radius: 50% !important;

          border: none !important;

          display: flex !important;

          align-items: center !important;
          justify-content: center !important;

          position: relative;

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

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 767px) {

          .chat-input-row {
            width: 100%;
            gap: 7px;
          }

          .home-plus-wrapper {
            flex: 0 0 52px;

            width: 52px;
            height: 46px;

            min-width: 52px;
            max-width: 52px;

            min-height: 46px;
            max-height: 46px;
          }

          .home-plus-button {
            flex: 0 0 52px;

            width: 52px;
            height: 46px;

            min-width: 52px;
            max-width: 52px;

            min-height: 46px;
            max-height: 46px;
          }

          .chat-input-box {
            flex: 1 1 auto;

            min-width: 0;

            padding:
              7px
              7px
              7px
              15px;

            gap: 7px;
          }

          .chat-input {
            min-width: 0;
            font-size: 14px;
          }

          .send-btn {
            width: 46px !important;
            height: 46px !important;

            min-width: 46px !important;
            min-height: 46px !important;
          }
        }

        /* =====================================================
           HP KECIL
        ===================================================== */

        @media (max-width: 380px) {

          .chat-input-row {
            gap: 6px;
          }

          .home-plus-wrapper {
            flex: 0 0 50px;

            width: 50px;
            height: 46px;

            min-width: 50px;
            max-width: 50px;

            min-height: 46px;
            max-height: 46px;
          }

          .home-plus-button {
            flex: 0 0 50px;

            width: 50px;
            height: 46px;

            min-width: 50px;
            max-width: 50px;

            min-height: 46px;
            max-height: 46px;
          }

          .chat-input-box {
            padding-left: 13px;
            padding-right: 6px;
          }

          .chat-input {
            font-size: 13px;
          }
        }

        /* =====================================================
           DESKTOP
        ===================================================== */

        @media (min-width: 768px) {

          .home-plus-wrapper {
            flex: 0 0 52px;

            width: 52px;
            height: 46px;

            min-width: 52px;
            max-width: 52px;

            min-height: 46px;
            max-height: 46px;
          }

          .home-plus-button {
            flex: 0 0 52px;

            width: 52px;
            height: 46px;

            min-width: 52px;
            max-width: 52px;

            min-height: 46px;
            max-height: 46px;
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

          {/* ==================================================
              PLUS / UPLOAD
          ================================================== */}

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

          {/* ==================================================
              CHAT TEXT INPUT
          ================================================== */}

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

            {/* ==================================================
                SEND
            ================================================== */}

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
