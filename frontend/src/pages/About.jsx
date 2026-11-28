
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiCpu,
  FiCode,
  FiUser,
  FiMessageCircle,
  FiGlobe,
  FiZap,
  FiGithub,
  FiExternalLink,
  FiServer,
  FiLayers,
} from "react-icons/fi";

function About() {
  return (
    <div className="about-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .about-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 0%, #12334b 0%, transparent 45%),
            #081420;
          color: #e8f1fa;
          padding: 30px 20px 50px;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }

        .about-container {
          max-width: 900px;
          margin: auto;
        }

        .about-back {
          color: #36cfff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 35px;
          transition: 0.3s;
        }

        .about-back:hover {
          color: white;
          transform: translateX(-5px);
        }

        .about-hero {
          text-align: center;
          margin-bottom: 45px;
          animation: aboutFade 0.8s ease both;
        }

        .about-logo {
          font-size: clamp(42px, 8vw, 58px);
          font-weight: bold;
          letter-spacing: 2px;
          margin: 0 0 12px;
          text-shadow: 0 0 25px rgba(0, 207, 255, 0.25);
        }

        .about-logo span {
          color: #00cfff;
        }

        .about-subtitle {
          color: #36cfff;
          font-size: 15px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .about-description {
          color: #a9b9c9;
          line-height: 1.8;
          max-width: 600px;
          margin: auto;
        }

        .about-card {
          background: rgba(16, 34, 53, 0.88);
          border: 1px solid #1e3a50;
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 20px;
          line-height: 1.8;
          animation: aboutFade 0.8s ease both;
          transition: transform 0.3s, border-color 0.3s,
            box-shadow 0.3s;
        }

        .about-card:hover {
          transform: translateY(-5px);
          border-color: #00cfff;
          box-shadow: 0 10px 30px rgba(0, 207, 255, 0.08);
        }

        .about-card h2 {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #36cfff;
          font-size: 19px;
          margin: 0 0 15px;
        }

        .about-card h2 svg {
          flex-shrink: 0;
        }

        .about-card p {
          color: #c0cedb;
          margin: 8px 0;
        }

        .about-card ul {
          color: #c0cedb;
          padding-left: 22px;
          margin-bottom: 0;
        }

        .about-card li {
          margin-bottom: 7px;
        }

        .about-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
          margin-top: 18px;
        }

        .about-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 15px 10px;
          border-radius: 12px;
          text-decoration: none;
          color: #e8f1fa;
          background: #142d43;
          border: 1px solid #28506b;
          font-size: 14px;
          font-weight: bold;
          transition: 0.3s;
        }

        .about-link:hover {
          background: #00a9d4;
          border-color: #00cfff;
          color: #061522;
          transform: translateY(-4px);
        }

        .about-footer {
          text-align: center;
          margin-top: 45px;
          color: #8295a8;
          animation: aboutFade 1.2s ease both;
        }

        .about-footer svg {
          color: #00cfff;
        }

        .about-footer p {
          margin: 8px 0;
        }

        @keyframes aboutFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 600px) {
          .about-page {
            padding: 22px 15px 35px;
          }

          .about-card {
            padding: 19px;
          }

          .about-card h2 {
            font-size: 17px;
          }

          .about-links {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-page *,
          .about-page *::before,
          .about-page *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="about-container">
        <Link to="/" className="about-back">
          <FiArrowLeft />
          Kembali ke AI.Ind
        </Link>

        <header className="about-hero">
          <h1 className="about-logo">
            AI<span>.</span>Ind
          </h1>

          <p className="about-subtitle">
            Personal AI Assistant
          </p>

          <h2>Tentang AI.Ind</h2>

          <p className="about-description">
            Mengenal AI.Ind, aplikasi asisten kecerdasan
            buatan yang dikembangkan secara mandiri oleh
            Indri Esti, developer asal Indonesia.
          </p>
        </header>

        <main>
          <section className="about-card">
            <h2>
              <FiCpu />
              Apa itu AI.Ind?
            </h2>

            <p>
              AI.Ind adalah aplikasi Personal AI Assistant
              atau asisten kecerdasan buatan yang
              dikembangkan secara mandiri oleh Indri Esti,
              seorang developer asal Indonesia.
            </p>

            <p>
              AI.Ind merupakan proyek teknologi Artificial
              Intelligence (AI) yang dirancang untuk membantu
              pengguna memperoleh informasi, menjawab
              pertanyaan, dan mendukung aktivitas sehari-hari
              melalui teknologi kecerdasan buatan.
            </p>
          </section>

          <section className="about-card">
            <h2>
              <FiUser />
              Pengembang AI.Ind
            </h2>

            <p>
              AI.Ind dibuat dan dikembangkan secara mandiri
              oleh <strong>Indri Esti</strong>, developer
              asal Indonesia.
            </p>

            <p>
              Proyek ini menjadi bagian dari eksplorasi,
              pembelajaran, dan pengembangan teknologi
              kecerdasan buatan serta aplikasi berbasis web.
            </p>
          </section>

          <section className="about-card">
            <h2>
              <FiZap />
              Tujuan Pembuatan
            </h2>

            <p>
              AI.Ind dikembangkan untuk menghadirkan asisten
              AI yang mudah digunakan, membantu pengguna
              mencari informasi, menjawab pertanyaan, dan
              mengeksplorasi perkembangan teknologi AI.
            </p>
          </section>

          <section className="about-card">
            <h2>
              <FiMessageCircle />
              Fitur AI.Ind
            </h2>

            <ul>
              <li>AI Chat Assistant untuk berinteraksi dengan AI.</li>
              <li>Riwayat percakapan.</li>
              <li>Interaksi dengan gambar.</li>
              <li>AI Video Generator.</li>
              <li>Login dan registrasi pengguna.</li>
            </ul>
          </section>

          <section className="about-card">
            <h2>
              <FiLayers />
              Teknologi yang Digunakan
            </h2>

            <p>
              AI.Ind dibangun menggunakan teknologi web
              modern dan layanan backend untuk mendukung
              sistem asisten kecerdasan buatan.
            </p>

            <ul>
              <li>React.js dan JavaScript.</li>
              <li>Python dan FastAPI.</li>
              <li>SQLite / Turso.</li>
              <li>REST API.</li>
              <li>Vercel untuk hosting website.</li>
            </ul>
          </section>

          <section className="about-card">
            <h2>
              <FiGlobe />
              Website dan Proyek Resmi
            </h2>

            <p>
              Kunjungi website AI.Ind atau lihat repositori
              pengembangan proyek melalui tautan berikut.
            </p>

            <div className="about-links">
              <a
                href="https://ai-ind.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <FiGlobe />
                Website AI.Ind
                <FiExternalLink />
              </a>

              <a
                href="https://github.com/indri-esti/Ai.Ind"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <FiGithub />
                GitHub
                <FiExternalLink />
              </a>

              <a
                href="https://vercel.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <FiServer />
                Vercel
                <FiExternalLink />
              </a>
            </div>
          </section>
        </main>

        <footer className="about-footer">
          <FiGlobe size={25} />

          <p>
            <strong>AI.Ind — Personal AI Assistant</strong>
          </p>

          <p>
            Dikembangkan secara mandiri oleh Indri Esti
          </p>

          <p>
            © 2026 AI.Ind. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default About;
