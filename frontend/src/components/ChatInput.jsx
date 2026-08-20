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
     * Gambar TIDAK dihapus di sini.
     *
     * Home.jsx yang menangani:
     * 1. Mengambil selectedImage
     * 2. Mengubah gambar ke Base64
     * 3. Memasukkan gambar + teks ke messages
     * 4. Mengirim gambar ke backend
     * 5. Menghapus preview setelah gambar masuk ke pesan
     *
     * Dengan begitu gambar hanya muncul satu kali
     * di bubble pesan user dan tidak double.
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
    </div>
  );
}

export default ChatInput;