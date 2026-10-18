import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const cleanContent = (content = "") => {
    return content
      // Hilangkan tanda # di awal baris
      .replace(/^\s*#+\s?/gm, "")

      // Hilangkan tanda > di awal baris
      .replace(/^\s*>\s?/gm, "")

      // Hilangkan tanda **
      .replace(/\*\*/g, "")

      // Hilangkan tanda * untuk bullet sederhana
      .replace(/^\s*\*\s+/gm, "")

      // Hilangkan tanda ' jika berdiri sebagai tanda kutip
      .replace(/'/g, "")

      // Rapikan spasi berlebihan
      .replace(/[ \t]+$/gm, "")
      .trim();
  };

  const content = cleanContent(msg.content);

  const isUser = msg.role === "user";

  const hasImage = isUser && Boolean(msg.image);

  // =========================================================
  // SALIN TEKS
  // Pakai Clipboard API, dengan cadangan untuk WebView/HP
  // yang tidak mendukungnya (misal di Capacitor).
  // =========================================================
  const salinTeks = async () => {
    if (!content) return;

    let berhasil = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        berhasil = true;
      }
    } catch (err) {
      berhasil = false;
    }

    if (!berhasil) {
      try {
        const ta = document.createElement("textarea");
        ta.value = content;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        berhasil = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (err) {
        berhasil = false;
      }
    }

    if (berhasil) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes cmIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes cmPop {
            0% { transform: scale(0.6); }
            60% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }

          .cm-row {
            display: flex;
            width: 100%;
            margin-bottom: 14px;
            padding: 0 4px;
            box-sizing: border-box;
            animation: cmIn 0.28s ease both;
          }

          .cm-row.user { justify-content: flex-end; }
          .cm-row.ai { justify-content: flex-start; }

          .cm-col {
            display: flex;
            flex-direction: column;
            min-width: 0;
            max-width: 92%;
          }

          .cm-row.user .cm-col { align-items: flex-end; }
          .cm-row.ai .cm-col { align-items: flex-start; }

          /* ---------- Label AI.Ind ---------- */
          .cm-label {
            display: flex;
            align-items: center;
            gap: 1px;
            margin: 0 0 6px 4px;
            font-size: 12px;
            letter-spacing: -0.2px;
            color: #9fb4c4;
            user-select: none;
          }

          .cm-label b {
            font-weight: 800;
            color: #e8f3fa;
          }

          .cm-label-dot {
            width: 5px;
            height: 5px;
            margin: 0 2px 0 2px;
            border-radius: 50%;
            background: #00c2ff;
            box-shadow: 0 0 8px rgba(0, 194, 255, 0.8);
            align-self: flex-end;
            margin-bottom: 3px;
          }

          /* ---------- Bubble ---------- */
          .cm-bubble {
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.65;
            font-size: 15px;
          }

          .cm-bubble.ai {
            color: #e6eef5;
            padding: 14px 18px 14px 20px;
            border-radius: 6px 20px 20px 20px;
            background:
              linear-gradient(
                160deg,
                rgba(24, 48, 74, 0.95),
                rgba(15, 32, 52, 0.95)
              );
            border: 1px solid rgba(0, 194, 255, 0.14);
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.22);
          }

          /* garis aksen cyan di kiri, ciri khas AI.Ind */
          .cm-bubble.ai::before {
            content: "";
            position: absolute;
            left: 0;
            top: 12px;
            bottom: 12px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: linear-gradient(180deg, #00c2ff, rgba(0, 194, 255, 0.15));
          }

          .cm-bubble.user {
            color: #04111a;
            padding: 12px 18px;
            border-radius: 20px 20px 6px 20px;
            background: linear-gradient(135deg, #1fd0ff, #00a8e8);
            box-shadow: 0 6px 18px rgba(0, 194, 255, 0.22);
            font-weight: 500;
          }

          .cm-bubble.has-image {
            padding: 7px;
            width: fit-content;
            max-width: 380px;
          }

          .cm-image-wrap {
            border-radius: 15px;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.08);
          }

          .cm-image {
            display: block;
            width: 100%;
            max-width: 360px;
            max-height: 360px;
            object-fit: contain;
            border-radius: 15px;
            background: rgba(0, 0, 0, 0.05);
          }

          .cm-text {
            white-space: pre-wrap;
            word-break: break-word;
          }

          /* ---------- Tombol salin ---------- */
          .cm-actions {
            display: flex;
            margin-top: 6px;
            padding: 0 4px;
          }

          .cm-copy {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid rgba(159, 180, 196, 0.2);
            background: rgba(255, 255, 255, 0.04);
            color: #9fb4c4;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            user-select: none;
            transition: background 0.2s ease, color 0.2s ease,
              border-color 0.2s ease, transform 0.15s ease;
          }

          .cm-copy:hover {
            background: rgba(0, 194, 255, 0.1);
            border-color: rgba(0, 194, 255, 0.4);
            color: #7fdcff;
          }

          .cm-copy:active { transform: scale(0.94); }

          .cm-copy.done {
            background: rgba(0, 194, 255, 0.14);
            border-color: rgba(0, 194, 255, 0.5);
            color: #00c2ff;
          }

          .cm-copy.done svg { animation: cmPop 0.3s ease; }

          .cm-copy svg { pointer-events: none; flex-shrink: 0; }

          @media (prefers-reduced-motion: reduce) {
            .cm-row, .cm-copy.done svg {
              animation-duration: 0.01ms !important;
            }
          }
        `}
      </style>

      <div className={`cm-row ${isUser ? "user" : "ai"}`}>
        <div className="cm-col">

          {/* =========================
              LABEL AI.Ind
          ========================== */}

          {!isUser && (
            <div className="cm-label">
              <b>AI</b>
              <span className="cm-label-dot" />
              <span>Ind</span>
            </div>
          )}

          <div
            className={`cm-bubble ${isUser ? "user" : "ai"} ${
              hasImage ? "has-image" : ""
            }`}
          >

            {/* =========================
                GAMBAR PESAN USER
            ========================== */}

            {hasImage && (
              <div
                className="cm-image-wrap"
                style={{ marginBottom: content ? "8px" : "0" }}
              >
                <img
                  className="cm-image"
                  src={msg.image}
                  alt="Gambar yang dikirim"
                />
              </div>
            )}

            {/* =========================
                TEKS PESAN
            ========================== */}

            {content && (
              <div
                className="cm-text"
                style={{ padding: hasImage ? "3px 7px 7px" : "0" }}
              >
                {content}
              </div>
            )}
          </div>

          {/* =========================
              TOMBOL SALIN
          ========================== */}

          {content && (
            <div className="cm-actions">
              <button
                type="button"
                className={`cm-copy ${copied ? "done" : ""}`}
                onClick={salinTeks}
                aria-label={copied ? "Tersalin" : "Salin pesan"}
                title={copied ? "Tersalin" : "Salin pesan"}
              >
                {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatMessage;