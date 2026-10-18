import { useEffect, useRef, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { FaArrowUp } from "react-icons/fa";
import { FiPlus, FiMic } from "react-icons/fi";

// Tinggi maksimal textarea sebelum mulai scroll di dalamnya
const MAX_TEXTAREA_HEIGHT = 200;

const TIPE_GAMBAR_DIIZINKAN = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Web Speech API (Chrome Android mendukung lewat webkitSpeechRecognition)
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

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
  // VOICE NOTE (SUARA -> TEKS)
  // =========================================================
  const recognitionRef = useRef(null);
  const teksAwalRef = useRef("");
  const [listening, setListening] = useState(false);

  const stopMic = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      // abaikan
    }
  };

  const toggleMic = () => {
    if (loading) return;

    // Kalau sedang merekam, tekan lagi untuk berhenti
    if (listening) {
      stopMic();
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = true;

    // Simpan teks yang sudah diketik, hasil suara ditambahkan setelahnya
    teksAwalRef.current = message ? message.trimEnd() + " " : "";

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let teks = "";
      for (let i = 0; i < e.results.length; i++) {
        teks += e.results[i][0].transcript;
      }
      setMessage(teksAwalRef.current + teks);
    };

    rec.onerror = (e) => {
      setListening(false);

      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        alert(
          "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk situs ini di pengaturan Chrome."
        );
      } else if (e.error === "no-speech") {
        // tidak ada suara terdeteksi, diam saja
      } else if (e.error === "network") {
        alert("Pengenalan suara butuh koneksi internet.");
      }
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err) {
      setListening(false);
    }
  };

  // Matikan mic kalau komponen ditutup
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (err) {
        // abaikan
      }
    };
  }, []);

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

    // Hentikan rekaman kalau pesan dikirim saat mic masih aktif
    if (listening) {
      try {
        recognitionRef.current?.abort();
      } catch (err) {
        // abaikan
      }
      setListening(false);
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
      <style>
        {`
          @keyframes ciMicPulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0.55); }
            70% { box-shadow: 0 0 0 10px rgba(0, 194, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0); }
          }

          .ci-mic-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            margin-right: 6px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: transparent;
            color: #9fb4c4;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition: background 0.2s ease, color 0.2s ease;
          }

          .ci-mic-btn:hover {
            background: rgba(0, 194, 255, 0.1);
            color: #7fdcff;
          }

          .ci-mic-btn.listening {
            background: rgba(0, 194, 255, 0.18);
            color: #00c2ff;
            animation: ciMicPulse 1.3s ease-out infinite;
          }

          .ci-mic-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          @media (prefers-reduced-motion: reduce) {
            .ci-mic-btn.listening { animation: none; }
          }
        `}
      </style>

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
              placeholder={
                listening
                  ? "Mendengarkan..."
                  : "Ketik pertanyaan untuk AI.Ind..."
              }
              className="chat-input"
              style={{
                resize: "none",
                maxHeight: MAX_TEXTAREA_HEIGHT,
              }}
            />

            {/* ==================================================
                MIC (VOICE NOTE)
                Hanya tampil kalau browser mendukung.
            ================================================== */}
            {SpeechRecognitionAPI && (
              <button
                type="button"
                className={`ci-mic-btn ${listening ? "listening" : ""}`}
                onClick={toggleMic}
                disabled={loading}
                aria-label={listening ? "Berhenti merekam" : "Bicara"}
                title={listening ? "Berhenti merekam" : "Bicara"}
              >
                <FiMic size={20} />
              </button>
            )}

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
