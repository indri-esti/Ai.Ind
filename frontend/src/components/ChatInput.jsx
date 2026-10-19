import { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { FaArrowUp } from "react-icons/fa";
import { FiPlus, FiMic, FiImage } from "react-icons/fi";

// Tinggi maksimal textarea sebelum mulai scroll di dalamnya
const MAX_TEXTAREA_HEIGHT = 200;

// Di HP tinggi maksimal dikecilkan supaya tidak menutupi layar saat keyboard terbuka
const MAX_TEXTAREA_HEIGHT_HP = 140;

const ambilTinggiMaks = () =>
  typeof window !== "undefined" && window.innerWidth < 768
    ? MAX_TEXTAREA_HEIGHT_HP
    : MAX_TEXTAREA_HEIGHT;

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

  // Input file disembunyikan; tombol + adalah <label htmlFor> yang
  // terhubung langsung ke input ini, jadi browser yang membukanya
  // (bukan JavaScript .click()).
  const inputGambarRef = useRef(null);

  const setInputGambarRef = useCallback(
    (el) => {
      inputGambarRef.current = el;

      // tetap teruskan ke fileInputRef milik parent
      if (typeof fileInputRef === "function") {
        fileInputRef(el);
      } else if (fileInputRef) {
        fileInputRef.current = el;
      }
    },
    [fileInputRef]
  );

  // Hanya dipakai untuk akses keyboard (Enter / Spasi) pada tombol +
  const bukaPilihGambarKeyboard = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      if (loading) return;

      inputGambarRef.current?.click();
    }
  };

  // Status tampilan: fokus (untuk petunjuk keyboard) & drag-drop gambar
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

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

    const tinggiMaks = ambilTinggiMaks();

    el.style.height = "auto";

    const tinggiBaru = Math.min(el.scrollHeight, tinggiMaks);
    el.style.height = `${tinggiBaru}px`;
    el.style.overflowY =
      el.scrollHeight > tinggiMaks ? "auto" : "hidden";
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

  // =========================================================
  // DRAG & DROP GAMBAR
  // Seret gambar dari komputer langsung ke kotak input.
  // Diproses lewat pilihGambar yang sama dengan tombol +.
  // =========================================================
  const adaFile = (e) =>
    Array.from(e.dataTransfer?.types || []).includes("Files");

  const handleDragOver = (e) => {
    if (loading || !adaFile(e)) return;

    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;

    setDragging(false);
  };

  const handleDrop = (e) => {
    if (!adaFile(e)) return;

    // Cegah browser membuka file yang dilepas
    e.preventDefault();
    setDragging(false);

    if (loading) return;

    const file = Array.from(e.dataTransfer.files || []).find((f) =>
      TIPE_GAMBAR_DIIZINKAN.includes(f.type)
    );

    if (!file) return;

    pilihGambar({
      target: { files: [file], value: "" },
      currentTarget: { files: [file], value: "" },
    });
  };

  const bisaKirim = !loading && (!!message.trim() || !!imagePreview);

  return (
    <div className="chat-input-root ci-root">
      <style>
        {`
          @keyframes ciMicPulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0.55); }
            70% { box-shadow: 0 0 0 10px rgba(0, 194, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0); }
          }

          @keyframes ciSpin {
            to { transform: rotate(360deg); }
          }

          @keyframes ciDropIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes ciDotPop {
            0% { transform: scale(0); }
            60% { transform: scale(1.35); }
            100% { transform: scale(1); }
          }

          .ci-root *,
          .ci-root *::before,
          .ci-root *::after {
            box-sizing: border-box;
          }

          .ci-root .ci-row {
            display: flex;
            align-items: flex-end;
            width: 100%;
          }

          /* ---------- Kotak input (tombol + ada di dalam) ---------- */
          .ci-box {
            position: relative;
            display: flex;
            align-items: flex-end;
            gap: 4px;
            width: 100%;
            padding: 6px;
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background: linear-gradient(
              180deg,
              rgba(19, 42, 58, 0.94) 0%,
              rgba(12, 30, 44, 0.94) 100%
            );
            -webkit-backdrop-filter: blur(14px);
            backdrop-filter: blur(14px);
            box-shadow:
              0 10px 30px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.04);
            transition:
              border-color 0.2s ease,
              box-shadow 0.25s ease,
              background 0.2s ease;
          }

          .ci-box:hover {
            border-color: rgba(255, 255, 255, 0.14);
          }

          .ci-box:focus-within {
            border-color: rgba(0, 194, 255, 0.5);
            box-shadow:
              0 0 0 4px rgba(0, 194, 255, 0.1),
              0 12px 36px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }

          .ci-box.is-listening {
            border-color: rgba(0, 194, 255, 0.6);
          }

          .ci-box.is-dragging {
            border-color: #00c2ff;
            border-style: dashed;
            box-shadow:
              0 0 0 4px rgba(0, 194, 255, 0.14),
              0 12px 36px rgba(0, 0, 0, 0.34);
          }

          /* ---------- Tombol + (upload gambar) ---------- */
          /* Input file disembunyikan secara visual (bukan display:none)
             supaya tetap bisa dibuka lewat <label htmlFor>. */
          .ci-file-input {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
            opacity: 0;
          }

          /* Tombol + adalah <label htmlFor="home-image-input">.
             Klik di mana pun pada label (termasuk tengah ikon) dibuka
             langsung oleh browser, tanpa JavaScript .click().
             Tombol itu sendiri TIDAK pernah di-scale / digeser; semua
             animasi ada di elemen DALAM (.ci-plus-bg dan .ci-plus-icon)
             yang pointer-events-nya dimatikan, jadi area klik tetap
             40x40 (+4px lewat ::before). */
          .ci-plus {
            position: relative;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin: 0;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: #b4c7d4;
            font: inherit;
            line-height: 1;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition: color 0.2s ease;
          }

          /* area sentuh diperluas 4px ke segala arah */
          .ci-plus::before {
            content: "";
            position: absolute;
            inset: -4px;
            border-radius: 50%;
          }

          /* lingkaran latar: membesar halus dari tengah saat disorot / ditekan */
          .ci-plus-bg {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            opacity: 0;
            transform: scale(0.55);
            pointer-events: none;
            transition:
              opacity 0.2s ease,
              transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease;
          }

          /* ikon: berputar 90 derajat dengan efek pegas */
          .ci-plus-icon {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .ci-plus-icon svg,
          .ci-plus-icon svg * {
            pointer-events: none;
          }

          /* hover hanya untuk mouse, supaya tidak "nyangkut" di HP */
          @media (hover: hover) {
            .ci-plus:not(.is-disabled):hover {
              color: #ffffff;
            }

            .ci-plus:not(.is-disabled):hover .ci-plus-bg {
              opacity: 1;
              transform: scale(1);
            }

            .ci-plus:not(.is-disabled):hover .ci-plus-icon {
              transform: rotate(90deg);
            }
          }

          /* saat ditekan: latar sedikit mengecil, ikon ikut mengecil
             (yang berubah hanya elemen dalam, bukan tombolnya) */
          .ci-plus:not(.is-disabled):active .ci-plus-bg {
            opacity: 1;
            transform: scale(0.92);
            background: rgba(255, 255, 255, 0.16);
          }

          .ci-plus:not(.is-disabled):active .ci-plus-icon {
            transform: rotate(90deg) scale(0.86);
            transition-duration: 0.12s;
          }

          .ci-plus.is-disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          /* titik penanda: ada gambar yang sudah dipilih */
          .ci-plus.has-image {
            color: #00c2ff;
          }

          .ci-plus.has-image::after {
            content: "";
            position: absolute;
            top: 8px;
            right: 8px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 0 2px #10293a;
            pointer-events: none;
            animation: ciDotPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .ci-plus:focus-visible {
            outline: 2px solid rgba(0, 194, 255, 0.7);
            outline-offset: 2px;
          }

          /* ---------- Textarea ---------- */
          .ci-root .ci-textarea.form-control,
          .ci-root .ci-textarea.form-control:focus {
            flex: 1 1 auto;
            min-width: 0;
            min-height: 40px;
            padding: 8px 6px;
            border: 0 !important;
            border-radius: 0;
            background: transparent !important;
            box-shadow: none !important;
            outline: none;
            color: #eaf8ff !important;
            caret-color: #00c2ff;
            font-size: 15px;
            line-height: 24px;
            scrollbar-width: thin;
            scrollbar-color: #24465a transparent;
          }

          .ci-root .ci-textarea.form-control::placeholder {
            color: #5f788a;
            opacity: 1;
          }

          /* ---------- Mic ---------- */
          .ci-mic-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
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

          /* ---------- Kirim ---------- */
          .ci-send-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: linear-gradient(135deg, #00c2ff, #008fe8);
            color: #06131c;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0, 194, 255, 0.3);
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition:
              transform 0.15s ease,
              box-shadow 0.2s ease,
              background 0.2s ease,
              color 0.2s ease,
              opacity 0.2s ease;
          }

          .ci-send-btn:hover:not(:disabled) {
            transform: translateY(-1px) scale(1.05);
            box-shadow: 0 8px 22px rgba(0, 194, 255, 0.45);
          }

          .ci-send-btn:active:not(:disabled) {
            transform: scale(0.94);
          }

          .ci-send-btn:disabled {
            background: rgba(255, 255, 255, 0.07);
            color: rgba(255, 255, 255, 0.28);
            box-shadow: none;
            cursor: not-allowed;
          }

          .ci-send-btn.is-loading:disabled {
            background: linear-gradient(135deg, #00c2ff, #008fe8);
            color: #06131c;
            box-shadow: 0 6px 16px rgba(0, 194, 255, 0.3);
            opacity: 0.8;
            cursor: progress;
          }

          .ci-spinner {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid rgba(6, 19, 28, 0.25);
            border-top-color: #06131c;
            animation: ciSpin 0.7s linear infinite;
          }

          .ci-send-btn:focus-visible,
          .ci-mic-btn:focus-visible {
            outline: 2px solid rgba(0, 194, 255, 0.7);
            outline-offset: 2px;
          }

          /* ---------- Overlay saat menyeret gambar ---------- */
          .ci-drop {
            position: absolute;
            inset: 0;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-radius: inherit;
            background: rgba(7, 21, 31, 0.92);
            color: #7fdcff;
            font-size: 14px;
            font-weight: 600;
            pointer-events: none;
            animation: ciDropIn 0.15s ease;
          }

          /* ---------- Petunjuk keyboard (hanya di desktop) ---------- */
          .ci-hint {
            display: none;
          }

          @media (hover: hover) and (pointer: fine) {
            .ci-hint {
              display: block;
              margin-top: 8px;
              text-align: center;
              font-size: 11px;
              color: #4f6878;
              opacity: 0.7;
              user-select: none;
              transition: opacity 0.2s ease, color 0.2s ease;
            }

            .ci-hint.is-active {
              opacity: 1;
              color: #6f8798;
            }
          }

          .ci-root .ci-hint kbd {
            padding: 1px 6px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.04);
            color: inherit;
            font-family: inherit;
            font-size: 10px;
            box-shadow: none;
          }

          /* ---------- HP ---------- */
          @media (max-width: 767px) {
            .ci-box {
              padding: 5px;
              gap: 2px;
              border-radius: 26px;
            }

            .ci-root .ci-textarea.form-control,
            .ci-root .ci-textarea.form-control:focus {
              font-size: 16px; /* mencegah auto-zoom di iOS */
            }

            /* placeholder lebih kecil supaya muat satu baris di HP
               (ukuran 16px hanya perlu untuk teks yang diketik) */
            .ci-root .ci-textarea.form-control::placeholder {
              font-size: 14px;
            }

            .ci-hint {
              display: none !important;
            }
          }

          /* HP layar sempit (mis. 320-420px) */
          @media (max-width: 420px) {
            .ci-root .ci-textarea.form-control::placeholder {
              font-size: 13px;
            }
          }

          @media (max-width: 380px) {
            .ci-box {
              padding: 4px;
              gap: 0;
              border-radius: 24px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ci-mic-btn.listening { animation: none; }
            .ci-spinner { animation-duration: 1.6s; }
            .ci-drop { animation: none; }
            .ci-plus-bg,
            .ci-plus-icon { transition: none; }
            .ci-plus.has-image::after { animation: none; }
          }
        `}
      </style>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleKirim();
        }}
      >
        <div className="chat-input-row ci-row">
          <div
            className={`ci-box ${listening ? "is-listening" : ""} ${
              dragging ? "is-dragging" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* ==================================================
                TOMBOL PLUS / UPLOAD (di dalam kotak input)
                Pakai <label htmlFor> yang terhubung langsung ke
                <input type="file">, jadi browser sendiri yang
                membuka pemilih gambar. Klik di tengah maupun
                pinggir tombol sama-sama bekerja.
            ================================================== */}
            <input
              ref={setInputGambarRef}
              id="home-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              onClick={(e) => {
                // supaya memilih gambar yang sama 2x tetap terdeteksi
                e.target.value = "";
              }}
              disabled={loading}
              className="ci-file-input"
              tabIndex={-1}
              aria-hidden="true"
            />

            <label
              htmlFor="home-image-input"
              className={`ci-plus ${imagePreview ? "has-image" : ""} ${
                loading ? "is-disabled" : ""
              }`}
              role="button"
              tabIndex={loading ? -1 : 0}
              aria-label="Tambah gambar"
              aria-disabled={loading}
              title="Tambah gambar"
              onKeyDown={bukaPilihGambarKeyboard}
              onClick={(e) => {
                if (loading) e.preventDefault();
              }}
              draggable={false}
            >
              <span className="ci-plus-bg" aria-hidden="true" />
              <span className="ci-plus-icon" aria-hidden="true">
                <FiPlus size={22} strokeWidth={1.75} />
              </span>
            </label>

            {/* ==================================================
                CHAT INPUT
            ================================================== */}
            <Form.Control
              as="textarea"
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onPaste={handlePaste}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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
              aria-label="Pesan untuk AI.Ind"
              enterKeyHint="send"
              className="ci-textarea"
              style={{
                resize: "none",
                maxHeight: ambilTinggiMaks(),
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
            <button
              type="submit"
              className={`ci-send-btn ${loading ? "is-loading" : ""}`}
              disabled={!bisaKirim}
              aria-label="Kirim"
              aria-busy={loading}
              title="Kirim"
            >
              {loading ? (
                <span className="ci-spinner" />
              ) : (
                <FaArrowUp size={16} />
              )}
            </button>

            {/* Overlay saat gambar diseret ke kotak input */}
            {dragging && (
              <div className="ci-drop">
                <FiImage size={18} />
                <span>Lepaskan gambar di sini</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`ci-hint ${focused ? "is-active" : ""}`}
          aria-hidden="true"
        >
          <kbd>Enter</kbd> kirim · <kbd>Shift</kbd> + <kbd>Enter</kbd> baris
          baru
        </div>
      </Form>
    </div>
  );
}

export default ChatInput;