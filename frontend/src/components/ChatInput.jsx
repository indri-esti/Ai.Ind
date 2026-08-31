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
            id="aiind-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={pilihGambar}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          {/* PLUS */}
          <label
            htmlFor="aiind-image-input"
            className="home-plus-button"
            aria-label="Tambah gambar"
            title="Tambah gambar"
            style={{
              width: 46,
              height: 46,
              minWidth: 46,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: loading ? "not-allowed" : "pointer",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              background:
                "rgba(19,40,63,.95)",
              border:
                "1px solid rgba(255,255,255,.09)",
              color: "#D7F6FF",
              boxShadow:
                "0 8px 24px rgba(0,0,0,.24)",
              transition:
                "transform .15s ease, background .15s ease, border-color .15s ease",
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading
                ? "none"
                : "auto",
            }}
            onTouchStart={(e) => {
              if (loading) {
                e.preventDefault();
                return;
              }

              e.currentTarget.style.transform =
                "scale(.92)";
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform =
                "scale(1)";
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform =
                  "scale(.92)";
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform =
                "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "scale(1)";
            }}
          >
            <FiPlus
              size={23}
              strokeWidth={2.5}
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
                touchAction: "manipulation",
                WebkitTapHighlightColor:
                  "transparent",
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