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
    // Jangan kirim kalau sedang loading
    if (loading) return;

    // Jangan kirim kalau tidak ada teks dan tidak ada gambar
    if (!message.trim() && !imagePreview) return;

    /*
     * Penting:
     * Jangan hapus imagePreview di sini.
     *
     * Home.jsx yang akan:
     * 1. mengambil gambar yang dipilih
     * 2. langsung memasukkan pesan user ke messages
     * 3. membuat bubble gambar di chat
     * 4. otomatis scroll ke pesan terbaru
     * 5. mengirim request ke backend
     * 6. membersihkan preview setelah pesan berhasil
     */
    kirimPesan();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/*
        Animasi tombol + dan tombol kirim.
        Ditaruh sebagai <style> lokal biar tidak perlu ubah file CSS terpisah.
      */}
      <style>{`
        .home-plus-button {
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .home-plus-button:active {
          transform: scale(0.88);
          background-color: #1c3550;
          box-shadow: 0 4px 12px rgba(0,0,0,.3);
        }
        .home-plus-button svg {
          transition: transform 0.2s ease;
        }
        .home-plus-button:active svg {
          transform: rotate(90deg);
        }
        .home-plus-button.disabled {
          pointer-events: none;
        }

        .send-btn {
          transition: transform 0.12s ease, background-color 0.15s ease;
        }
        .send-btn:active:not(:disabled) {
          transform: scale(0.88);
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
          {/* PLUS BUTTON */}
          <label
            htmlFor="chat-image-input"
            className={`home-plus-button${loading ? " disabled" : ""}`}
            style={{
              position: "relative",
              width: 46,
              height: 46,
              minWidth: 46,
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
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              userSelect: "none",
              margin: 0,
            }}
          >
            {/* ICON */}
            <FiPlus
              size={23}
              strokeWidth={2.5}
              style={{
                pointerEvents: "none",
              }}
            />

            {/*
              Input file disembunyikan total (display: none).
              Klik pada <label> di atas otomatis akan memicu
              file picker native, tanpa perlu trik overlay
              transparan yang rawan gagal di beberapa browser/Android.
            */}
            <input
              id="chat-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              disabled={loading}
              aria-label="Tambah gambar"
              title="Tambah gambar"
              style={{ display: "none" }}
            />
          </label>

          {/* INPUT CHAT */}
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

            {/* KIRIM */}
            <Button
              type="submit"
              className="send-btn"
              disabled={loading || (!message.trim() && !imagePreview)}
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
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
              <FaPaperPlane color="#081420" size={17} />
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default ChatInput;
