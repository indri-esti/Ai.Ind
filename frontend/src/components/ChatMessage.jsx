import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiCopy,
  FiCheck,
  FiVolume2,
  FiSquare,
  FiPlay,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";

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
  let res;

  try {
    res = await fetch(buatUrlSuara(teks, mode), { signal });
  } catch (err) {
    if (err && err.name === "AbortError") throw err;
    throw new Error(
      "Tidak bisa terhubung ke server suara. Cek ALAMAT_BACKEND di ChatMessage.jsx"
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j && j.detail ? String(j.detail) : "";
    } catch (e) {
      // bukan JSON (mis. halaman 404)
    }
    throw new Error(
      `Server suara error ${res.status}${detail ? ": " + detail : ""}`
    );
  }

  const tipe = res.headers.get("content-type") || "";
  if (!tipe.includes("audio")) {
    throw new Error(
      "Alamat suara salah: server tidak mengirim audio (cek ALAMAT_BACKEND / router /api/tts)"
    );
  }

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

// false = jangan pernah pakai suara bawaan HP/browser (suara Google).
// Kalau suara server gagal, coba ulang lalu berhenti. Ubah ke true kalau
// suatu hari ingin suara cadangan itu dihidupkan lagi.
const PAKAI_SUARA_BROWSER = false;

// Batas menunggu suara mulai terdengar sebelum dianggap gagal (milidetik)
const BATAS_MULAI_SUARA = 20000;

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

// =========================================================
// SALIN KE CLIPBOARD
// Pakai Clipboard API, dengan cadangan untuk WebView/HP
// yang tidak mendukungnya (misal di Capacitor).
// Dipakai oleh tombol salin pesan dan tombol salin kode.
// =========================================================
const salinKeClipboard = async (teks) => {
  if (!teks) return false;

  let berhasil = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(teks);
      berhasil = true;
    }
  } catch (err) {
    berhasil = false;
  }

  if (!berhasil) {
    try {
      const ta = document.createElement("textarea");
      ta.value = teks;
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

  return berhasil;
};

// Pecah isi pesan jadi bagian teks biasa dan blok kode (```...```)
const pecahBagian = (isi) => {
  const hasil = [];

  String(isi || "")
    .split(/(```[\s\S]*?```)/g)
    .forEach((bagian) => {
      if (!bagian) return;

      if (bagian.startsWith("```") && bagian.endsWith("```") && bagian.length >= 6) {
        const m = bagian.match(/^```([^\n`]*)\n?([\s\S]*?)```$/);

        if (m) {
          hasil.push({
            tipe: "kode",
            bahasa: m[1].trim(),
            isi: m[2].replace(/\n$/, ""),
          });
          return;
        }
      }

      const teks = bagian.replace(/^\n+|\n+$/g, "");
      if (teks.trim()) hasil.push({ tipe: "teks", isi: teks });
    });

  return hasil;
};

// =========================================================
// HASIL KODE (HTML / SVG)
// Kode yang bisa dijalankan punya tombol "Lihat hasil".
// Hasilnya langsung terbuka di jendela pratinjau (iframe aman).
// =========================================================
const META_VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1">';

// Bahasa yang bisa dijalankan langsung di browser
const BAHASA_ALIAS = {
  html: "html",
  htm: "html",
  svg: "svg",
  css: "css",
  js: "js",
  javascript: "js",
  mjs: "js",
  jsx: "jsx",
  react: "jsx",
  tsx: "tsx",
  ts: "ts",
  typescript: "ts",
  py: "py",
  python: "py",
  python3: "py",
};

const normBahasa = (bahasa, kode) => {
  const b = BAHASA_ALIAS[(bahasa || "").toLowerCase().trim()];
  if (b) return b;
  if (!bahasa && /^\s*(<!doctype html|<html)/i.test(kode || "")) return "html";
  return null;
};

const amanScript = (t) => String(t).replace(/<\/script/gi, "<\\/script");

const keJson = (t) =>
  JSON.stringify(String(t))
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

// Tampilan konsol (untuk output console.log, print, dan error)
const KONSOL_CSS = `html,body{margin:0;background:#0b1622}#__konsol{font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;color:#d6e6f2;padding:12px 14px;box-sizing:border-box}.k{white-space:pre-wrap;word-break:break-word;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0}.k.error{color:#ff8a8a}.k.warn{color:#ffd479}#__status{font:13px system-ui,sans-serif;color:#7fdcff;padding:12px 14px 0}`;

const REACT_CSS = `body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif}#__konsol{font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;background:#0b1622;color:#d6e6f2;padding:12px 14px}#__konsol:empty{display:none}.k{white-space:pre-wrap;word-break:break-word;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0}.k.error{color:#ff8a8a}.k.warn{color:#ffd479}`;

const KONSOL_JS = `(function(){var el=document.getElementById("__konsol");function fmt(a){try{if(a instanceof Error)return a.stack||String(a);if(typeof a==="object"&&a!==null)return JSON.stringify(a,null,2);return String(a);}catch(e){return String(a);}}function tulis(t,args){var d=document.createElement("div");d.className="k "+t;d.textContent=Array.prototype.map.call(args,fmt).join(" ");el.appendChild(d);}["log","info","warn","error","debug"].forEach(function(n){var asli=console[n];console[n]=function(){tulis(n==="debug"||n==="info"?"log":n,arguments);asli.apply(console,arguments);};});window.addEventListener("error",function(e){tulis("error",[e.message||String(e.error)]);});window.addEventListener("unhandledrejection",function(e){tulis("error",[e.reason]);});window.__tulis=tulis;})();`;

const CEK_KOSONG = `if(!document.getElementById("__konsol").childNodes.length){window.__tulis("log",["Selesai. Tidak ada output."]);}`;

const URL_BABEL = "https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js";
const URL_REACT = "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js";
const URL_REACT_DOM = "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js";
const URL_PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

// Gabungkan HTML dengan CSS dan JS dari blok kode lain di pesan yang sama
const gabungHtml = (html, cssList, jsList) => {
  let h = String(html);

  const punyaStyle = /<style[\s>]/i.test(h);
  const punyaJs = /<script(?![^>]*\bsrc\s*=)[^>]*>\s*\S/i.test(h);
  const css = punyaStyle ? [] : cssList;
  const js = punyaJs ? [] : jsList;

  const styleTag = css.length ? "<style>" + css.join("\n") + "</style>" : "";
  const scriptTag = js.length
    ? "<script>" + js.map(amanScript).join("\n;\n") + "</script>"
    : "";
  const meta = /<meta[^>]+viewport/i.test(h) ? "" : META_VIEWPORT;
  const kepala = meta + styleTag;

  if (kepala) {
    if (/<head[^>]*>/i.test(h)) {
      h = h.replace(/<head[^>]*>/i, (m) => m + kepala);
    } else if (/<html[^>]*>/i.test(h)) {
      h = h.replace(/<html[^>]*>/i, (m) => m + "<head>" + kepala + "</head>");
    } else {
      h = kepala + h;
    }
  }

  if (scriptTag) {
    if (/<\/body>/i.test(h)) {
      h = h.replace(/<\/body>/i, () => scriptTag + "</body>");
    } else {
      h += scriptTag;
    }
  }

  return h;
};

const DEMO_CSS_HTML = `<main class="demo"><h1>Judul contoh</h1><p>Ini paragraf contoh untuk melihat gaya CSS kamu. <a href="#">Tautan</a></p><button>Tombol</button> <input placeholder="Kolom isian"><ul><li>Satu</li><li>Dua</li><li>Tiga</li></ul><div class="card box">Kotak</div></main>`;

// Siapkan kode React: buang import/export, cari komponen utamanya
const siapkanJsx = (kode) => {
  let nama = null;

  let k = String(kode)
    .replace(/^\s*import\s+["'][^"']+["'];?[ \t]*$/gm, "")
    .replace(/^\s*import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?[ \t]*$/gm, "");

  k = k.replace(
    /export\s+default\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    (m, a, n) => {
      nama = n;
      return (a || "") + "function " + n;
    }
  );

  k = k.replace(/export\s+default\s+class\s+([A-Za-z_$][\w$]*)/, (m, n) => {
    nama = n;
    return "class " + n;
  });

  k = k.replace(/^\s*export\s+default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/m, (m, n) => {
    if (!nama) nama = n;
    return "";
  });

  k = k.replace(/export\s+default\s+/, () => {
    if (!nama) nama = "__Default";
    return "const __Default = ";
  });

  k = k
    .replace(/^\s*export\s*\{[^}]*\};?/gm, "")
    .replace(/^(\s*)export\s+(?=(?:const|let|var|function|class|async)\b)/gm, "$1");

  if (!nama) {
    if (/\b(?:function|const|let|var|class)\s+App\b/.test(k)) {
      nama = "App";
    } else {
      const re = /(?:function|class|const)\s+([A-Z][\w$]*)/g;
      let m;
      let terakhir = null;
      while ((m = re.exec(k))) terakhir = m[1];
      nama = terakhir;
    }
  }

  const awalan =
    "const {useState,useEffect,useRef,useMemo,useCallback,useReducer,useContext,useLayoutEffect,createContext,Fragment,memo,forwardRef}=React;\n";

  return { src: awalan + k, nama };
};

const halamanReact = (kode, ts) => {
  const { src, nama } = siapkanJsx(kode);
  const preset = ts
    ? '["react",["typescript",{isTSX:true,allExtensions:true}]]'
    : '["react"]';

  return `<!doctype html><html><head><meta charset="utf-8">${META_VIEWPORT}<style>${REACT_CSS}</style></head><body><div id="root"></div><div id="__konsol"></div><script>${KONSOL_JS}</script><script src="${URL_REACT}"></script><script src="${URL_REACT_DOM}"></script><script src="${URL_BABEL}"></script><script>(function(){try{var src=${keJson(src)};var out=Babel.transform(src,{presets:${preset},filename:"app.${ts ? "tsx" : "jsx"}"}).code;var Komp=new Function("React","ReactDOM",out+"\\n;return "+${JSON.stringify(nama || "null")}+";")(React,ReactDOM);if(!Komp)throw new Error("Komponen tidak ditemukan. Pakai export default atau beri nama App.");ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Komp));}catch(e){window.__tulis("error",[e]);}})();</script></body></html>`;
};

const halamanPython = (kode) =>
  `<!doctype html><html><head><meta charset="utf-8">${META_VIEWPORT}<style>${KONSOL_CSS}</style></head><body><div id="__status">Memuat Python...</div><div id="__konsol"></div><script>${KONSOL_JS}</script><script src="${URL_PYODIDE}"></script><script>(async function(){var st=document.getElementById("__status");try{var py=await loadPyodide();py.setStdout({batched:function(s){window.__tulis("log",[s]);}});py.setStderr({batched:function(s){window.__tulis("error",[s]);}});var kode=${keJson(kode)};st.textContent="Menjalankan...";await py.loadPackagesFromImports(kode);await py.runPythonAsync(kode);st.remove();${CEK_KOSONG}}catch(e){st.remove();window.__tulis("error",[e.message||e]);}})();</script></body></html>`;

const halamanKonsol = (isiScript) =>
  `<!doctype html><html><head><meta charset="utf-8">${META_VIEWPORT}<style>${KONSOL_CSS}</style></head><body><div id="__konsol"></div><script>${KONSOL_JS}</script>${isiScript}</body></html>`;

const buatDokumen = (bahasa, kode, semua = []) => {
  const b = normBahasa(bahasa, kode);
  if (!b) return null;

  const lain = (jenis) =>
    semua
      .filter((x) => normBahasa(x.bahasa, x.isi) === jenis)
      .map((x) => x.isi);

  if (b === "svg") {
    return `<!doctype html><html><head><meta charset="utf-8">${META_VIEWPORT}<style>html,body{margin:0;height:100%}body{display:grid;place-items:center;background:#fff}svg{max-width:100%;max-height:100vh}</style></head><body>${kode}</body></html>`;
  }

  if (b === "html") {
    return gabungHtml(kode, lain("css"), lain("js"));
  }

  if (b === "css") {
    const htmls = lain("html");
    if (htmls.length) return gabungHtml(htmls[0], [kode], lain("js"));

    return `<!doctype html><html><head><meta charset="utf-8">${META_VIEWPORT}<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style><style>${kode}</style></head><body>${DEMO_CSS_HTML}</body></html>`;
  }

  if (b === "js") {
    const htmls = lain("html");
    if (htmls.length) return gabungHtml(htmls[0], lain("css"), [kode]);

    return halamanKonsol(
      `<script>${amanScript(kode)}</script><script>${CEK_KOSONG}</script>`
    );
  }

  if (b === "ts") {
    return halamanKonsol(
      `<script src="${URL_BABEL}"></script><script>(function(){try{var out=Babel.transform(${keJson(kode)},{presets:["typescript"],filename:"kode.ts"}).code;(0,eval)(out);}catch(e){window.__tulis("error",[e]);}${CEK_KOSONG}})();</script>`
    );
  }

  if (b === "jsx" || b === "tsx") return halamanReact(kode, b === "tsx");

  if (b === "py") return halamanPython(kode);

  return null;
};

function HasilKode({ dokumen, onTutup }) {
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const esc = (e) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", esc);

    return () => {
      document.body.style.overflow = lama;
      window.removeEventListener("keydown", esc);
    };
  }, [onTutup]);

  return createPortal(
    <div
      className="hk-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Hasil kode"
      onClick={(e) => {
        e.stopPropagation();
        onTutup();
      }}
    >
      <div className="hk-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="hk-bar">
          <span className="hk-title">Hasil</span>

          <div className="hk-bar-act">
            <button
              type="button"
              className="hk-btn"
              onClick={() => setVersi((v) => v + 1)}
              aria-label="Muat ulang hasil"
            >
              <FiRefreshCw size={16} />
            </button>

            <button
              type="button"
              className="hk-btn"
              onClick={onTutup}
              aria-label="Tutup hasil"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <iframe
          key={versi}
          className="hk-frame"
          title="Hasil kode"
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          srcDoc={dokumen}
        />
      </div>
    </div>,
    document.body
  );
}

// =========================================================
// VIDEO
// Link YouTube diputar langsung di dalam chat, begitu juga
// link video langsung (.mp4, .webm, dst) dan msg.video.
// =========================================================
const REGEX_YOUTUBE =
  /(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const REGEX_VIDEO_LANGSUNG = /\.(mp4|webm|ogg|mov|m4v)(\?[^\s]*)?$/i;

const klasifikasiVideo = (url) => {
  const yt = url.match(REGEX_YOUTUBE);
  if (yt) return { jenis: "youtube", sumber: yt[1] };
  if (REGEX_VIDEO_LANGSUNG.test(url)) return { jenis: "langsung", sumber: url };
  return null;
};

const ambilVideo = (teks, videoPesan) => {
  const hasil = [];
  const sudah = new Set();

  const tambah = (url) => {
    const v = klasifikasiVideo(url);
    if (!v) return;
    const kunci = v.jenis + v.sumber;
    if (sudah.has(kunci)) return;
    sudah.add(kunci);
    hasil.push(v);
  };

  if (typeof videoPesan === "string" && videoPesan) tambah(videoPesan);

  (teks.match(/https?:\/\/[^\s)]+/g) || []).forEach((u) =>
    tambah(u.replace(/[.,;!?]+$/, ""))
  );

  return hasil.slice(0, 3);
};

function PemutarVideo({ jenis, sumber }) {
  const [gagal, setGagal] = useState(false);

  if (jenis === "youtube") {
    return (
      <div className="cm-video cm-video-yt">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${sumber}?rel=0&playsinline=1`}
          title="Video YouTube"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className="cm-video">
      {gagal ? (
        <div className="cm-video-err">Video tidak bisa diputar.</div>
      ) : (
        <video
          src={sumber}
          controls
          playsInline
          preload="metadata"
          onError={() => setGagal(true)}
        />
      )}
    </div>
  );
}

// Blok kode dengan tombol salin sendiri
function BlokKode({ bahasa, isi, semua }) {
  const [tersalin, setTersalin] = useState(false);
  const [buka, setBuka] = useState(false);
  const dokumen = buatDokumen(bahasa, isi, semua);
  const jenis = normBahasa(bahasa, isi);
  const labelJalan =
    jenis === "py" || jenis === "js" || jenis === "ts"
      ? "Jalankan"
      : "Lihat hasil";
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const salinKode = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const ok = await salinKeClipboard(isi);

    if (ok) {
      setTersalin(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setTersalin(false), 1800);
    }
  };

  return (
    <div
      className={`cm-code ${dokumen ? "klik" : ""}`}
      onClick={dokumen ? () => setBuka(true) : undefined}
      onKeyDown={
        dokumen
          ? (e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) {
                setBuka(true);
              }
            }
          : undefined
      }
      role={dokumen ? "button" : undefined}
      tabIndex={dokumen ? 0 : undefined}
      aria-label={dokumen ? "Ketuk untuk melihat hasil kode" : undefined}
    >
      <div className="cm-code-head">
        <span className="cm-code-lang">{bahasa || "kode"}</span>

        <div className="cm-code-acts">
          {dokumen && (
            <button
              type="button"
              className="cm-code-copy cm-code-run"
              onClick={(e) => {
                e.stopPropagation();
                setBuka(true);
              }}
              aria-label="Lihat hasil kode"
            >
              <FiPlay size={13} />
              <span>{labelJalan}</span>
            </button>
          )}

        <button
          type="button"
          className={`cm-code-copy ${tersalin ? "done" : ""}`}
          onClick={salinKode}
          aria-label={tersalin ? "Kode tersalin" : "Salin kode"}
        >
          {tersalin ? <FiCheck size={13} /> : <FiCopy size={13} />}
          <span>{tersalin ? "Tersalin" : "Salin kode"}</span>
        </button>
        </div>
      </div>

      {buka && dokumen && (
        <HasilKode dokumen={dokumen} onTutup={() => setBuka(false)} />
      )}

      <pre className="cm-code-body">
        <code>{isi}</code>
      </pre>

      {dokumen && (
        <div className="cm-code-hint">
          <FiPlay size={12} />
          <span>
            {labelJalan === "Jalankan"
              ? "Ketuk kode untuk menjalankannya"
              : "Ketuk kode untuk melihat hasilnya"}
          </span>
        </div>
      )}
    </div>
  );
}

// Pratinjau gambar layar penuh (ketuk gambar di chat untuk membukanya)
function PratinjauGambar({ src, onTutup }) {
  useEffect(() => {
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const esc = (e) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", esc);

    return () => {
      document.body.style.overflow = lama;
      window.removeEventListener("keydown", esc);
    };
  }, [onTutup]);

  return createPortal(
    <div
      className="gp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Gambar"
      onClick={(e) => {
        e.stopPropagation();
        onTutup();
      }}
    >
      <button
        type="button"
        className="gp-close"
        onClick={(e) => {
          e.stopPropagation();
          onTutup();
        }}
        aria-label="Tutup gambar"
      >
        <FiX size={20} />
      </button>

      <img
        className="gp-img"
        src={src}
        alt="Gambar"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const [imageError, setImageError] = useState(false);
  const [gambarTerbuka, setGambarTerbuka] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatSuara, setGalatSuara] = useState("");
  const galatTimerRef = useRef(null);
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

  // Bagian pesan: teks biasa dan blok kode
  const bagianPesan = pecahBagian(content);
  const adaKode = bagianPesan.some((b) => b.tipe === "kode");
  const semuaKode = bagianPesan.filter((b) => b.tipe === "kode");

  // Video: dari msg.video atau link di teks biasa (bukan di dalam kode)
  const daftarVideo = ambilVideo(
    bagianPesan
      .filter((b) => b.tipe === "teks")
      .map((b) => b.isi)
      .join("\n"),
    msg.video
  );

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
  // =========================================================
  const salinTeks = async () => {
    if (!content) return;

    const berhasil = await salinKeClipboard(content);

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

  const tampilGalat = (pesan) => {
    console.error("[Suara]", pesan);
    setGalatSuara(pesan || "Suara gagal diputar");
    if (galatTimerRef.current) clearTimeout(galatTimerRef.current);
    galatTimerRef.current = setTimeout(() => setGalatSuara(""), 8000);
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
      // Kalau suara tidak kunjung mulai, anggap gagal supaya bisa dicoba ulang
      let pewaktu = setTimeout(() => {
        pewaktu = null;
        if (tokenSuaraRef.current !== token) {
          resolve();
          return;
        }
        reject(new Error("Suara terlalu lama dimulai"));
      }, BATAS_MULAI_SUARA);

      const hentikanPewaktu = () => {
        if (pewaktu) {
          clearTimeout(pewaktu);
          pewaktu = null;
        }
      };

      audio.onended = () => {
        hentikanPewaktu();
        resolve();
      };

      audio.onerror = () => {
        hentikanPewaktu();
        if (tokenSuaraRef.current !== token) {
          resolve();
          return;
        }
        reject(new Error("Audio gagal diputar"));
      };

      audio.onplaying = () => {
        hentikanPewaktu();
        if (tokenSuaraRef.current !== token) return;
        setMemuat(false);
        setSpeaking(true);
      };

      audio.src = sumber;

      const p = audio.play();

      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          hentikanPewaktu();
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

    setGalatSuara("");

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

    // Streaming gagal (server baru bangun, jaringan putus-putus, dll):
    // coba lagi lewat unduhan penuh, sampai 3 kali, tanpa suara cadangan.
    const putarUlang = async (teksPotongan) => {
      let galat = null;

      for (let percobaan = 0; percobaan < 3; percobaan++) {
        if (tokenSuaraRef.current !== token) return;

        try {
          const blob = await ambilAudio(
            teksPotongan,
            modeSuara,
            ctrl.signal
          );

          if (tokenSuaraRef.current !== token) return;

          if (urlRef.current) URL.revokeObjectURL(urlRef.current);

          const alamat = URL.createObjectURL(blob);
          urlRef.current = alamat;

          await putarSumber(audio, alamat, token);
          return;
        } catch (err) {
          if (err && err.name === "AbortError") throw err;
          galat = err;

          await new Promise((r) => setTimeout(r, 600 * (percobaan + 1)));
        }
      }

      throw galat || new Error("Suara gagal dibuat");
    };

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

          try {
            await putarSumber(audio, sumber, token);
          } catch (err) {
            if (err && err.name === "AbortError") return;
            if (tokenSuaraRef.current !== token) return;

            await putarUlang(potongan[idx]);
          }

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

        // Sudah dicoba ulang tapi tetap gagal: berhenti (tanpa suara Google)
        if (!PAKAI_SUARA_BROWSER) {
          hentikanSemua();
          tampilGalat(err && err.message);
          return;
        }

        bersihAudio();
        putarSuaraBrowser(token, potongan.slice(idx).join("\n"));
      }
    };

    jalankan();
  };

  // Hentikan suara kalau pesan hilang dari layar (misal ganti chat)
  useEffect(() => {
    return () => {
      if (galatTimerRef.current) clearTimeout(galatTimerRef.current);
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

          @keyframes cmSpin {
            to { transform: rotate(360deg); }
          }

          .cm-row {
            display: flex;
            width: 100%;
            margin-bottom: 18px;
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

          /* pesan AI yang berisi kode dilebarkan supaya kode lega */
          .cm-col.wide { width: 100%; max-width: 100%; }

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
            min-width: 0;
            max-width: 100%;
            word-break: break-word;
            line-height: 1.7;
            font-size: 15px;
            letter-spacing: 0.1px;
          }

          .cm-col.wide .cm-bubble { width: 100%; }

          .cm-bubble.ai {
            color: #e6eef5;
            padding: 14px 18px 14px 20px;
            border-radius: 6px 22px 22px 22px;
            background:
              linear-gradient(
                160deg,
                rgba(24, 48, 74, 0.92),
                rgba(14, 30, 49, 0.92)
              );
            border: 1px solid rgba(0, 194, 255, 0.14);
            box-shadow:
              0 8px 26px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
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
            border-radius: 22px 22px 6px 22px;
            background: linear-gradient(135deg, #2bd6ff, #00a8e8);
            box-shadow: 0 8px 20px rgba(0, 194, 255, 0.24);
            font-weight: 500;
          }

          .cm-bubble.has-image {
            padding: 7px;
            width: fit-content;
            max-width: 380px;
          }

          .cm-image-wrap {
            border-radius: 16px;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.08);
          }

          .cm-image {
            display: block;
            width: 100%;
            max-width: 360px;
            max-height: 360px;
            object-fit: contain;
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.05);
          }

          .cm-text {
            white-space: pre-wrap;
            word-break: break-word;
          }

          .cm-bubble.has-image .cm-text {
            padding: 8px 10px 4px;
          }

          .cm-text + .cm-code,
          .cm-code + .cm-text,
          .cm-code + .cm-code {
            margin-top: 12px;
          }

          .cm-text + .cm-code { margin-bottom: 2px; }
          .cm-code + .cm-text { margin-top: 12px; }

          /* ---------- Blok kode ---------- */
          .cm-code {
            border-radius: 14px;
            overflow: hidden;
            background: #08121d;
            border: 1px solid rgba(0, 194, 255, 0.16);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            margin: 4px 0;
            width: 100%;
            box-sizing: border-box;
            text-align: left;
          }

          .cm-code-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 7px 8px 7px 14px;
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid rgba(0, 194, 255, 0.12);
          }

          .cm-code-lang {
            font-size: 12px;
            font-weight: 600;
            color: #7fdcff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: none;
          }

          .cm-code-copy {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 28px;
            padding: 0 11px;
            border-radius: 999px;
            border: 1px solid rgba(159, 180, 196, 0.22);
            background: rgba(255, 255, 255, 0.05);
            color: #b8cbd9;
            font-size: 12px;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            flex-shrink: 0;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            user-select: none;
            transition: background 0.2s ease, color 0.2s ease,
              border-color 0.2s ease, transform 0.15s ease;
          }

          .cm-code-copy:hover {
            background: rgba(0, 194, 255, 0.12);
            border-color: rgba(0, 194, 255, 0.45);
            color: #7fdcff;
          }

          .cm-code-copy:active { transform: scale(0.94); }

          .cm-code-copy:focus-visible {
            outline: 2px solid #00c2ff;
            outline-offset: 2px;
          }

          .cm-code-copy.done {
            background: rgba(0, 194, 255, 0.16);
            border-color: rgba(0, 194, 255, 0.55);
            color: #00c2ff;
          }

          .cm-code-copy.done svg { animation: cmPop 0.3s ease; }

          .cm-code-copy svg { pointer-events: none; flex-shrink: 0; }

          .cm-code-body {
            margin: 0;
            padding: 14px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            font-family: "JetBrains Mono", "Fira Code", ui-monospace,
              SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 13px;
            line-height: 1.6;
            color: #d6e6f2;
            white-space: pre;
            word-break: normal;
            tab-size: 2;
          }

          .cm-code-body code {
            font-family: inherit;
            background: none;
            padding: 0;
            white-space: inherit;
          }

          .cm-code-body::-webkit-scrollbar { height: 6px; }
          .cm-code-body::-webkit-scrollbar-thumb {
            background: rgba(0, 194, 255, 0.25);
            border-radius: 3px;
          }

          .cm-code-acts {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }

          .cm-code.klik { cursor: pointer; }

          .cm-code.klik:hover {
            border-color: rgba(0, 194, 255, 0.4);
          }

          .cm-code.klik:focus-visible {
            outline: 2px solid #00c2ff;
            outline-offset: 2px;
          }

          .cm-code-hint {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            font-size: 12px;
            color: #7fdcff;
            background: rgba(0, 194, 255, 0.06);
            border-top: 1px solid rgba(0, 194, 255, 0.12);
            user-select: none;
          }

          .cm-code-hint svg { flex-shrink: 0; }

          .cm-code-run {
            background: rgba(0, 194, 255, 0.14);
            border-color: rgba(0, 194, 255, 0.4);
            color: #00c2ff;
          }

          /* ---------- Jendela hasil kode ---------- */
          @keyframes hkFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes hkUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .hk-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(3, 10, 18, 0.72);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            animation: hkFade 0.2s ease both;
          }

          .hk-sheet {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: #0a1622;
            overflow: hidden;
            animation: hkUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .hk-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: calc(env(safe-area-inset-top, 0px) + 8px) 10px 8px 16px;
            background: #0d1d2d;
            border-bottom: 1px solid rgba(0, 194, 255, 0.16);
          }

          .hk-title {
            font-size: 14px;
            font-weight: 600;
            color: #e6eef5;
          }

          .hk-bar-act {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .hk-btn {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            border: 1px solid rgba(159, 180, 196, 0.2);
            background: rgba(255, 255, 255, 0.05);
            color: #b8cbd9;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            transition: background 0.2s ease, color 0.2s ease,
              border-color 0.2s ease;
          }

          .hk-btn:hover {
            background: rgba(0, 194, 255, 0.12);
            border-color: rgba(0, 194, 255, 0.45);
            color: #7fdcff;
          }

          .hk-btn:focus-visible {
            outline: 2px solid #00c2ff;
            outline-offset: 2px;
          }

          .hk-frame {
            flex: 1;
            width: 100%;
            border: 0;
            background: #fff;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }

          @media (min-width: 768px) {
            .hk-sheet {
              width: min(960px, 94vw);
              height: min(86vh, 800px);
              border-radius: 18px;
              border: 1px solid rgba(0, 194, 255, 0.2);
              box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
            }

            .hk-bar {
              padding-top: 8px;
            }
          }

          /* ---------- Video ---------- */
          .cm-video {
            width: min(480px, 78vw);
            max-width: 100%;
            margin-top: 12px;
            border-radius: 14px;
            overflow: hidden;
            background: #000;
            border: 1px solid rgba(0, 194, 255, 0.16);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          .cm-video-yt { aspect-ratio: 16 / 9; }

          .cm-video-yt iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
          }

          .cm-video video {
            display: block;
            width: 100%;
            max-height: 380px;
            background: #000;
          }

          .cm-video-err {
            padding: 12px 14px;
            font-size: 13px;
            color: #9fb4c4;
            background: rgba(255, 255, 255, 0.04);
          }

          @media (prefers-reduced-motion: reduce) {
            .hk-overlay, .hk-sheet { animation-duration: 0.01ms !important; }
          }

          .cm-image-wrap.klik { cursor: zoom-in; }

          .cm-image-wrap.klik:focus-visible {
            outline: 2px solid #04111a;
            outline-offset: 2px;
          }

          /* ---------- Pratinjau gambar ---------- */
          @keyframes gpIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes gpZoom {
            from { opacity: 0; transform: scale(0.94); }
            to { opacity: 1; transform: scale(1); }
          }

          .gp-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: rgba(3, 10, 18, 0.88);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            cursor: zoom-out;
            animation: gpIn 0.2s ease both;
          }

          .gp-img {
            display: block;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 14px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
            cursor: default;
            animation: gpZoom 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .gp-close {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 14px);
            right: 14px;
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }

          .gp-close:hover { background: rgba(255, 255, 255, 0.18); }

          @media (prefers-reduced-motion: reduce) {
            .gp-overlay, .gp-img { animation-duration: 0.01ms !important; }
          }

          /* ---------- Tombol aksi ---------- */
          .cm-err {
            font-size: 12px;
            line-height: 1.4;
            color: #ff9a9a;
            align-self: center;
            max-width: 100%;
          }

          .cm-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 7px;
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
            font-family: inherit;
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

          .cm-copy:focus-visible {
            outline: 2px solid #00c2ff;
            outline-offset: 2px;
          }

          .cm-copy.done {
            background: rgba(0, 194, 255, 0.14);
            border-color: rgba(0, 194, 255, 0.5);
            color: #00c2ff;
          }

          .cm-copy.active {
            background: rgba(0, 194, 255, 0.14);
            border-color: rgba(0, 194, 255, 0.5);
            color: #00c2ff;
          }

          .cm-copy.done svg { animation: cmPop 0.3s ease; }

          .cm-copy svg { pointer-events: none; flex-shrink: 0; }

          .cm-spin { animation: cmSpin 0.9s linear infinite; }

          @media (prefers-reduced-motion: reduce) {
            .cm-row, .cm-copy.done svg, .cm-code-copy.done svg {
              animation-duration: 0.01ms !important;
            }
          }
        `}
      </style>

      <div className={`cm-row ${isUser ? "user" : "ai"}`}>
        <div className={`cm-col ${!isUser && adaKode ? "wide" : ""}`}>

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
                className="cm-image-wrap klik"
                role="button"
                tabIndex={0}
                aria-label="Buka gambar"
                onClick={() => setGambarTerbuka(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setGambarTerbuka(true);
                  }
                }}
              >
                <img
                  className="cm-image"
                  src={msg.image}
                  alt="Gambar terkirim"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {gambarTerbuka && hasImage && (
              <PratinjauGambar
                src={msg.image}
                onTutup={() => setGambarTerbuka(false)}
              />
            )}

            {/* =========================
                ISI PESAN
                (teks biasa + blok kode
                dengan tombol salin sendiri)
            ========================== */}

            {bagianPesan.map((bagian, i) =>
              bagian.tipe === "kode" ? (
                <BlokKode
                  key={i}
                  bahasa={bagian.bahasa}
                  isi={bagian.isi}
                  semua={semuaKode}
                />
              ) : (
                <div className="cm-text" key={i}>
                  {bagian.isi}
                </div>
              )
            )}

            {/* =========================
                PEMUTAR VIDEO
            ========================== */}

            {daftarVideo.map((v) => (
              <PemutarVideo
                key={v.jenis + v.sumber}
                jenis={v.jenis}
                sumber={v.sumber}
              />
            ))}
          </div>

          {/* =========================
              TOMBOL AKSI
          ========================== */}

          {content && (
            <div className="cm-actions">
              <button
                type="button"
                className={`cm-copy ${copied ? "done" : ""}`}
                onClick={salinTeks}
                aria-label={copied ? "Pesan tersalin" : "Salin pesan"}
              >
                {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </button>

              {!isUser && teksSuara && (
                <button
                  type="button"
                  className={`cm-copy ${speaking || memuat ? "active" : ""}`}
                  onClick={putarSuara}
                  aria-label={
                    speaking || memuat ? "Hentikan suara" : "Bacakan pesan"
                  }
                >
                  {speaking || memuat ? (
                    <FiSquare
                      size={14}
                      className={memuat ? "cm-spin" : ""}
                    />
                  ) : (
                    <FiVolume2 size={14} />
                  )}
                  <span>
                    {memuat ? "Memuat" : speaking ? "Berhenti" : "Dengar"}
                  </span>
                </button>
              )}

              {galatSuara && (
                <span className="cm-err" role="alert">
                  {galatSuara}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatMessage;
