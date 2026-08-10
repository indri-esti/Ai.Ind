import { Form, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import { FiPlus, FiX, FiImage } from "react-icons/fi";

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
  // ==================================================
  // KIRIM PESAN
  // ==================================================
  const handleKirim = () => {
    if (
      loading ||
      (!message.trim() && !imagePreview)
    ) {
      return;
    }

    /*
     * Jangan hapus gambar di sini.
     *
     * Home.jsx yang bertanggung jawab untuk:
     * 1. Mengambil selectedImage
     * 2. Memasukkan gambar + teks ke messages
     * 3. Mengirim gambar ke backend
     * 4. Menghapus preview setelah berhasil diproses
     *
     * Dengan begitu gambar tidak muncul double
     * dan tidak pecah antara preview dan bubble chat.
     */
    kirimPesan();
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#081420",
        padding: "10px 16px 14px",
        zIndex: 999,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* =========================
            PREVIEW GAMBAR
        ========================== */}
        {imagePreview && (
          <div
            style={{
              marginBottom: 8,
              padding: "8px",
              background: "#102333",
              border: "1px solid rgba(24,216,255,.2)",
              borderRadius: 16,
              width: "fit-content",
              maxWidth: "220px",
              position: "relative",
              boxShadow: "0 8px 25px rgba(0,0,0,.25)",
            }}
          >
            <img
              src={imagePreview}
              alt="Preview gambar"
              style={{
                display: "block",
                width: "180px",
                maxWidth: "100%",
                maxHeight: "130px",
                objectFit: "cover",
                borderRadius: 11,
              }}
            />

            {/* HAPUS GAMBAR */}
            <button
              type="button"
              onClick={hapusGambar}
              disabled={loading}
              aria-label="Hapus gambar"
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border:
                  "1px solid rgba(255,255,255,.15)",
                background: "#102333",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                padding: 0,
              }}
            >
              <FiX size={16} />
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 5,
                color: "#8A9BB5",
                fontSize: 10,
              }}
            >
              <FiImage size={13} />
              Gambar siap dikirim
            </div>
          </div>
        )}

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
            {/* INPUT FILE */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              style={{ display: "none" }}
            />

            {/* PLUS */}
            <button
              type="button"
              className="home-plus-button"
              onClick={() => {
                if (!loading) {
                  fileInputRef.current?.click();
                }
              }}
              disabled={loading}
              aria-label="Tambah gambar"
              title="Tambah gambar"
            >
              <FiPlus
                size={23}
                strokeWidth={2.5}
              />
            </button>

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
                border:
                  "1px solid rgba(255,255,255,.08)",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,.25)",
                boxSizing: "border-box",
              }}
            >
              <Form.Control
                as="textarea"
                rows={1}
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();

                    if (
                      !loading &&
                      (message.trim() ||
                        imagePreview)
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

              {/* KIRIM */}
              <Button
                type="submit"
                disabled={
                  loading ||
                  (!message.trim() &&
                    !imagePreview)
                }
                style={{
                  width: 46,
                  height: 46,
                  minWidth: 46,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    loading ||
                    (!message.trim() &&
                      !imagePreview)
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
          </div>
        </Form>

        {/* DISCLAIMER */}
        <div
          style={{
            marginTop: 7,
            textAlign: "center",
            color: "#6F849A",
            fontSize: 11,
            lineHeight: "16px",
            paddingBottom: 2,
          }}
        >
          AI.Ind dapat membuat kesalahan. Selalu periksa
          kembali jawaban penting.
        </div>
      </div>
    </div>
  );
}

export default ChatInput;