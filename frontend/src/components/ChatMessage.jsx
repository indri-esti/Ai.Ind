import { useState, useRef, useEffect } from "react";
import { FiCopy, FiCheck, FiVolume2, FiSquare } from "react-icons/fi";

// =========================================================
// ALAMAT ENDPOINT SUARA DI BACKEND (voice.py)
// Isi ALAMAT_BACKEND dengan alamat server kamu (tanpa /api di akhir),
// contoh: "https://nama-app-kamu.fastapicloud.dev"
// Kalau dikosongkan, dicoba ambil dari VITE_API_URL, lalu dari
// alamat situs yang sama.
// =========================================================
const ALAMAT_BACKEND = "";

const BASIS_BACKEND = (
  ALAMAT_BACKEND ||
  (typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_URL
    : "") ||
  ""
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const TTS_URL = `${BASIS_BACKEND}/api/tts`;

// Teks panjang dibacakan bertahap: dipecah per potongan (di batas kalimat),
// potongan berikutnya disiapkan selagi potongan sekarang diputar,
// jadi suara lanjut terus sampai habis tanpa terpotong.
const MAKS_POTONGAN_SUARA = 700;

// Alamat streaming untuk satu potongan teks. Dipakai langsung sebagai
// sumber <audio>, jadi suara mulai terdengar begitu potongan pertama datang.
const buatUrlSuara = (teks, mode) => {
  const p = new URLSearchParams({ text: teks });
  if (mode) p.set("mode", mode);
  return `${TTS_URL}?${p.toString()}`;
};

// Siapkan audio potongan berikutnya di belakang layar (dipakai kalau
// sudah selesai diunduh saat gilirannya tiba, supaya tidak ada jeda)
const ambilAudio = async (teks, mode, signal) => {
  const res = await fetch(buatUrlSuara(teks, mode), { signal });

  if (!res.ok) throw new Error("TTS gagal");

  return res.blob();
};

// Deteksi lirik lagu (sama dengan di backend), supaya semua potongan
// dikirim dengan mode nyanyi dan nadanya konsisten dari awal sampai akhir
const apakahLirik = (teks) => {
  if (
    /\[\s*(verse|chorus|reff?|refrain|intro|bridge|outro|pre-?chorus|hook|bait)[^\]]*\]/i.test(
      teks
    )
  ) {
    return true;
  }

  if (/[\u266A\u266B\u{1F3B5}\u{1F3B6}]/u.test(teks)) return true;

  const baris = teks
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  if (baris.length < 3) return false;

  const jumlahKata = (b) => b.split(/\s+/).length;

  const pendek = baris.filter(
    (b) =>
      jumlahKata(b) >= 2 && jumlahKata(b) <= 9 && !/[.!?:]$/.test(b)
  ).length;

  if (baris.length >= 4 && pendek / baris.length >= 0.7) return true;

  const sangatPendek = baris.filter((b) => jumlahKata(b) <= 10).length;

  if (
    /\b(lirik|lyrics?|nyanyi\w*|bernyanyi|lagu)\b/i.test(teks) &&
    sangatPendek / baris.length >= 0.6
  ) {
    return true;
  }

  const normal = baris.map((b) =>
    b.toLowerCase().replace(/\W+/g, " ").trim()
  );
  const adaUlang = new Set(normal).size < normal.length;

  if (baris.length >= 6 && adaUlang && sangatPendek / baris.length >= 0.8) {
    return true;
  }

  return false;
};

// Cadangan: suara bawaan browser, dipakai kalau backend tidak bisa dihubungi
const TTS_BROWSER =
  typeof window !== "undefined" && "speechSynthesis" in window;

// Penghenti suara yang sedang aktif, supaya hanya satu pesan bersuara
let penghentiAktif = null;

// Pilih suara Indonesia perempuan (untuk cadangan)
const pilihSuaraPerempuan = () => {
  if (!TTS_BROWSER) return null;

  const semua = window.speechSynthesis
    .getVoices()
    .filter(
      (v) =>
        v.lang &&
        v.lang.toLowerCase().replace("_", "-").startsWith("id")
    );

  const cewek = /female|perempuan|wanita|gadis|damayanti/i;
  const cowok = /\b(male|laki|pria|ardi)\b/i;

  return (
    semua.find((v) => cewek.test(v.name)) ||
    semua.find((v) => !cowok.test(v.name)) ||
    semua[0] ||
    null
  );
};

// Pecah teks jadi potongan pendek (Chrome sering berhenti
// di tengah kalau satu ucapan terlalu panjang).
// Pergantian baris dipertahankan (penting untuk lirik lagu).
const pecahTeks = (teks, maks = 180) => {
  const unit = [];

  teks.split("\n").forEach((baris, b) => {
    const isi = baris.trim();
    if (!isi) return;

    isi.split(/(?<=[.!?])\s+/).forEach((k) => {
      if (k.trim()) unit.push({ t: k.trim(), b });
    });
  });

  const hasil = [];
  let sekarang = "";
  let barisAkhir = -1;

  for (const u of unit) {
    const sambung = u.b === barisAkhir ? " " : "\n";
    const gabung = sekarang ? sekarang + sambung + u.t : u.t;

    if (sekarang && gabung.length > maks) {
      hasil.push(sekarang);
      sekarang = u.t;
    } else {
      sekarang = gabung;
    }

    barisAkhir = u.b;
  }

  if (sekarang.trim()) hasil.push(sekarang.trim());

  // Potong paksa kalau ada kalimat tunggal yang masih terlalu panjang
  return hasil.flatMap((h) => {
    if (h.length <= maks * 1.5) return [h];
    const bagian = [];
    for (let i = 0; i < h.length; i += maks) {
      bagian.push(h.slice(i, i + maks));
    }
    return bagian;
  });
};

function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const [imageError, setImageError] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const tokenSuaraRef = useRef(0);
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);

  // Bersihkan markdown di luar blok kode (```...```),
  // supaya kode seperti "# komentar" atau print('a') tidak rusak.
  const cleanContent = (content = "") => {
    return String(content || "")
      .split(/(```[\s\S]*?```)/g)
      .map((bagian) =>
        bagian.startsWith("```")
          ? bagian
          : cleanBagian(bagian)
      )
      .join("")
      .trim();
  };

  const cleanBagian = (content = "") => {
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
      .replace(/[ \t]+$/gm, "");
  };

  const content = cleanContent(msg.content);

  const isUser = msg.role === "user";

  const hasImage =
    isUser && Boolean(msg.image) && !imageError;

  // Teks untuk dibacakan: tanpa blok kode, link, dan simbol yang aneh jika dibaca
  const teksSuara = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`/g, "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ")
    .replace(/[_~|]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Lirik dideteksi dari isi asli (sebelum emoji not musik dibuang)
  const modeSuara = apakahLirik(content.replace(/```[\s\S]*?```/g, " "))
    ? "nyanyi"
    : null;

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

  // =========================================================
  // SUARA AI (TEKS -> SUARA)
  // Tekan 🔊 untuk memutar, tekan lagi untuk berhenti.
  // Hanya satu pesan yang bersuara pada satu waktu.
  // =========================================================
  const bersihAudio = () => {
    if (audioRef.current) {
      const a = audioRef.current;
      a.onended = null;
      a.onerror = null;
      a.onplaying = null;
      a.pause();
      a.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const hentikanSemua = () => {
    tokenSuaraRef.current += 1;

    try {
      abortRef.current?.abort();
    } catch (err) {
      // abaikan
    }
    abortRef.current = null;

    bersihAudio();

    if (TTS_BROWSER) window.speechSynthesis.cancel();

    setMemuat(false);
    setSpeaking(false);
  };

  // Cadangan: suara bawaan browser (perempuan kalau tersedia)
  const putarSuaraBrowser = (token, teks = teksSuara) => {
    if (!TTS_BROWSER) {
      setMemuat(false);
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const potongan = pecahTeks(teks, 220);
    const suara = pilihSuaraPerempuan();

    setMemuat(false);
    setSpeaking(true);

    potongan.forEach((bagian, i) => {
      const u = new SpeechSynthesisUtterance(bagian);
      u.lang = "id-ID";
      u.rate = 1;
      u.pitch = 1.05;
      if (suara) u.voice = suara;

      u.onend = () => {
        if (tokenSuaraRef.current !== token) return;
        if (i === potongan.length - 1) setSpeaking(false);
      };
      u.onerror = () => {
        if (tokenSuaraRef.current !== token) return;
        setSpeaking(false);
      };

      window.speechSynthesis.speak(u);
    });
  };

  // Putar satu sumber audio (alamat streaming atau blob) sampai selesai,
  // memakai elemen audio yang sama supaya tetap diizinkan di HP
  const putarSumber = (audio, sumber, token) =>
    new Promise((resolve, reject) => {
      audio.onended = () => {
        resolve();
      };

      audio.onerror = () => {
        if (tokenSuaraRef.current !== token) {
          resolve();
          return;
        }
        reject(new Error("Audio gagal diputar"));
      };

      audio.onplaying = () => {
        if (tokenSuaraRef.current !== token) return;
        setMemuat(false);
        setSpeaking(true);
      };

      audio.src = sumber;

      const p = audio.play();

      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          if (tokenSuaraRef.current !== token) {
            resolve();
            return;
          }
          reject(err);
        });
      }
    });

  const putarSuara = () => {
    if (!teksSuara) return;

    // Tekan lagi untuk berhenti / batal
    if (speaking || memuat) {
      hentikanSemua();
      return;
    }

    // Hentikan suara dari pesan lain
    if (penghentiAktif) penghentiAktif();
    penghentiAktif = hentikanSemua;

    const token = tokenSuaraRef.current + 1;
    tokenSuaraRef.current = token;

    setMemuat(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const potongan = pecahTeks(teksSuara, MAKS_POTONGAN_SUARA);
    const siap = [];

    // Unduh potongan ke-idx lebih awal (sekali saja) selagi yang lain diputar
    const siapkan = (idx) => {
      if (idx >= potongan.length || siap[idx]) return;

      const entri = { blob: null };
      siap[idx] = entri;

      ambilAudio(potongan[idx], modeSuara, ctrl.signal)
        .then((blob) => {
          entri.blob = blob;
        })
        .catch(() => {});
    };

    // Satu elemen audio dibuat langsung saat diklik, supaya
    // pemutaran pertama tidak diblokir browser / WebView HP
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const jalankan = async () => {
      let idx = 0;

      try {
        for (idx = 0; idx < potongan.length; idx++) {
          if (tokenSuaraRef.current !== token) return;

          // Pakai hasil unduhan kalau sudah selesai, kalau belum
          // langsung streaming supaya suara tidak menunggu
          let sumber;
          const entri = siap[idx];

          if (entri && entri.blob) {
            sumber = URL.createObjectURL(entri.blob);
            urlRef.current = sumber;
          } else {
            sumber = buatUrlSuara(potongan[idx], modeSuara);
          }

          // Siapkan potongan berikutnya selagi yang ini diputar
          siapkan(idx + 1);

          await putarSumber(audio, sumber, token);
          if (tokenSuaraRef.current !== token) return;

          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
          }
        }

        if (tokenSuaraRef.current === token) hentikanSemua();
      } catch (err) {
        if (err && err.name === "AbortError") return;
        if (tokenSuaraRef.current !== token) return;

        // Kalau ada yang gagal, lanjutkan sisa teks dengan suara cadangan
        bersihAudio();
        putarSuaraBrowser(token, potongan.slice(idx).join("\n"));
      }
    };

    jalankan();
  };

  // Hentikan suara kalau pesan hilang dari layar (misal ganti chat)
  useEffect(() => {
    return () => {
      if (tokenSuaraRef.current > 0) {
        tokenSuaraRef.current += 1;
        try {
          abortRef.current?.abort();
        } catch (err) {
          // abaikan
        }
        if (audioRef.current) {
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
          audioRef.current.onplaying = null;
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        if (TTS_BROWSER) window.speechSynthesis.cancel();
      }
    };
  }, []);

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
            gap: 8px;
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
                  onError={() => setImageError(true)}
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
              TOMBOL SALIN + SUARA
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

              {/* Tombol suara: hanya untuk jawaban AI */}
              {!isUser && teksSuara && (
                <button
                  type="button"
                  className={`cm-copy ${speaking || memuat ? "done" : ""}`}
                  onClick={putarSuara}
                  aria-label={
                    speaking || memuat ? "Hentikan suara" : "Putar suara"
                  }
                  title={speaking || memuat ? "Hentikan suara" : "Putar suara"}
                >
                  {speaking || memuat ? (
                    <FiSquare size={14} />
                  ) : (
                    <FiVolume2 size={14} />
                  )}
                  <span>{memuat ? "Memuat" : speaking ? "Stop" : "Suara"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatMessage;