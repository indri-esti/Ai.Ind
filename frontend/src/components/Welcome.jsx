function Welcome({
  message,
  setMessage,
}) {
  return (
    <>
      <style>
        {`
          .welcome-modern {
            width: 100%;
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding:
              20px 10px 40px;
          }

          .welcome-content {
            width: 100%;
            max-width: 680px;
            text-align: center;
          }

          .welcome-logo {
            position: relative;
            width: 96px;
            height: 96px;
            margin: 0 auto 25px;
          }

          .welcome-glow {
            position: absolute;
            inset: -30px;
            border-radius: 50%;
            background:
              rgba(0,194,255,.09);
            filter: blur(30px);
          }

          .welcome-logo img {
            position: relative;
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            border-radius: 27px;
            border:
              1px solid
              rgba(24,216,255,.2);
            box-shadow:
              0 20px 60px
              rgba(0,194,255,.16);
          }

          .welcome-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 10px;
            margin-bottom: 13px;
            border:
              1px solid
              rgba(0,194,255,.12);
            border-radius: 999px;
            background:
              rgba(0,194,255,.05);
            color: #7191A2;
            font-size: 10px;
            font-weight: 600;
          }

          .welcome-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #00C2FF;
            box-shadow:
              0 0 9px
              rgba(0,194,255,.75);
          }

          .welcome-title {
            margin: 0;
            color: #FFFFFF;
            font-size:
              clamp(28px, 5vw, 43px);
            font-weight: 800;
            letter-spacing: -1.5px;
            line-height: 1.15;
          }

          .welcome-title span {
            color: #00C2FF;
          }

          .welcome-subtitle {
            margin:
              11px 0 0;
            color: #CDE4ED;
            font-size:
              clamp(14px, 2vw, 18px);
            font-weight: 600;
          }

          .welcome-description {
            max-width: 570px;
            margin:
              11px auto 0;
            color: #71899A;
            font-size: 13px;
            line-height: 1.75;
          }

          .welcome-suggestions {
            margin-top: 23px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
          }

          .welcome-suggestion {
            padding: 9px 14px;
            border:
              1px solid
              rgba(0,194,255,.13);
            border-radius: 999px;
            background:
              rgba(13,35,49,.72);
            color: #8EACBC;
            font-size: 11px;
            cursor: pointer;
            transition: .2s ease;
          }

          .welcome-suggestion:hover {
            color: #DDF8FF;
            border-color:
              rgba(0,194,255,.35);
            background:
              rgba(0,194,255,.08);
            transform:
              translateY(-1px);
          }

          .welcome-hint {
            margin-top: 18px;
            color: #405969;
            font-size: 9px;
          }

          @media (max-width: 767px) {
            .welcome-modern {
              padding:
                10px 8px 25px;
            }

            .welcome-logo {
              width: 78px;
              height: 78px;
              margin-bottom: 18px;
            }

            .welcome-logo img {
              border-radius: 21px;
            }

            .welcome-eyebrow {
              margin-bottom: 10px;
              padding:
                5px 8px;
              font-size: 9px;
            }

            .welcome-title {
              font-size:
                clamp(25px, 8vw, 34px);
              letter-spacing: -.9px;
            }

            .welcome-subtitle {
              margin-top: 8px;
              font-size: 14px;
            }

            .welcome-description {
              padding: 0 12px;
              font-size: 11px;
              line-height: 1.6;
            }

            .welcome-suggestions {
              margin-top: 15px;
              gap: 6px;
            }

            .welcome-suggestion {
              padding:
                8px 10px;
              font-size: 10px;
            }

            .welcome-hint {
              font-size: 8px;
              margin-top: 13px;
            }
          }
        `}
      </style>

      <div className="welcome-modern">
        <div className="welcome-content">

          <div className="welcome-logo">
            <div className="welcome-glow" />

            <img
              src="/logo.svg"
              alt="AI.Ind"
            />
          </div>

          <div className="welcome-eyebrow">
            <span className="welcome-dot" />
            AI Assistant
          </div>

          <h1 className="welcome-title">
            Selamat datang di{" "}
            <span>AI.Ind</span>
          </h1>

          <div className="welcome-subtitle">
            Asisten AI buatan Indonesia 🇮🇩
          </div>

          <p className="welcome-description">
            Teman cerdas untuk belajar,
            mencari ide, memahami sesuatu,
            membuat kode, menganalisis
            gambar, dan membantu berbagai
            aktivitasmu.
          </p>

          <div className="welcome-suggestions">

            {[
              "Bantu belajar",
              "Cari ide",
              "Jelaskan sesuatu",
              "Bantu coding",
            ].map((item) => (
              <button
                key={item}
                type="button"
                className="welcome-suggestion"
                onClick={() =>
                  setMessage(item)
                }
              >
                {item}
              </button>
            ))}

          </div>

          <div className="welcome-hint">
            Tulis pesan di bawah untuk
            memulai percakapan
          </div>

        </div>
      </div>
    </>
  );
}

export default Welcome;
