import { useEffect, useRef, useState } from "react";
import axios from "../api";
import { FiX, FiVideo, FiImage, FiUpload, FiDownload, FiLoader } from "react-icons/fi";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function VideoGenerator({ show, onClose }) {
  const [mode, setMode] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [imagePreview, videoUrl]);

  useEffect(() => {
    if (!show) return;
    setError("");
  }, [show]);

  if (!show) return null;

  const pilihFile = (file) => {
    setError("");
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Gunakan gambar JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Ukuran gambar maksimal 8 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buatVideo = async (event) => {
    event.preventDefault();
    setError("");

    if (!prompt.trim()) {
      setError("Tulis deskripsi video terlebih dahulu.");
      return;
    }
    if (mode === "image" && !image) {
      setError("Pilih gambar yang ingin dijadikan video.");
      return;
    }

    const formData = new FormData();
    formData.append("mode", mode);
    formData.append("prompt", prompt.trim());
    if (image && mode === "image") formData.append("image", image);

    setLoading(true);
    try {
      const response = await axios.post("/video/generate", formData, {
        responseType: "blob",
        timeout: 600000,
      });
      const contentType = response.headers?.["content-type"] || "video/mp4";
      if (!contentType.includes("video")) {
        const text = await response.data.text();
        let message = "Gagal membuat video.";
        try { message = JSON.parse(text).detail || message; } catch (_) {}
        throw new Error(message);
      }
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(response.data));
    } catch (err) {
      let message = err.response?.data?.detail || err.message || "Terjadi kesalahan saat membuat video.";
      if (err.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await err.response.data.text());
          message = body.detail || message;
        } catch (_) {}
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const tutup = () => {
    if (loading) return;
    onClose?.();
  };

  return (
    <div className="aiv-overlay" role="dialog" aria-modal="true" aria-labelledby="aiv-title">
      <style>{`
        .aiv-overlay{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(1,9,16,.78);backdrop-filter:blur(8px)}
        .aiv-panel{width:min(100%,520px);max-height:90dvh;overflow:auto;border:1px solid rgba(74,190,232,.25);border-radius:22px;padding:18px;background:linear-gradient(160deg,#102b3e,#081723 75%);color:#eef9ff;box-shadow:0 22px 70px rgba(0,0,0,.48)}
        .aiv-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
        .aiv-title{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:700;margin:0}
        .aiv-close{width:36px;height:36px;border:0;border-radius:50%;background:#1b3a4e;color:#dff5ff;display:grid;place-items:center}
        .aiv-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
        .aiv-tab{border:1px solid #294b60;background:#10283a;color:#a9c4d4;padding:11px;border-radius:12px;font-weight:600}
        .aiv-tab.active{border-color:#20bce9;background:rgba(0,194,255,.13);color:#62d6ff}
        .aiv-label{display:block;font-size:13px;color:#c1d7e3;margin:13px 0 7px}
        .aiv-prompt{width:100%;min-height:105px;resize:vertical;border:1px solid #294b60;border-radius:13px;background:#091b29;color:#f3fbff;padding:12px;outline:none}
        .aiv-prompt:focus{border-color:#21bde9;box-shadow:0 0 0 3px rgba(0,194,255,.1)}
        .aiv-upload{width:100%;min-height:90px;border:1px dashed #39718e;border-radius:13px;background:rgba(0,194,255,.05);color:#b9d8e8;display:flex;align-items:center;justify-content:center;gap:9px;padding:12px}
        .aiv-preview{display:block;max-width:100%;max-height:190px;margin:10px auto 0;border-radius:12px}
        .aiv-error{margin-top:12px;padding:10px 12px;border:1px solid rgba(255,112,112,.35);border-radius:10px;background:rgba(160,35,35,.15);color:#ffb7b7;font-size:13px;overflow-wrap:anywhere}
        .aiv-generate{width:100%;margin-top:16px;border:0;border-radius:13px;padding:13px;background:linear-gradient(90deg,#078fc3,#12bce8);color:white;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;min-height:46px}
        .aiv-generate:disabled{opacity:.55}
        .aiv-spin{animation:aivSpin 1s linear infinite}@keyframes aivSpin{to{transform:rotate(360deg)}}
        .aiv-video{width:100%;margin-top:18px;border-radius:13px;background:#000}
        .aiv-download{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;color:#65d7ff;text-decoration:none;font-weight:600}
        .aiv-note{font-size:11px;line-height:1.5;color:#8daabb;margin:12px 0 0}
      `}</style>

      <div className="aiv-panel">
        <div className="aiv-head">
          <h2 className="aiv-title" id="aiv-title"><FiVideo color="#50d2ff" /> AI Video Generator</h2>
          <button type="button" className="aiv-close" onClick={tutup} disabled={loading} aria-label="Tutup"><FiX size={20} /></button>
        </div>

        <div className="aiv-tabs">
          <button type="button" className={`aiv-tab ${mode === "text" ? "active" : ""}`} onClick={() => { setMode("text"); setError(""); }}>Text to Video</button>
          <button type="button" className={`aiv-tab ${mode === "image" ? "active" : ""}`} onClick={() => { setMode("image"); setError(""); }}>Image to Video</button>
        </div>

        <form onSubmit={buatVideo}>
          <label className="aiv-label" htmlFor="aiv-prompt">Deskripsi video</label>
          <textarea id="aiv-prompt" className="aiv-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1200} placeholder="Contoh: Animasi 3D koki sedang memasak di dapur modern, kamera bergerak perlahan..." />

          {mode === "image" && (
            <>
              <span className="aiv-label">Gambar awal</span>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pilihFile(e.target.files?.[0])} />
              <button type="button" className="aiv-upload" onClick={() => fileRef.current?.click()}><FiUpload /> {image ? "Ganti gambar" : "Pilih gambar dari galeri"}</button>
              {imagePreview && <img className="aiv-preview" src={imagePreview} alt="Preview gambar" />}
            </>
          )}

          {error && <div className="aiv-error" role="alert">{error}</div>}

          <button className="aiv-generate" type="submit" disabled={loading}>
            {loading ? <><FiLoader className="aiv-spin" /> Sedang membuat video...</> : <><FiVideo /> Generate Video</>}
          </button>
        </form>

        {videoUrl && (
          <>
            <video className="aiv-video" src={videoUrl} controls playsInline />
            <a className="aiv-download" href={videoUrl} download="aiind-video.mp4"><FiDownload /> Download Video</a>
          </>
        )}
        <p className="aiv-note">Pembuatan video memerlukan waktu dan kuota layanan AI. Jangan unggah gambar pribadi atau sensitif.</p>
      </div>
    </div>
  );
}
