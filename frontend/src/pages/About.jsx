
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiCpu,
  FiCode,
  FiUser,
  FiMessageCircle,
  FiGlobe,
  FiZap,
} from "react-icons/fi";

function About() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#081420",
        color: "#e8f1fa",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: "850px", margin: "auto" }}>
        <Link
          to="/"
          style={{
            color: "#36cfff",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "35px",
          }}
        >
          <FiArrowLeft /> Kembali ke AI.Ind
        </Link>

        <div style={{ textAlign: "center", marginBottom: "45px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "bold" }}>
            AI<span style={{ color: "#00cfff" }}>.</span>Ind
          </h1>

          <h2 style={{ fontSize: "24px" }}>
            Tentang AI.Ind
          </h2>

          <p style={{ color: "#a9b9c9", lineHeight: 1.8 }}>
            Asisten Cerdas Indonesia
          </p>
        </div>

        <section style={cardStyle}>
          <h3><FiCpu /> Apa itu AI.Ind?</h3>
          <p>
            AI.Ind adalah aplikasi asisten kecerdasan buatan
            yang dikembangkan secara mandiri oleh Indri Esti,
            seorang developer asal Indonesia.
          </p>
          <p>
            AI.Ind dibuat untuk membantu pengguna memperoleh
            informasi, menjawab pertanyaan, dan mendukung
            aktivitas sehari-hari melalui teknologi AI.
          </p>
        </section>

        <section style={cardStyle}>
          <h3><FiUser /> Pengembang</h3>
          <p>
            AI.Ind merupakan proyek personal yang dikembangkan
            secara mandiri oleh Indri Esti. Proyek ini menjadi
            bagian dari eksplorasi dan pengembangan teknologi
            kecerdasan buatan.
          </p>
        </section>

        <section style={cardStyle}>
          <h3><FiZap /> Tujuan Pembuatan</h3>
          <p>
            Mengembangkan asisten AI yang mudah digunakan,
            membantu pengguna mencari informasi, dan menjadi
            sarana untuk mengeksplorasi teknologi kecerdasan
            buatan.
          </p>
        </section>

        <section style={cardStyle}>
          <h3><FiMessageCircle /> Fitur AI.Ind</h3>
          <ul>
            <li>Chat dengan asisten AI</li>
            <li>Riwayat percakapan</li>
            <li>Interaksi dengan gambar</li>
            <li>Fitur generator video</li>
            <li>Login dan registrasi pengguna</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h3><FiCode /> Teknologi</h3>
          <p>
            AI.Ind dikembangkan menggunakan React dan
            teknologi web modern, dengan layanan backend
            untuk mendukung fitur asisten AI.
          </p>
        </section>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <FiGlobe size={22} color="#00cfff" />
          <p style={{ color: "#8295a8", fontSize: "13px" }}>
            AI.Ind — Personal AI Assistant
          </p>
          <p style={{ color: "#8295a8", fontSize: "12px" }}>
            Dikembangkan secara mandiri oleh Indri Esti
          </p>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#102235",
  border: "1px solid #1e3a50",
  borderRadius: "15px",
  padding: "22px",
  marginBottom: "18px",
  lineHeight: 1.8,
};

export default About;
