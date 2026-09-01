import { useRef } from "react";
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
  // Mencegah event touch + click membuka file picker 2x
  const touchHandledRef = useRef(false);

  const handleKirim = () => {
    if (loading) return;

    if (!message.trim() && !imagePreview) return;

    kirimPesan();
  };

  /* ==========================================
     BUKA FILE INPUT
     ========================================== */

  const bukaFilePicker = () => {
    if (loading) return;

    if (!fileInputRef?.current) return;

    fileInputRef.current.click();
  };

  /* ==========================================
     TOUCH HP
     ========================================== */

  const handlePlusTouchStart = (e) => {
    if (loading) return;

    // Pastikan browser tidak melakukan gesture
    e.stopPropagation();

    touchHandledRef.current = true;
  };

  const handlePlusTouchEnd = (e) => {
    if (loading) return;

    e.preventDefault();
    e.stopPropagation();

    bukaFilePicker();

    // Beri waktu supaya event click bawaan
    // tidak menjalankan file picker kedua kali
    setTimeout(() => {
      touchHandledRef.current = false;
    }, 500);
  };

  /* ==========================================
     CLICK DESKTOP
     ========================================== */

  const handlePlusClick = (e) => {
    if (loading) return;

    e.preventDefault();
    e.stopPropagation();

    // Kalau sebelumnya sudah diproses oleh touch,
    // jangan buka file picker lagi.
    if (touchHandledRef.current) {
      return;
    }

    bukaFilePicker();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 99999,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        /* ==========================================
           BARIS UTAMA
           ========================================== */

        .chat-input-row {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 8px;

          min-width: 0;

          position: relative;

          box-sizing: border-box;

          z-index: 100000;
        }

        /* ==========================================
           PLUS WRAPPER

           Area wrapper dibuat PERSIS sama dengan
           area tombol supaya koordinat touch HP
           tidak bergeser.
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

          display: block;

          margin: 0;
          padding: 0;

          box-sizing: border-box;

          z-index: 100001;

          overflow: visible;

          pointer-events: auto;

          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }

        /* ==========================================
           FILE INPUT

           Tetap berada di DOM untuk ref,
           tetapi tidak ikut menjadi area touch.
           ========================================== */

        .home-plus-file {
          position: fixed !important;

          width: 1px !important;
          height: 1px !important;

          opacity: 0 !important;

          left: -9999px !important;
          top: -9999px !important;

          pointer-events: none !important;

          border: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* ==========================================
           PLUS BUTTON

           TOMBOL FISIK = AREA TOUCH.

           Tidak absolute.
           Tidak label.
           Tidak ada transform permanen.
           ========================================== */

        .home-plus-button {
          position: relative;

          display: flex !important;

          align-items: center !important;
          justify-content: center !important;

          width: 52px !important;
          height: 46px !important;

          min-width: 52px !important;
          min-height: 46px !important;

          max-width: 52px !important;
          max-height: 46px !important;

          flex: 0 0 52px !important;

          padding: 0 !important;
          margin: 0 !important;

          border-radius: 23px !important;

          background: #13283F !important;

          border: 1px solid rgba(255, 255, 255, 0.09) !important;

          color: #D7F6FF !important;

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.24);

          cursor: pointer;

          user-select: none;
          -webkit-user-select: none;

          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;

          outline: none !important;

          position: relative;

          z-index: 100002;

          overflow: hidden;

          pointer-events: auto !important;

          /* Membantu Android WebView menentukan
             hitbox berdasarkan posisi elemen aktual */
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);

          transition:
            background-color 0.12s ease,
            box-shadow 0.12s ease;
        }

        .home-plus-button:hover:not(:disabled) {
          background: #193652 !important;
        }

        .home-plus-button:active:not(:disabled) {
          background: #00C2FF !important;

          color: #081420 !important;

          box-shadow:
            0 0 0 5px rgba(0, 194, 255, 0.15),
            0 5px 16px rgba(0, 194, 255, 0.35);

          transform: scale(0.92);
          -webkit-transform: scale(0.92);
        }

        .home-plus-button:focus,
        .home-plus-button:focus-visible {
          outline: none !important;

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.24) !important;
        }

        .home-plus-button:disabled {
          opacity: 0.55;

          cursor: not-allowed;

          pointer-events: none !important;
        }

        /* ==========================================
           ICON

           Icon sama sekali tidak menerima touch.
           Semua touch masuk ke BUTTON.
           ========================================== */

        .home-plus-icon {
          position: relative;

          width: 100%;
          height: 100%;

          display: flex;

          align-items: center;
          justify-content: center;

          pointer-events: none !important;

          user-select: none;
          -webkit-user-select: none;

          z-index: 1;
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

        .send-btn:active:not(:disabled)
        .send-icon {
          transform: scale(0.82);
        }

        /* ==========================================
           MOBILE
           ========================================== */

        @media (max-width: 767px) {

          .chat-input-row {
            width: 100%;

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

            flex: 0 0 52px !important;
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

            max-width: 46px !important;
            max-height: 46px !important;
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

            flex: 0 0 50px !important;
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

            flex: 0 0 52px !important;
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
              PLUS
              ========================================== */}

          <div className="home-plus-wrapper">

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

            <button
              type="button"
              className="home-plus-button"
              disabled={loading}
              aria-label="Tambah gambar"

              /*
               * EVENT TOUCH ANDROID
               */

              onTouchStart={handlePlusTouchStart}

              onTouchEnd={handlePlusTouchEnd}

              /*
               * EVENT DESKTOP
               */

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