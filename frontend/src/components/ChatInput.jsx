import { useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { FaArrowUp } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

// Tinggi maksimal textarea sebelum mulai scroll di dalamnya
const MAX_TEXTAREA_HEIGHT = 200;

const TIPE_GAMBAR_DIIZINKAN = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function ChatInput({
  message,
  setMessage,
  kirimPesan,
  loading,
  fileInputRef,
  pilihGambar,
  imagePreview,
}) {
  const textareaRef = useRef(null);

  // =========================================================
  // AUTO-GROW TEXTAREA
  // Tinggi menyesuaikan isi (ngetik / paste teks panjang),
  // dibatasi MAX_TEXTAREA_HEIGHT lalu scroll di dalam.
  // Saat message dikosongkan (setelah kirim), tinggi balik normal.
  // =========================================================
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const tinggiBaru = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${tinggiBaru}px`;
    el.style.overflowY =
      el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [message]);

  const handleKirim = () => {
    if (loading) return;

    if (!message.trim() && !imagePreview) {
      return;
    }

    kirimPesan();
  };

  // =========================================================
  // PASTE GAMBAR (Ctrl+V)
  // Kalau clipboard berisi gambar, langsung diproses lewat
  // pilihGambar yang sama dengan tombol +, jadi preview muncul
  // tanpa klik +. Kalau yang dipaste teks, perilaku normal.
  // =========================================================
  const handlePaste = (e) => {
    if (loading) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (
        item.kind === "file" &&
        TIPE_GAMBAR_DIIZINKAN.includes(item.type)
      ) {
        const file = item.getAsFile();
        if (!file) continue;

        e.preventDefault();

        // Meniru event dari <input type="file">
        pilihGambar({
          target: { files: [file], value: "" },
          currentTarget: { files: [file], value: "" },
        });

        break;
      }
    }
  };

  return (
    <div className="chat-input-root">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleKirim();
        }}
      >
        <div className="chat-input-row">
          {/* ==================================================
              TOMBOL PLUS / UPLOAD
              Seluruh lingkaran adalah <label>, jadi semua area
              bisa diklik/disentuh tanpa perlu onClick manual.
          ================================================== */}
          <div className="home-plus-wrapper">
            <input
              ref={fileInputRef}
              id="home-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              onClick={(e) => {
                // supaya memilih gambar yang sama 2x tetap terdeteksi
                e.target.value = "";
              }}
              disabled={loading}
              className="home-plus-file"
            />

            <label
              htmlFor="home-image-input"
              className={`home-plus-button ${loading ? "is-disabled" : ""}`}
              aria-label="Tambah gambar"
              aria-disabled={loading}
              title="Tambah gambar"
            >
              <FiPlus
                className="home-plus-icon"
                size={22}
                strokeWidth={2.5}
              />
            </label>
          </div>

          {/* ==================================================
              CHAT INPUT
          ================================================== */}
          <div className="chat-input-box">
            <Form.Control
              as="textarea"
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onPaste={handlePaste}
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
                resize: "none",
                maxHeight: MAX_TEXTAREA_HEIGHT,
              }}
            />

            {/* ==================================================
                SEND
            ================================================== */}
            <Button
              type="submit"
              className="send-btn"
              disabled={loading || (!message.trim() && !imagePreview)}
              aria-label="Kirim"
            >
              <span className="send-icon">
                <FaArrowUp size={16} />
              </span>
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default ChatInput;